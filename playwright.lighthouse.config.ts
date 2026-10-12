import { defineConfig } from '@playwright/test'

const PORT = 4174

// Lighthouse runs against the production build served by `vite preview`; the API is a mock
// server started by lighthouse/lighthouse.spec.ts (the build points at it).
export default defineConfig({
  testDir: 'lighthouse',
  timeout: 180_000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${String(PORT)}` },
  webServer: {
    command: `VITE_API_BASE_URL=http://localhost:4175/api/v1 pnpm exec vite build && pnpm exec vite preview --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
