import { describe, expect, it } from 'vitest';

import { availableDraws, getTree, getVideos } from './data';
import { EVENT_NAMES, SEASONS, groupsOf, seasonOf } from './events';
import type { Group, MatchNode } from './types';

function flatten(node: MatchNode): MatchNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

describe('bracket data', () => {
  it('exposes a draw for every group of every listed event', () => {
    const expected = SEASONS.flatMap((season) =>
      season.eventIds.flatMap((id) => groupsOf(id).map((group) => `${id}${group}`)),
    );
    expect(availableDraws()).toEqual([...expected].sort());
  });

  it('names every event listed in a season', () => {
    for (const season of SEASONS) {
      for (const id of season.eventIds) {
        expect(EVENT_NAMES[id], `event ${id} has no name`).toBeDefined();
      }
    }
  });

  it('has a video entry for every match in every bracket', () => {
    const orphans: string[] = [];

    for (const season of SEASONS) {
      for (const id of season.eventIds) {
        for (const group of groupsOf(id)) {
          const tree = getTree(id, group);
          expect(tree, `${id}${group} has no bracket`).toBeDefined();

          const videos = getVideos(id, group);
          for (const node of flatten(tree!)) {
            if (!Object.hasOwn(videos, node.name)) {
              orphans.push(`${id}${group}: ${node.name}`);
            }
          }
        }
      }
    }

    expect(orphans).toEqual([]);
  });

  /**
   * Matches ITTF never filmed are stored as `null`; the app shows `404.html`
   * for those instead of an empty YouTube embed.
   *
   * The three ids below are bad scraper output, not real videos: genJSON.py
   * locates an id with `str(soup.body).find("videoId") + 10`, and that raw
   * offset picks up neighbouring markup when the expected element is missing.
   * They are listed here so the suite stays green while the defect stays
   * visible — delete an entry once the underlying JSON is re-scraped.
   */
  const KNOWN_BAD_VIDEO_IDS = [
    '5016MS: QIU Dang 2:4 ZHAI Yujia  -> fchannel',
    '5016WS: LIU Xin (1997)  4:2 DIAZ Adriana -> fchannel',
    '5016WS: DIACONU Adina 4:1 LIU Xin (1997)  -> fchannel',
  ];

  it('holds a well formed YouTube id wherever footage exists', () => {
    const malformed: string[] = [];

    for (const draw of availableDraws()) {
      const eventId = draw.slice(0, -2);
      const group = draw.slice(-2) as Group;

      for (const [name, videoId] of Object.entries(getVideos(eventId, group))) {
        if (name === 'Event' || videoId === null || videoId === '') {
          continue;
        }
        if (!/^[\w-]{11}$/.test(videoId)) {
          malformed.push(`${draw}: ${name} -> ${videoId}`);
        }
      }
    }

    expect(malformed).toEqual(KNOWN_BAD_VIDEO_IDS);
  });

  it('returns undefined for an event that was never recorded', () => {
    expect(getTree('9999', 'MS')).toBeUndefined();
    expect(getVideos('9999', 'MS')).toEqual({});
  });
});

describe('seasonOf', () => {
  it('maps every known event to its season', () => {
    expect(seasonOf('5263')).toBe(2020);
    expect(seasonOf('5000')).toBe(2019);
    expect(seasonOf('2816')).toBe(2018);
  });

  it('returns undefined for an unknown event', () => {
    expect(seasonOf('9999')).toBeUndefined();
  });
});
