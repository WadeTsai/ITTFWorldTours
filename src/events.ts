import registryData from '../JSON/registry.json';
import type { Group } from './types';

/**
 * One event in `JSON/registry.json`.
 *
 * The registry is the single source of truth for which draws the site shows.
 * `JSON/genJSON.py` appends to it as it scrapes, so the bracket files and this
 * list cannot drift apart - `src/data.test.ts` asserts they match exactly.
 *
 * Names are the ones worldtabletennis.com publishes, minus the naming-rights
 * suffix ("... Presented by AITO") and the trailing year, which the season
 * heading already shows. The 2018-2020 ITTF World Tour events keep the Chinese
 * names they were first entered with.
 */
interface RegistryEntry {
  /**
   * Usually the WTT event id. results.ittf.com and worldtabletennis.com number
   * their events independently, so the two id spaces collide: `2873` is both
   * the 2018 ITTF Men's World Cup and WTT Contender Almaty 2024. The older
   * entry carries an `ittf` prefix to keep the WTT id free.
   */
  id: string;
  name: string;
  year: number;
  /** Only for the events that ran a single draw; both singles when absent. */
  groups?: readonly Group[];
}

/**
 * Registry order is meaningful: seasons run newest first, which is the order
 * the sidebar renders them, and events run chronologically inside a season.
 * The scraper appends, so events land in the order they were played.
 *
 * The cast is the JSON import boundary. TypeScript widens the `groups` arrays
 * to `string[]`, and only a `Group` can reach the rest of the app.
 */
const REGISTRY = registryData as readonly RegistryEntry[];

/** Event id -> display name. */
export const EVENT_NAMES: Record<string, string> = Object.fromEntries(
  REGISTRY.map((event) => [event.id, event.name]),
);

export const GROUP_NAMES: Record<Group, string> = {
  MS: '男子單打',
  WS: '女子單打',
};

const BOTH_GROUPS: readonly Group[] = ['MS', 'WS'];

/**
 * Events that ran only one singles draw.
 *
 * WTT split the 2023 Finals by gender and staged them months apart: the women
 * played Nagoya in December 2023, the men Doha in January 2024. Each is its own
 * event with a single draw, so neither has a counterpart to show.
 */
const SINGLE_GROUP_EVENTS = new Map<string, readonly Group[]>(
  REGISTRY.flatMap((event) => (event.groups ? [[event.id, event.groups] as const] : [])),
);

/** The draws an event actually has. Both singles unless the registry says otherwise. */
export function groupsOf(eventId: string): readonly Group[] {
  return SINGLE_GROUP_EVENTS.get(eventId) ?? BOTH_GROUPS;
}

export interface TourSeason {
  year: number;
  /** Event ids in chronological order. */
  eventIds: readonly string[];
}

/**
 * The registry grouped into seasons, both orders preserved as they appear in
 * the file. The sidebar reverses each season so the most recent event sits at
 * the top.
 *
 * This replaces the old `TTE > 4999 ? (TTE > 5100 ? 2020 : 2019) : 2018` check,
 * which relied on id ranges that only held by coincidence.
 */
export const SEASONS: readonly TourSeason[] = (() => {
  const years: number[] = [];
  const idsByYear = new Map<number, string[]>();

  for (const event of REGISTRY) {
    let ids = idsByYear.get(event.year);
    if (!ids) {
      ids = [];
      idsByYear.set(event.year, ids);
      years.push(event.year);
    }
    ids.push(event.id);
  }

  return years.map((year) => ({ year, eventIds: idsByYear.get(year) ?? [] }));
})();

/** The event shown when the app first loads: the newest one on record. */
export const LATEST_EVENT_ID = SEASONS[0]?.eventIds.at(-1) ?? '3112';

/** The season an event belongs to, or `undefined` if the id is unknown. */
export function seasonOf(eventId: string): number | undefined {
  return SEASONS.find((season) => season.eventIds.includes(eventId))?.year;
}

export function eventName(eventId: string): string {
  return EVENT_NAMES[eventId] ?? eventId;
}
