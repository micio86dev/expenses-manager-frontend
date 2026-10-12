// Fails when the initial JavaScript (entry chunk plus its synchronous imports) exceeds the budget.
// Initial = the entry script and every <link rel="modulepreload"> in dist/index.html, which Vite
// emits for the entry's static import graph. Lazy chunks (routes, locales) are not counted.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET_KB = 150
const DIST = new URL('../dist/', import.meta.url).pathname
const html = readFileSync(join(DIST, 'index.html'), 'utf8')

const scripts = [...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map((m) => m[1])
const preloads = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map(
  (m) => m[1],
)
const files = [...new Set([...scripts, ...preloads])]

if (scripts.length === 0) {
  console.error('Bundle budget: no entry script found in dist/index.html. Run the build first.')
  process.exit(1)
}

let total = 0
for (const file of files) {
  const size = gzipSync(readFileSync(join(DIST, file))).length
  total += size
  console.log(`  ${(size / 1000).toFixed(2).padStart(8)} kB gzip  ${file}`)
}
const totalKb = total / 1000
console.log(`Initial JS: ${totalKb.toFixed(2)} kB gzip (budget ${BUDGET_KB} kB)`)

if (totalKb > BUDGET_KB) {
  console.error('Bundle budget exceeded.')
  process.exit(1)
}
