import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';
import { getTree, getVideos } from './data';
import { EVENT_NAMES, GROUP_NAMES, LATEST_EVENT_ID, groupsOf, seasonOf } from './events';
import type { Group, MatchNode } from './types';

/** Mirrors the private `DRAW_LABELS` in App.tsx. */
const DRAW_LABELS: Record<Group, string> = { MS: '男單', WS: '女單' };

/**
 * The app opens on the newest event in the registry, and `genJSON.py --sync`
 * adds one most weeks of the season. So these tests describe that event through
 * the data rather than naming it: pinning the literal names meant every new
 * event broke the suite, which a weekly scrape cannot afford.
 */
const LATEST = {
  season: seasonOf(LATEST_EVENT_ID),
  name: EVENT_NAMES[LATEST_EVENT_ID],
  groups: groupsOf(LATEST_EVENT_ID),
};

/** The draw the app lands on, and the one the sidebar can switch to. */
const [OPENING_GROUP, OTHER_GROUP] = LATEST.groups;

function heading(group: Group): string {
  return `${LATEST.season} / ${LATEST.name} / ${GROUP_NAMES[group]}`;
}

/** The `{season} / {event} / {group}` line above the bracket. */
function currentDraw(): string {
  const headings = screen.getAllByRole('heading', { level: 6 });
  const line = headings.find((entry) => entry.textContent?.includes(' / '));
  return line?.textContent ?? '';
}

function flatten(node: MatchNode): MatchNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

const openingTree = getTree(LATEST_EVENT_ID, OPENING_GROUP!);
const openingVideos = getVideos(LATEST_EVENT_ID, OPENING_GROUP!);

/** A match of the opening draw that was filmed, so the dialog has one to play. */
const filmed = flatten(openingTree!)
  .map((node) => ({ name: node.name, videoId: openingVideos[node.name] }))
  .find((match): match is { name: string; videoId: string } => Boolean(match.videoId));

describe('<App />', () => {
  it('opens on the most recent event', () => {
    render(<App />);
    expect(currentDraw()).toBe(heading(OPENING_GROUP!));
  });

  it('renders the bracket for the selected draw', () => {
    render(<App />);
    // The final of the newest event on record.
    expect(screen.getByText(openingTree!.name)).toBeInTheDocument();
  });

  it.skipIf(!OTHER_GROUP)(
    'switches to the other draw when its sidebar label is picked',
    async () => {
      const user = userEvent.setup();
      render(<App />);

      // The newest event is expanded by default, so its draws come first.
      const [otherDraw] = screen.getAllByText(DRAW_LABELS[OTHER_GROUP!]);
      await user.click(otherDraw!);

      expect(currentDraw()).toBe(heading(OTHER_GROUP!));
    },
  );

  it('switches season when an older event is picked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Scoped to that event, since every event has a 男單 child of its own.
    // The name has to match exactly: a tree item takes its accessible name from
    // its content, so the season and root items contain this one's label too.
    const worldChampionships = screen.getByRole('treeitem', { name: '世界錦標賽' });
    await user.click(within(worldChampionships).getByText('世界錦標賽'));
    await user.click(within(worldChampionships).getByText('男單'));

    expect(currentDraw()).toBe('2019 / 世界錦標賽 / 男子單打');
  });

  it('plays the match video when a bracket node is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // getAllByText: two matches of one draw can share a name when the same pair
    // meets twice with the same score.
    await user.click(screen.getAllByText(filmed!.name)[0]!);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(filmed!.name);
    expect(screen.getByTitle('Youtube Video')).toHaveAttribute(
      'src',
      `https://www.youtube.com/embed/${filmed!.videoId}`,
    );
  });

  it('closes the video dialog again', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByText(filmed!.name)[0]!);
    await user.click(await screen.findByRole('button', { name: 'close' }));

    // The dialog stays mounted until its close transition finishes.
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
