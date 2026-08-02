This is a little personal side project to practice ReactJS and Material-UI.
This project builds a web site to show R16 main draws of ITTF(International Table Tennis Foundation) world tours, and will show Youtube videos of each match inside a dialog after user click the node from SVG, and there is a Python crawler to get data of draws and video url.
Demo: https://wadetsai.github.io/ITTFWorldTours/

## Stack

| | |
| --- | --- |
| Build | Vite 8 (replaces Create React App) |
| Language | TypeScript 7 (strict) |
| UI | React 19, MUI 9, `@mui/x-tree-view` 9 |
| Bracket | `react-tree-graph` 8 |
| Tests | Vitest 4 + Testing Library, jsdom |
| Lint | oxlint |

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # typecheck, then build to dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
npm run test       # run the Vitest suite once
npm run lint       # oxlint
npm run deploy     # publish dist/ to the gh-pages branch
```

## Data

`JSON/` holds one bracket (`<eventId><group>_tree.json`) and one video map
(`<eventId><group>_videos.json`) per draw, produced by `JSON/genJSON.py`.
`src/data.ts` pulls them into the bundle with `import.meta.glob`, and
`src/events.ts` lists the event ids that make up each season — add a new event
in both places.

Matches ITTF never filmed are stored as `null` and fall back to `public/404.html`.

results.ittf.com and worldtabletennis.com number their events independently, so
the two id spaces overlap: `2873` is both the 2018 ITTF Men's World Cup and WTT
Contender Almaty 2024. Legacy files carry an `ittf` prefix (`ittf2873MS_tree.json`)
wherever that happens, which is why an event id is any word, not just digits.

Most events run both singles draws. The two that do not are listed in
`SINGLE_GROUP_EVENTS` in `src/events.ts`: WTT split the 2023 Finals by gender and
staged them months apart, women in Nagoya and men in Doha.

## Scraper

`JSON/genJSON.py` pulls draws from **worldtabletennis.com** and looks each match
up on YouTube. Events moved there from results.ittf.com when the ITTF World Tour
became the WTT series, so the old ITTF scrape no longer finds current events.

```bash
pip install -r JSON/requirements.txt      # no `playwright install` needed

python JSON/genJSON.py --list 2025               # find event ids for a season
python JSON/genJSON.py --list 2025 --filter smash
python JSON/genJSON.py 3085 3086                 # both draws of two events
python JSON/genJSON.py 3085 --groups MS          # men's singles only
python JSON/genJSON.py 3085 --dry-run            # fetch, write nothing
python JSON/genJSON.py 3085 --skip-videos        # brackets only, no YouTube
```

WTT ids are not guessable, hence `--list`. Files land next to the script by
default; use `--output-dir` to send them elsewhere. A draw that fails is logged
and skipped rather than aborting the run, and the exit code counts the failures.

**Adding a scraped event to the site** takes a second step: put its id and
Chinese name in `src/events.ts` (`EVENT_NAMES` plus the right `SEASONS` entry).
`src/data.test.ts` asserts the JSON files and that list agree, so it will fail
until both sides match.

### How it works

WTT's site is a single page app over public JSON endpoints, so the scraper calls
them directly and never launches a browser:

| Endpoint | Purpose |
| --- | --- |
| `GetEventName/<eventId>` | event title |
| `GetBrackets/<eventId>/<subEventCode>` | the whole draw, round by round |
| `<year>_eventcalendar.json` | the `--list` listing |

The sub-event code is `TTEMSINGLES`/`TTEWSINGLES` dash-padded to 42 characters,
and the endpoints return HTTP 422 without a `worldtabletennis.com` `Origin`.

Only the `MAIN` bracket is read, and only its last four rounds — `FNL-`, `SFNL`,
`QFNL` and `8FNL` (WTT's name for the round of 16), which is exactly the 15
matches the app draws. Qualifying (`PREL`) and the earlier `R32-`/`R64-` rounds
are ignored. The bracket is nested by following each competitor's
`PreviousUnit` link rather than assuming one round's positions feed the next, so
byes cannot silently mis-pair it.

Player names come from `Description.TeamName`, which only the 2024-and-later
draws fill in. Older events leave it empty and carry just the athlete record, so
the scraper falls back to `FamilyName GivenName` — the same "OVTCHAROV Dimitrij"
form the newer `TeamName` values already use.

Video ids are read from the search page's own `ytInitialData` payload, taking
the first `videoRenderer` so ads and shelves are skipped. An earlier version
sliced 11 characters at a fixed offset after the first literal `videoId` in the
markup, which is how ids such as `fchannel` reached `5016MS`/`5016WS` (those
three entries are pinned in `src/data.test.ts` until the draws are re-scraped).

## Notes

- TypeScript 7 is the native compiler, so it ships no `tsserver`. Leave VS Code
  on its bundled TypeScript, or install the TypeScript Native Preview extension;
  do not point `typescript.tsdk` at `node_modules/typescript`.
- For the same reason typescript-eslint cannot run on TS 7 yet
  ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)),
  which is why linting is oxlint.
