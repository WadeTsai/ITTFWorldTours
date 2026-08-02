import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import App from './App';

/** The `{season} / {event} / {group}` line above the bracket. */
function currentDraw(): string {
  const headings = screen.getAllByRole('heading', { level: 6 });
  const line = headings.find((heading) => heading.textContent?.includes(' / '));
  return line?.textContent ?? '';
}

describe('<App />', () => {
  it('opens on the most recent event', () => {
    render(<App />);
    expect(currentDraw()).toBe('2026 / WTT Star Contender São José dos Campos / 男子單打');
  });

  it('renders the bracket for the selected draw', () => {
    render(<App />);
    // Final of the newest event on record.
    expect(screen.getByText('CALDERANO Hugo 4:3 LEBRUN Alexis')).toBeInTheDocument();
  });

  it('switches to the women\'s draw when 女單 is picked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // The newest event is expanded by default, so its draws come first.
    const [womensDraw] = screen.getAllByText('女單');
    await user.click(womensDraw!);

    expect(currentDraw()).toBe('2026 / WTT Star Contender São José dos Campos / 女子單打');
  });

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

    await user.click(screen.getByText('CALDERANO Hugo 3:2 UDA Yukiya'));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('CALDERANO Hugo 3:2 UDA Yukiya');
    expect(screen.getByTitle('Youtube Video')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/trj_FbQdn3g',
    );
  });

  it('closes the video dialog again', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('CALDERANO Hugo 3:2 UDA Yukiya'));
    await user.click(await screen.findByRole('button', { name: 'close' }));

    // The dialog stays mounted until its close transition finishes.
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
