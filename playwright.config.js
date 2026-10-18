import { defineConfig, devices } from '@playwright/test';

// Tests run against the real production bundle (what Vercel serves), not the dev server.
// `npm run preview` uses the port + COOP/COEP headers configured in vite.config.js.
const PORT = 4173;
const BASE_URL = process.env.TEST_BASE_URL || `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  // @slow tests (real ffmpeg.wasm media processing) are opt-in via `--grep @slow`.
  grepInvert: process.env.RUN_SLOW ? undefined : /@slow/,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Don't manage the server when pointing at an external URL (e.g. a deployed site).
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm run preview',
        url: BASE_URL,
        reuseExistingServer: !isCI,
        timeout: 120_000,
      },
});
