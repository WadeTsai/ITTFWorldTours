import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// The site is published to https://wadetsai.github.io/ITTFWorldTours,
// so every asset URL has to be prefixed with the repository name.
export default defineConfig({
  base: '/ITTFWorldTours/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/vitest.setup.ts'],
    css: true,
    // The sidebar lists every draw of every season - over 300 tree items since
    // the 2021-2026 events were added - and userEvent replays each click
    // through a real event sequence, so a single interaction can outrun the
    // 5s default in jsdom.
    //
    // 20s was not enough headroom: the same six tests have measured anywhere
    // from 4s to 28s each on one machine, and the weekly scrape runs them
    // unattended on a slower shared runner after adding yet another event to
    // that sidebar. A timeout this generous still fails a genuine hang, just
    // later; a marginal one fails the refresh for no reason.
    testTimeout: 90_000,
  },
});
