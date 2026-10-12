import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium, expect, test } from '@playwright/test'
import lighthouse from 'lighthouse'
import { startMockApi } from './mock-server'

// Mobile Lighthouse on the production build, for the login page and the signed-in dashboard.
// Playwright's Chromium is started with a debugging port that Lighthouse attaches to; the page
// talks to a small mock API server built from the fast e2e fixtures, so the dashboard renders
// real content.

interface PageConfig {
  name: string
  path: string
  signedIn: boolean
}
interface Rc {
  ci: {
    collect: { formFactor: 'mobile' | 'desktop'; pages: PageConfig[] }
    assert: { assertions: Record<string, [string, { minScore: number }]> }
  }
}

const rc = JSON.parse(readFileSync('lighthouserc.json', 'utf8')) as Rc
const DEBUG_PORT = 9333
const REPORT_DIR = 'lighthouse-report'

let api: Server
test.beforeAll(async () => {
  api = await startMockApi()
})
test.afterAll(() => {
  api.close()
})

for (const target of rc.ci.collect.pages) {
  test(`lighthouse ${rc.ci.collect.formFactor}: ${target.name}`, async ({ baseURL }) => {
    // A persistent context is the browser's default one, where Lighthouse opens its own tab, so
    // the stored token reaches the page it audits.
    const profile = mkdtempSync(join(tmpdir(), 'lighthouse-'))
    const context = await chromium.launchPersistentContext(profile, {
      args: [`--remote-debugging-port=${String(DEBUG_PORT)}`],
      locale: 'en-US',
    })
    try {
      if (target.signedIn) {
        // The token and locale live in localStorage, which Lighthouse keeps (disableStorageReset).
        const page = await context.newPage()
        await page.goto(`${baseURL ?? ''}/login`)
        await page.evaluate(() => {
          localStorage.setItem('expenses.token', 'lighthouse-token')
          localStorage.setItem('expenses.locale', 'en')
        })
        await page.close()
      }
      const result = await lighthouse(
        `${baseURL ?? ''}${target.path}`,
        { port: DEBUG_PORT, output: 'html', logLevel: 'error' },
        {
          extends: 'lighthouse:default',
          settings: {
            formFactor: rc.ci.collect.formFactor,
            onlyCategories: Object.keys(rc.ci.assert.assertions).map((key) =>
              key.replace('categories:', ''),
            ),
            disableStorageReset: true,
          },
        },
      )
      if (result === undefined) throw new Error('Lighthouse returned no result')
      mkdirSync(REPORT_DIR, { recursive: true })
      writeFileSync(`${REPORT_DIR}/${target.name}.html`, String(result.report))

      const scores = Object.fromEntries(
        Object.entries(result.lhr.categories).map(([id, category]) => [
          id,
          Math.round((category.score ?? 0) * 100),
        ]),
      )
      console.log(
        `${target.name} (${result.lhr.configSettings.formFactor}): ${JSON.stringify(scores)}`,
      )
      for (const [key, [, { minScore }]] of Object.entries(rc.ci.assert.assertions)) {
        const id = key.replace('categories:', '')
        expect(scores[id], `${target.name} ${id}`).toBeGreaterThanOrEqual(minScore * 100)
      }
    } finally {
      await context.close()
      rmSync(profile, { recursive: true, force: true })
    }
  })
}
