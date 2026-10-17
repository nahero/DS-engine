import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
// The built Storybook (npm run build-storybook) for the per-story visual tests.
const STORYBOOK_PORT = 6007
const CI = !!process.env.CI

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}/DS-engine/`,
    trace: 'on-first-retry',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /stories\.visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'stories',
      testMatch: /stories\.visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, baseURL: `http://localhost:${STORYBOOK_PORT}/` },
    },
    {
      name: 'mobile',
      // Visual baselines and the keyboard-driven desktop flows run on desktop only.
      testMatch: /(navigation|a11y)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } },
    },
  ],
  webServer: [
    {
      command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/DS-engine/`,
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
    {
      // Serves storybook-static as built; the stories project reads its index.json when collecting tests.
      command: `test -d storybook-static || npm run build-storybook -- --quiet --disable-telemetry; npx vite preview --outDir storybook-static --base / --port ${STORYBOOK_PORT} --strictPort`,
      url: `http://localhost:${STORYBOOK_PORT}/iframe.html`,
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
  ],
})
