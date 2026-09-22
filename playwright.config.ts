import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    headless: true,
    // Tests run against already-running dev servers (pnpm dev).
    baseURL: 'http://localhost:4018',
  },
});
