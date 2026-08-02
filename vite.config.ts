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
    testTimeout: 20_000,
  },
});
