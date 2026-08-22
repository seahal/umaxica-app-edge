import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5105',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    /*
     * Readiness is `/` and not `/health`: this frame's `/health` is a UNIFIED
     * document — its own state and Rails' liveness — and it answers 503 when
     * Rails is absent, which is the normal case for a local browser run.
     * Playwright treats only 2xx/3xx/4xx as ready, so waiting on `/health` here
     * meant burning the full timeout and then failing on a server that had been
     * up the whole time.
     */
    url: 'http://localhost:5105/',
    reuseExistingServer: !process.env['CI'],
    timeout: 240_000,
  },
});
