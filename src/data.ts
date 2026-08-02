import type { Group, MatchNode, RawMatchNode, VideoMap } from './types';

/**
 * The bracket and video files are pulled in at build time.
 *
 * The previous version used `require('../JSON/' + id + group + '_tree.json')`
 * inside the render, which only worked under webpack's CommonJS interop.
 * `import.meta.glob` is the Vite equivalent and, unlike a dynamic `require`,
 * it is statically analysable, so the JSON ends up in the bundle.
 */
const treeModules = import.meta.glob('../JSON/*_tree.json', {
  eager: true,
  import: 'default',
}) as Record<string, RawMatchNode>;

const videoModules = import.meta.glob('../JSON/*_videos.json', {
  eager: true,
  import: 'default',
}) as Record<string, VideoMap>;

/**
 * Matches `.../5263MS_tree.json` and captures `5263` and `MS`.
 *
 * The id is not restricted to digits. results.ittf.com and worldtabletennis.com
 * number their events independently, so the two id spaces collide: `2873` is
 * both the 2018 ITTF Men's World Cup and WTT Contender Almaty 2024. The older
 * file keeps the WTT id free by carrying an `ittf` prefix.
 */
const FILE_NAME = /\/([\w-]+)(MS|WS)_(?:tree|videos)\.json$/;

function indexByEvent<T>(modules: Record<string, T>): Map<string, T> {
  const index = new Map<string, T>();
  for (const [path, value] of Object.entries(modules)) {
    const match = FILE_NAME.exec(path);
    if (!match) {
      continue;
    }
    const [, eventId, group] = match;
    if (eventId && group) {
      index.set(cacheKey(eventId, group as Group), value);
    }
  }
  return index;
}

/** Fills in the `children` arrays that leaf nodes omit in the JSON. */
function withChildren(node: RawMatchNode): MatchNode {
  return { name: node.name, children: (node.children ?? []).map(withChildren) };
}

function cacheKey(eventId: string, group: Group): string {
  return `${eventId}${group}`;
}

const trees = new Map<string, MatchNode>(
  [...indexByEvent(treeModules)].map(([key, raw]) => [key, withChildren(raw)]),
);

const videos = indexByEvent(videoModules);

/** The bracket for one draw, or `undefined` if that draw was never recorded. */
export function getTree(eventId: string, group: Group): MatchNode | undefined {
  return trees.get(cacheKey(eventId, group));
}

/** Match name -> YouTube id for one draw. Empty when the draw is missing. */
export function getVideos(eventId: string, group: Group): VideoMap {
  return videos.get(cacheKey(eventId, group)) ?? {};
}

/** Every `<eventId><group>` key that has a bracket. Used by the data tests. */
export function availableDraws(): string[] {
  return [...trees.keys()].sort();
}
