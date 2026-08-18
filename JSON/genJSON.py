"""Generate the bracket and video JSON files consumed by the web app.

Data comes from worldtabletennis.com. Most events moved there from
results.ittf.com after the ITTF World Tour became the WTT series, so the old
Selenium scrape of the ITTF results page no longer finds anything.

WTT's site is a single page app backed by plain JSON endpoints, so this fetches
those directly with Playwright's request API instead of driving a browser:

    GetEventName/<eventId>                   the event title
    GetBrackets/<eventId>/<subEventCode>     the full draw, round by round

For every requested event this writes two files per singles draw, in the same
format as the files already in this folder:

    <eventId><group>_tree.json     the bracket, nested final -> round of 16
    <eventId><group>_videos.json   match name -> YouTube id (null when unfilmed)

and records the event in registry.json, which is what the app reads to decide
which draws exist. Bracket files and registry entries have to stay in lockstep
(src/data.test.ts asserts they match exactly), so both are written here rather
than one by hand.

Usage:
    python genJSON.py --list 2025          # find event ids for a season
    python genJSON.py --sync               # scrape whatever this season is missing
    python genJSON.py --sync 2025          # ... for a specific season
    python genJSON.py 3085 3086            # both singles draws of two events
    python genJSON.py 3085 --groups MS     # men's singles only
    python genJSON.py 3085 --dry-run       # fetch, write nothing
"""

import argparse
import json
import logging
import re
import sys
import time
import urllib.parse
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

from playwright.sync_api import APIRequestContext, Playwright
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

LOGGER = logging.getLogger("genJSON")

WTT_API = (
    "https://wtt-website-api-vm-frontdoor-hhaec5epbhdyfugz.a01.azurefd.net"
    "/liveeventsapi/api/cms"
)
WTT_CALENDAR = "https://www.worldtabletennis.com/assets/json/{year}_eventcalendar.json"
YOUTUBE_SEARCH_URL = "https://www.youtube.com/results?search_query={query}"

#: The draw a group maps to, and the label WTT prints for it.
SUB_EVENTS = {"MS": "MSINGLES", "WS": "WSINGLES"}

#: The app's event list, next to the bracket files it indexes.
REGISTRY_NAME = "registry.json"

#: The series this site covers: the senior WTT tour plus the ITTF majors that
#: run a 16-player singles draw.
#:
#: The calendar carries every sanctioned event of the year - 190 of them in 2026
#: - so without this filter a sync would chase 170 youth, feeder, regional and
#: veterans draws the app has never shown.
SERIES_COVERED = re.compile(
    r"smash"
    r"|wtt champions"
    r"|wtt (?:star )?contender"
    r"|wtt (?:cup )?finals"
    r"|world cup"
    r"|world table tennis championships finals",
    re.IGNORECASE,
)

#: Checked before SERIES_COVERED, because the junior and second-tier events are
#: named after the senior ones they mirror ("WTT Youth Star Contender Tunis",
#: "Singapore Youth Smash"). `team` drops the team championships and the mixed
#: team World Cup, which have no singles bracket to scrape at all.
SERIES_EXCLUDED = re.compile(
    r"youth|feeder|u1[13579]|para|masters|veteran|hopes|team|olympic|regional",
    re.IGNORECASE,
)

#: The trailing season in a calendar name ("China Smash 2026"). The sidebar
#: already shows the year, so the registry leaves it off.
YEAR_SUFFIX = re.compile(r"\s+(?:19|20)\d{2}\s*$")

#: WTT writes "Men's" with a curly apostrophe in the calendar and a straight one
#: elsewhere. The registry keeps the straight form the older entries use.
TYPOGRAPHIC = {"’": "'", "‘": "'", "“": '"', "”": '"'}

#: Sub event codes are dash padded to a fixed width, e.g.
#: "TTEMSINGLES-------------------------------".
SUB_EVENT_CODE_WIDTH = 42

#: Main-draw round codes, final first. WTT calls the round of 16 "8FNL"
#: (the round of the last 8 ties). Together these are the 15 matches the app
#: renders; earlier rounds (R32-, R64-) and qualifying (the PREL bracket) are
#: deliberately ignored.
KNOCKOUT_ROUNDS = ("FNL-", "SFNL", "QFNL", "8FNL")
MATCHES_PER_DRAW = 15

#: How long after an event starts a missing draw stops being "in progress".
#:
#: A sync run finds events that are still being played, and their brackets
#: cannot be built until the round of 16 is complete, so those are skipped
#: quietly and picked up the following week. No WTT event runs anywhere near
#: this long, so a draw still missing after it is a real failure worth reporting
#: - otherwise a change at WTT's end would leave the weekly job silently
#: scraping nothing.
SETTLED_DAYS = 14

#: Sponsor and series noise stripped from the event title before searching
#: YouTube. Order matters: the longer forms have to go first.
TITLE_NOISE = (
    ("Seamaster ", ""),
    ("Liebherr ", ""),
    (" ITTF World Tour", ""),
    ("ITTF World Tour", "2018"),
    (" Platinum", ""),
    ("LIEBHERR ", ""),
    (" Hang Seng", ""),
    (",", ""),
    ("  ", " "),
)

#: WTT appends naming-rights text to a lot of events, e.g. "China Smash 2025
#: Presented by Beijing Shijingshan Culture & Tourism Group". It never appears
#: in video titles, so it only hurts the search.
PRESENTED_BY = re.compile(r"\s+Presented by\s+.*$", re.IGNORECASE)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

#: The WTT endpoints reject requests that do not look like they came from the
#: site itself (HTTP 422 without these).
WTT_HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.worldtabletennis.com",
    "Referer": "https://www.worldtabletennis.com/",
}


@dataclass(frozen=True)
class Draw:
    """One singles draw of one event."""

    event_id: str
    group: str

    @property
    def sub_event(self) -> str:
        return SUB_EVENTS[self.group]

    @property
    def code(self) -> str:
        return f"TTE{self.sub_event}".ljust(SUB_EVENT_CODE_WIDTH, "-")

    @property
    def stem(self) -> str:
        return f"{self.event_id}{self.group}"


@dataclass(frozen=True)
class CalendarEvent:
    """One row of a season's event calendar."""

    event_id: str
    name: str
    #: ISO date. Only used to skip events that have not been played yet.
    start: str


# --------------------------------------------------------------------------- #
# Pure helpers (no network)
# --------------------------------------------------------------------------- #


def display_name(calendar_name: str) -> str:
    """The registry name for an event, from the one the calendar publishes.

    >>> display_name("Singapore Smash 2026 Presented by Resorts World Sentosa ")
    'Singapore Smash'
    """
    name = PRESENTED_BY.sub("", calendar_name)
    name = YEAR_SUFFIX.sub("", name)
    for curly, straight in TYPOGRAPHIC.items():
        name = name.replace(curly, straight)
    return " ".join(name.split())


def is_covered(calendar_name: str) -> bool:
    """Whether this is one of the series the site shows."""
    if SERIES_EXCLUDED.search(calendar_name):
        return False
    return bool(SERIES_COVERED.search(calendar_name))


def days_since(start: str) -> int | None:
    """Days since an ISO date, or None if the calendar gave us something else."""
    try:
        return (date.today() - date.fromisoformat(start)).days
    except ValueError:
        return None


def search_terms(event_title: str, player1: str, player2: str) -> str:
    """Build the YouTube query for a match."""
    search = PRESENTED_BY.sub("", event_title)
    for old, new in TITLE_NOISE:
        search = search.replace(old, new)
    return f"{search} {player1} {player2}"


def competitors(match: dict[str, Any]) -> list[dict[str, Any]]:
    """The two sides of a tie, ordered as the draw lists them."""
    places = match.get("CompetitorPlace") or []
    return sorted(places, key=lambda place: place.get("Pos") or 0)


def athlete_name(athlete: dict[str, Any]) -> str:
    """``"OVTCHAROV Dimitrij"`` — family name first, as WTT prints it."""
    description = athlete.get("Description") or {}
    family = (description.get("FamilyName") or "").strip()
    given = (description.get("GivenName") or "").strip()
    return f"{family} {given}".strip()


def player_name(place: dict[str, Any]) -> str:
    """The side's display name.

    Events from roughly 2024 on fill in ``Description.TeamName``. Older ones
    (the 2021-2023 draws, and a few later stragglers) leave it as an empty
    string and only carry the athlete record, which is why an earlier run
    produced names like `" 4:0 "` and searched YouTube for the event title
    alone. Falling back to the composition rebuilds the same
    "FAMILYNAME Given" form those newer TeamName values already use.
    """
    competitor = place.get("Competitor") or {}
    description = competitor.get("Description") or {}
    name = (description.get("TeamName") or "").strip()
    if name:
        return name

    composition = competitor.get("Composition") or {}
    athletes = composition.get("Athlete") or []
    # Singles draws have one athlete; join anyway so a doubles draw degrades
    # to "A / B" rather than silently dropping a partner.
    return " / ".join(filter(None, (athlete_name(a) for a in athletes)))


def match_name(match: dict[str, Any]) -> str:
    """Render a tie as ``"<player1> <games1>:<games2> <player2>"``.

    This is the key shared by both JSON files, so it has to stay byte for byte
    what the app already looks up.
    """
    places = competitors(match)
    if len(places) != 2:
        raise ValueError(f"{match.get('Code')} has {len(places)} competitors, expected 2")
    first, second = places
    return (
        f"{player_name(first)} {first.get('Result') or '0'}"
        f":{second.get('Result') or '0'} {player_name(second)}"
    )


def main_bracket(payload: dict[str, Any]) -> dict[str, Any]:
    """The main draw, as opposed to the PREL (qualifying) bracket."""
    competition = payload.get("Competition") or {}
    brackets = competition.get("Bracket") or []
    for bracket in brackets:
        if bracket.get("Code") == "MAIN":
            return bracket
    raise ValueError(f"no MAIN bracket (found {[b.get('Code') for b in brackets]})")


def rounds_by_code(bracket: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    return {
        group.get("Code"): group.get("BracketItem") or []
        for group in bracket.get("BracketItems") or []
    }


def index_matches(bracket: dict[str, Any]) -> dict[str, dict[str, Any]]:
    """Every match in the draw, keyed by its unit code."""
    index: dict[str, dict[str, Any]] = {}
    for matches in rounds_by_code(bracket).values():
        for match in matches:
            code = match.get("Code")
            if code:
                index[code] = match
    return index


@dataclass
class Node:
    """One tie plus the two ties that fed it."""

    match: dict[str, Any]
    children: list["Node"]


def build_nodes(
    by_code: dict[str, dict[str, Any]], code: str, levels_remaining: int
) -> Node:
    """Nest the draw from the final down to the round of 16.

    Children are resolved through each competitor's ``PreviousUnit`` link
    rather than by assuming a position in one round feeds a position in the
    next, so byes and re-seeded draws cannot silently mis-pair the bracket.
    """
    match = by_code[code]
    if levels_remaining <= 1:
        return Node(match, [])

    children: list[Node] = []
    for place in competitors(match):
        previous = place.get("PreviousUnit") or {}
        unit = previous.get("Unit")
        if not unit:
            LOGGER.warning("  %s: %s has no previous match (bye?)", code, player_name(place))
            continue
        if unit not in by_code:
            LOGGER.warning("  %s: previous match %s is missing from the draw", code, unit)
            continue
        children.append(build_nodes(by_code, unit, levels_remaining - 1))

    return Node(match, children)


def to_tree(node: Node) -> dict[str, Any]:
    """The nested shape written to ``_tree.json``. Leaves carry no ``children``."""
    entry: dict[str, Any] = {"name": match_name(node.match)}
    if node.children:
        entry["children"] = [to_tree(child) for child in node.children]
    return entry


def in_round_order(root: Node) -> list[dict[str, Any]]:
    """Raw matches, round of 16 first, matching the previous file ordering."""
    levels: list[list[Node]] = []
    current = [root]
    while current:
        levels.append(current)
        current = [child for node in current for child in node.children]
    return [node.match for level in reversed(levels) for node in level]


def _walk(node: Any) -> Iterator[dict[str, Any]]:
    """Yield every dict inside a decoded JSON document, in document order."""
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from _walk(value)
    elif isinstance(node, list):
        for value in node:
            yield from _walk(value)


def extract_yt_initial_data(html: str) -> dict[str, Any] | None:
    """Pull the ``ytInitialData`` blob out of a YouTube search page.

    Uses ``raw_decode`` from the opening brace rather than a regex, so nested
    braces and escaped quotes inside the payload cannot truncate the match.
    """
    marker = "ytInitialData"
    decoder = json.JSONDecoder()
    position = html.find(marker)

    while position != -1:
        brace = html.find("{", position)
        if brace == -1:
            return None
        try:
            data, _ = decoder.raw_decode(html, brace)
        except json.JSONDecodeError:
            position = html.find(marker, position + len(marker))
            continue
        return data if isinstance(data, dict) else None

    return None


def is_video_id(value: str) -> bool:
    """YouTube ids are exactly 11 URL-safe base64 characters."""
    return len(value) == 11 and all(c.isalnum() or c in "-_" for c in value)


def first_video_id(html: str) -> str | None:
    """Return the id of the first organic video on a YouTube search page.

    An earlier version took ``str(soup.body).find("videoId") + 10`` and sliced
    11 characters. That offset picked up whatever happened to sit next to the
    first literal "videoId" in the markup, which is how ids such as "fchannel"
    ended up in 5016MS/5016WS. Reading the parsed structure and accepting only
    a ``videoRenderer`` skips ads, shelves and playlists.
    """
    data = extract_yt_initial_data(html)
    if data is None:
        return None

    for node in _walk(data):
        renderer = node.get("videoRenderer")
        if not isinstance(renderer, dict):
            continue
        video_id = renderer.get("videoId")
        if isinstance(video_id, str) and is_video_id(video_id):
            return video_id

    return None


# --------------------------------------------------------------------------- #
# Fetching
# --------------------------------------------------------------------------- #


def get_json(request: APIRequestContext, url: str) -> Any:
    response = request.get(url, headers=WTT_HEADERS)
    if not response.ok:
        raise ValueError(f"HTTP {response.status} for {url}")
    return response.json()


def event_title(request: APIRequestContext, event_id: str) -> str:
    payload = get_json(request, f"{WTT_API}/GetEventName/{event_id}")
    rows = payload if isinstance(payload, list) else [payload]
    for row in rows:
        name = (row or {}).get("eventName")
        if name:
            return str(name).strip()
    raise ValueError(f"event {event_id} has no name (does it exist?)")


def fetch_draw(request: APIRequestContext, draw: Draw) -> tuple[str, Node]:
    """Return the draw label ("Men's Singles") and the bracket."""
    payload = get_json(request, f"{WTT_API}/GetBrackets/{draw.event_id}/{draw.code}")

    sport = ((payload.get("Competition") or {}).get("ExtendedInfos") or {}).get(
        "SportDescription"
    ) or {}
    label = sport.get("EventName") or draw.sub_event

    bracket = main_bracket(payload)
    rounds = rounds_by_code(bracket)

    missing = [code for code in KNOCKOUT_ROUNDS if not rounds.get(code)]
    if missing:
        raise ValueError(
            f"draw is missing round(s) {missing} "
            f"(has {sorted(rounds)}; draw size {bracket.get('DrawSize')})"
        )

    final = rounds[KNOCKOUT_ROUNDS[0]][0]
    final_code = final.get("Code")
    if not final_code:
        raise ValueError("the final has no unit code")

    root = build_nodes(index_matches(bracket), final_code, len(KNOCKOUT_ROUNDS))

    found = len(in_round_order(root))
    if found != MATCHES_PER_DRAW:
        raise ValueError(
            f"built {found} matches, expected {MATCHES_PER_DRAW} "
            "(the draw may be incomplete)"
        )

    return label, root


def find_video(request: APIRequestContext, query: str) -> str | None:
    """Search YouTube and return the top video id, or None when nothing fits."""
    url = YOUTUBE_SEARCH_URL.format(query=urllib.parse.quote_plus(query))
    try:
        response = request.get(url)
    except PlaywrightError as exc:
        LOGGER.warning("  search failed (%s): %s", exc, query)
        return None

    if not response.ok:
        LOGGER.warning("  search returned HTTP %s: %s", response.status, query)
        return None

    video_id = first_video_id(response.text())
    if video_id is None:
        LOGGER.warning("  no video found: %s", query)
    return video_id


def scrape_draw(
    request: APIRequestContext,
    draw: Draw,
    title: str,
    *,
    delay: float,
    skip_videos: bool,
) -> tuple[dict[str, Any], dict[str, str | None]]:
    label, root = fetch_draw(request, draw)
    LOGGER.info("Crawling %s %s %s", draw.event_id, title, label)

    videos: dict[str, str | None] = {"Event": f"{title} {label}"}

    for match in in_round_order(root):
        name = match_name(match)
        if skip_videos:
            videos[name] = None
            continue
        first, second = competitors(match)
        query = search_terms(title, player_name(first), player_name(second))
        LOGGER.info("  search: %s", query)
        videos[name] = find_video(request, query)
        if delay:
            time.sleep(delay)

    return to_tree(root), videos


def write_json(path: Path, payload: Any, *, dry_run: bool) -> None:
    if dry_run:
        LOGGER.info("  would write %s", path.name)
        return
    # ensure_ascii=False keeps player names readable, matching the files
    # already committed under JSON/.
    with path.open("w", encoding="utf-8") as output:
        json.dump(payload, output, indent=4, ensure_ascii=False)
    LOGGER.info("  wrote %s", path.name)


def calendar_events(request: APIRequestContext, year: str) -> list[CalendarEvent]:
    """A season's events, deduplicated and in the order they are played."""
    payload = get_json(request, WTT_CALENDAR.format(year=year))
    rows = payload[0]["rows"] if isinstance(payload, list) else payload["rows"]

    events: dict[str, CalendarEvent] = {}
    for row in rows:
        event_id = str(row.get("EventId") or "").strip()
        if not event_id:
            continue
        # The calendar repeats an event once per sub-event it stages - four rows
        # for ITTF-Africa Senior Championships 2026 - so the first row wins.
        events.setdefault(
            event_id,
            CalendarEvent(
                event_id=event_id,
                name=str(row.get("EventName") or "").strip(),
                start=str(row.get("StartDateTime") or "")[:10],
            ),
        )

    return sorted(events.values(), key=lambda event: (event.start, event.event_id))


def list_events(request: APIRequestContext, year: str, needle: str = "") -> None:
    events = calendar_events(request, year)
    LOGGER.info("%s events in %s", len(events), year)
    for event in events:
        if needle and needle.lower() not in event.name.lower():
            continue
        covered = "" if is_covered(event.name) else "  (not a series this site covers)"
        LOGGER.info("%-8s %-11s %s%s", event.event_id, event.start, event.name, covered)


# --------------------------------------------------------------------------- #
# The registry the app reads
# --------------------------------------------------------------------------- #


def load_registry(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_registry(path: Path, registry: list[dict[str, Any]], *, dry_run: bool) -> None:
    if dry_run:
        LOGGER.info("would update %s", path.name)
        return
    with path.open("w", encoding="utf-8") as output:
        json.dump(registry, output, indent=4, ensure_ascii=False)
        output.write("\n")
    LOGGER.info("updated %s (%d events)", path.name, len(registry))


def registered_groups(registry: list[dict[str, Any]], event_id: str) -> set[str] | None:
    """The draws already on record for an event, or None if it is not listed."""
    for entry in registry:
        if entry.get("id") == event_id:
            return set(entry.get("groups") or SUB_EVENTS)
    return None


def register(
    registry: list[dict[str, Any]],
    event_id: str,
    name: str,
    year: int,
    groups: set[str],
) -> None:
    """Add or update one event.

    Seasons stay newest first and events stay chronological within a season,
    which is the order the sidebar renders them. Nothing sorts the file: events
    are appended as they are played, and a season the registry has never seen is
    by definition the newest one.
    """
    entry: dict[str, Any] = {"id": event_id, "name": name, "year": year}
    if groups != set(SUB_EVENTS):
        entry["groups"] = [group for group in sorted(SUB_EVENTS) if group in groups]

    for index, existing in enumerate(registry):
        if existing.get("id") == event_id:
            # Keep the name on record; it may have been corrected by hand.
            entry["name"] = existing.get("name") or name
            registry[index] = entry
            return

    last_of_season = max(
        (index for index, other in enumerate(registry) if other.get("year") == year),
        default=None,
    )
    registry.insert(0 if last_of_season is None else last_of_season + 1, entry)


# --------------------------------------------------------------------------- #
# Entry point
# --------------------------------------------------------------------------- #


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("events", nargs="*", help="WTT event ids, e.g. 3085 3086")
    parser.add_argument(
        "--list",
        metavar="YEAR",
        help="list that season's events with their ids, then exit",
    )
    parser.add_argument(
        "--filter",
        default="",
        help="with --list, only show events whose name matches this text",
    )
    parser.add_argument(
        "--sync",
        nargs="?",
        const=str(date.today().year),
        metavar="YEAR",
        help=(
            "scrape and register every event of a season that the site covers "
            "but does not have yet (default: this year)"
        ),
    )
    parser.add_argument(
        "--groups",
        nargs="+",
        choices=sorted(SUB_EVENTS),
        default=sorted(SUB_EVENTS),
        help="draws to scrape (default: both)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parent,
        help="where the JSON files are written (default: this script's folder)",
    )
    parser.add_argument("--dry-run", action="store_true", help="fetch but write nothing")
    parser.add_argument("--skip-videos", action="store_true", help="build brackets only")
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="seconds to pause between YouTube searches (default: 1.0)",
    )

    args = parser.parse_args(argv)
    if not args.events and not args.list and not args.sync:
        parser.error(
            "give at least one event id, --sync to fetch this season's missing "
            "events, or --list YEAR to find some ids"
        )
    return args


def scrape_event(
    request: APIRequestContext,
    event_id: str,
    groups: list[str],
    args: argparse.Namespace,
) -> set[str]:
    """Scrape the requested draws of one event; return the ones that produced files.

    A draw that will not build is skipped rather than fatal, so one unplayed
    half of an event does not lose the other.
    """
    title = event_title(request, event_id)
    scraped: set[str] = set()

    for group in groups:
        draw = Draw(event_id, group)
        try:
            tree, videos = scrape_draw(
                request, draw, title, delay=args.delay, skip_videos=args.skip_videos
            )
        except (PlaywrightError, ValueError, KeyError) as exc:
            LOGGER.warning("Skipping %s: %s", draw.stem, exc)
            continue

        args.output_dir.mkdir(parents=True, exist_ok=True)
        write_json(args.output_dir / f"{draw.stem}_tree.json", tree, dry_run=args.dry_run)
        write_json(args.output_dir / f"{draw.stem}_videos.json", videos, dry_run=args.dry_run)
        scraped.add(group)

    return scraped


def scrape_ids(request: APIRequestContext, args: argparse.Namespace) -> int:
    """Scrape the event ids named on the command line."""
    registry = load_registry(args.output_dir / REGISTRY_NAME)
    failures = 0

    for event_id in (str(event) for event in args.events):
        try:
            scraped = scrape_event(request, event_id, args.groups, args)
        except (PlaywrightError, ValueError) as exc:
            LOGGER.error("Skipping event %s: %s", event_id, exc)
            failures += len(args.groups)
            continue

        failures += len(set(args.groups) - scraped)
        if scraped and registered_groups(registry, event_id) is None:
            LOGGER.warning(
                "%s is not listed in %s, so the app will not show it - "
                "run --sync to register it",
                event_id,
                REGISTRY_NAME,
            )

    return failures


def sync_season(request: APIRequestContext, args: argparse.Namespace) -> int:
    """Scrape and register every event of a season the site covers but lacks."""
    year = args.sync
    registry_path = args.output_dir / REGISTRY_NAME
    registry = load_registry(registry_path)
    today = date.today().isoformat()

    pending: list[tuple[CalendarEvent, list[str], set[str]]] = []
    upcoming = 0

    for event in calendar_events(request, year):
        if not is_covered(event.name):
            continue
        if event.start > today:
            upcoming += 1
            continue
        on_record = registered_groups(registry, event.event_id) or set()
        missing = [group for group in args.groups if group not in on_record]
        if missing:
            pending.append((event, missing, on_record))

    LOGGER.info(
        "%s: %d draw(s) to fetch across %d event(s), %d event(s) still to be played",
        year,
        sum(len(missing) for _event, missing, _on_record in pending),
        len(pending),
        upcoming,
    )
    if not pending:
        return 0

    failures = 0
    registered = 0

    for event, missing, on_record in pending:
        LOGGER.info("%s %s (from %s)", event.event_id, event.name, event.start)
        try:
            scraped = scrape_event(request, event.event_id, missing, args)
        except (PlaywrightError, ValueError) as exc:
            LOGGER.error("Skipping event %s: %s", event.event_id, exc)
            failures += 1
            continue

        if scraped:
            register(
                registry,
                event.event_id,
                display_name(event.name),
                int(year),
                on_record | scraped,
            )
            registered += 1
            continue

        elapsed = days_since(event.start)
        if elapsed is None or elapsed <= SETTLED_DAYS:
            LOGGER.info("  still in progress, leaving %s for the next run", event.event_id)
        else:
            LOGGER.error(
                "  %s started %d days ago and still has no complete draw",
                event.event_id,
                elapsed,
            )
            failures += 1

    if registered:
        save_registry(registry_path, registry, dry_run=args.dry_run)
    else:
        LOGGER.info("nothing new to register")

    return failures


def run(playwright: Playwright, args: argparse.Namespace) -> int:
    request = playwright.request.new_context(user_agent=USER_AGENT)
    try:
        if args.list:
            list_events(request, args.list, args.filter)
            return 0
        if args.sync:
            return sync_season(request, args)
        return scrape_ids(request, args)
    finally:
        request.dispose()


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    with sync_playwright() as playwright:
        failures = run(playwright, args)

    if failures:
        LOGGER.error("%d failure(s)", failures)
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
