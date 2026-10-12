import { defineConfig, devices } from '@playwright/test'
import { WEB_URL } from './e2e-fullstack/env'

// Full-stack suite: real SPA + real API from docker compose. It never starts the stack
// (see `globalSetup`); the fast mocked suite lives in `playwright.config.ts`.
export default defineConfig({
  testDir: 'e2e-fullstack',
  testMatch: '*.spec.ts',
  globalSetup: './e2e-fullstack/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-fullstack' }]],
  use: {
    baseURL: WEB_URL,
    locale: 'en-US',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
