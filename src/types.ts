/** The two draws covered by this site: men's singles and women's singles. */
export type Group = 'MS' | 'WS';

/** A match as stored in `JSON/<eventId><group>_tree.json`. Leaves have no `children`. */
export interface RawMatchNode {
  name: string;
  children?: RawMatchNode[];
}

/**
 * The same tree with `children` always present. react-tree-graph types `children`
 * as required, and an empty array is treated as a leaf by d3's hierarchy layout.
 */
export interface MatchNode {
  name: string;
  children: MatchNode[];
}

/**
 * `JSON/<eventId><group>_videos.json`: match name -> YouTube video id.
 * Also carries an `Event` key holding the full English event title.
 *
 * Matches ITTF never filmed are stored as `null`, so the value really is
 * nullable rather than merely absent.
 */
export type VideoMap = Record<string, string | null>;

/** A match the user picked in the bracket, along with the video to play for it. */
export interface ActiveMatch {
  name: string;
  videoId: string | null | undefined;
}
