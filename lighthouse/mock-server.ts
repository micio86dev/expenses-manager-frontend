import { createServer, type Server } from 'node:http'
import { etagOf, statsBody } from '../e2e/support/mock-stats'
import { seedCategories, seedExpenses, USER } from '../e2e/support/mock-api'
import { addDays, diffDays, today } from '../src/lib/dates'

// A read-only HTTP stand-in for the API, built from the fixtures of the fast e2e suite. Seed dates
// are shifted so the newest expense falls on the real "today" and the dashboard is never empty.

export const MOCK_API_PORT = 4175

const categories = seedCategories()
const shift = diffDays('2026-10-12', today())
const expenses = seedExpenses().map((e) => ({ ...e, spent_on: addDays(e.spent_on, shift) }))

export function startMockApi(): Promise<Server> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    const path = url.pathname.replace(/^\/api\/v1/, '')
    const query = Object.fromEntries(url.searchParams)
    response.setHeader('Access-Control-Allow-Origin', '*')
    // Not `*`: browsers do not let the wildcard cover Authorization (a Lighthouse deprecation).
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Accept-Language, If-None-Match, Content-Type',
    )
    response.setHeader('Access-Control-Expose-Headers', 'ETag')
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end()
      return
    }
    const send = (status: number, json: unknown, headers: Record<string, string> = {}): void => {
      response.writeHead(status, { 'Content-Type': 'application/json', ...headers })
      response.end(JSON.stringify(json))
    }
    const stats = statsBody(path, query, expenses, categories)
    if (stats !== null) {
      const etag = etagOf(stats)
      if (request.headers['if-none-match'] === etag) response.writeHead(304, { ETag: etag }).end()
      else send(200, stats, { ETag: etag })
      return
    }
    if (path === '/auth/me') send(200, { data: USER })
    else if (path === '/categories') send(200, { data: categories })
    else if (path === '/expenses') {
      const { from = '', to = '' } = query
      const data = expenses.filter((e) => e.spent_on >= from && e.spent_on <= to)
      send(200, {
        data,
        meta: { current_page: 1, per_page: 50, total: data.length, last_page: 1 },
      })
    } else send(404, { title: 'Not found', status: 404 })
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(MOCK_API_PORT, () => {
      resolve(server)
    })
  })
}
