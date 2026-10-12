import type { Page } from '@playwright/test'
import { etagOf, statsBody } from './mock-stats'

// A small in-memory stand-in for the API, driven by `page.route`. It implements the parts of the
// contract the categories and expenses screens use, including validation of `from` and `to`.

export interface MockCategory {
  id: string
  name: string
  color: string
  icon: string
  is_system: boolean
  archived: boolean
  created_at: string
}

export interface MockExpense {
  id: string
  description: string
  amount_cents: number
  currency: string
  category_id: string
  spent_on: string
  created_at: string
  updated_at: string
}

export interface RecordedRequest {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
  /** The `If-None-Match` header of the request, when the client revalidated a cached answer. */
  ifNoneMatch?: string
}

export const USER = {
  id: '0b6b7f0e-0000-4000-8000-000000000001',
  name: 'Ada',
  email: 'ada@example.com',
  locale: 'en',
  created_at: '2026-10-01T10:00:00Z',
}

/** The day every test pretends it is (a Monday). */
export const TODAY = '2026-10-12T10:00:00'

function category(id: string, name: string, patch: Partial<MockCategory> = {}): MockCategory {
  return {
    id,
    name,
    color: '#0B6B72',
    icon: 'tag',
    is_system: false,
    archived: false,
    created_at: '2026-10-01T08:00:00Z',
    ...patch,
  }
}

function expense(
  id: string,
  description: string,
  amountCents: number,
  categoryId: string,
  spentOn: string,
  createdAt: string,
): MockExpense {
  return {
    id,
    description,
    amount_cents: amountCents,
    currency: 'EUR',
    category_id: categoryId,
    spent_on: spentOn,
    created_at: createdAt,
    updated_at: createdAt,
  }
}

export function seedCategories(): MockCategory[] {
  return [
    category('c-1', 'Groceries', { is_system: true, icon: 'cart' }),
    category('c-2', 'Travel', { icon: 'plane', color: '#3D4F9E' }),
    category('c-3', 'Coffee', { icon: 'coffee', color: '#8A5A00' }),
    category('c-4', 'Old hobby', { archived: true, icon: 'book' }),
  ]
}

export function seedExpenses(): MockExpense[] {
  return [
    expense('e-1', 'Lunch', 1250, 'c-1', '2026-10-12', '2026-10-12T09:00:00Z'),
    expense('e-2', 'Coffee beans', 450, 'c-3', '2026-10-12', '2026-10-12T08:00:00Z'),
    expense('e-3', 'Train ticket', 3490, 'c-2', '2026-10-10', '2026-10-10T08:00:00Z'),
    expense('e-4', 'Taxi', 1800, 'c-2', '2026-09-28', '2026-09-28T08:00:00Z'),
    expense('e-5', 'Weekly shop', 6420, 'c-1', '2026-09-15', '2026-09-15T08:00:00Z'),
  ]
}

export interface MockApi {
  categories: MockCategory[]
  expenses: MockExpense[]
  requests: RecordedRequest[]
  /** Answers the next request for "METHOD /path" (ids as :id) with a Problem Details error. */
  failNext: (key: string, status: number, body?: Record<string, unknown>) => void
  /** Drops the connection for the next request for "METHOD /path". */
  dropNext: (key: string) => void
}

interface Options {
  categories?: MockCategory[]
  expenses?: MockExpense[]
  /** Start with a stored token (default). Pass false to begin on the login page. */
  signedIn?: boolean
}

const PROBLEM_TITLES: Record<number, string> = {
  403: 'Forbidden',
  404: 'Not found',
  409: 'Conflict',
  422: 'Unprocessable content',
  500: 'Server error',
}

function problem(
  status: number,
  extra: Record<string, unknown> = {},
): { status: number; json: unknown } {
  return { status, json: { title: PROBLEM_TITLES[status] ?? 'Error', status, ...extra } }
}

function normalize(path: string): string {
  return path.replace(/\/[ce]-\d+/g, '/:id')
}

/** Signs the test user in, fixes the date and installs the API mock. */
export async function installApp(page: Page, options: Options = {}): Promise<MockApi> {
  const failures = new Map<string, { status: number; body?: Record<string, unknown> }>()
  const drops = new Set<string>()
  let counter = 100

  const state: MockApi = {
    categories: options.categories ?? seedCategories(),
    expenses: options.expenses ?? seedExpenses(),
    requests: [],
    failNext: (key, status, body) => {
      failures.set(key, { status, ...(body === undefined ? {} : { body }) })
    },
    dropNext: (key) => {
      drops.add(key)
    },
  }
  await page.clock.setFixedTime(TODAY)
  await page.addInitScript((signedIn) => {
    if (signedIn) localStorage.setItem('expenses.token', 'test-token')
    localStorage.setItem('expenses.locale', 'en')
  }, options.signedIn ?? true)

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace(/^.*\/api\/v1/, '')
    const key = `${request.method()} ${normalize(path)}`
    const query = Object.fromEntries(url.searchParams)
    const raw = request.postData()
    const body: unknown = raw === null ? undefined : JSON.parse(raw)
    const ifNoneMatch = request.headers()['if-none-match']
    state.requests.push({
      method: request.method(),
      path,
      query,
      body,
      ...(ifNoneMatch === undefined ? {} : { ifNoneMatch }),
    })

    if (drops.delete(key)) {
      await route.abort('failed')
      return
    }
    const failure = failures.get(key)
    if (failure !== undefined) {
      failures.delete(key)
      const { status, json } = problem(failure.status, failure.body)
      await route.fulfill({ status, json })
      return
    }

    const stats = statsBody(path, query, state.expenses, state.categories)
    if (request.method() === 'GET' && stats !== null) {
      if (query.from === undefined || query.to === undefined) {
        await route.fulfill(problem(422, { errors: { from: ['Required.'] } }))
        return
      }
      const etag = etagOf(stats)
      await (ifNoneMatch === etag
        ? route.fulfill({ status: 304, headers: { ETag: etag } })
        : route.fulfill({ status: 200, json: stats, headers: { ETag: etag } }))
      return
    }

    const id = /\/([ce]-\d+)/.exec(path)?.[1]
    const respond = (status: number, json?: unknown): Promise<void> =>
      route.fulfill(json === undefined ? { status } : { status, json })
    const handlers: Record<string, () => Promise<void>> = {
      'GET /auth/me': () => respond(200, { data: USER }),
      'POST /auth/login': () => respond(200, { data: { token: 'test-token', user: USER } }),
      'POST /auth/logout': () => respond(204),
      'GET /categories': () =>
        respond(200, {
          data: state.categories
            .filter((c) => query.include_archived === 'true' || !c.archived)
            .sort((a, b) => a.name.localeCompare(b.name)),
        }),
      'POST /categories': () => {
        counter += 1
        const input = body as Pick<MockCategory, 'name' | 'color' | 'icon'>
        if (state.categories.some((c) => c.name === input.name)) {
          return respond(
            422,
            problem(422, {
              detail: 'The name has already been taken.',
              errors: { name: ['The name has already been taken.'] },
            }).json,
          )
        }
        const created = category(`c-${String(counter)}`, input.name, input)
        state.categories.push(created)
        return respond(201, { data: created })
      },
      'PUT /categories/:id': () => mutateCategory(id, (c) => Object.assign(c, body)),
      'POST /categories/:id/archive': () =>
        mutateCategory(id, (c) => Object.assign(c, { archived: true })),
      'POST /categories/:id/unarchive': () =>
        mutateCategory(id, (c) => Object.assign(c, { archived: false })),
      'DELETE /categories/:id': () => {
        const found = state.categories.find((c) => c.id === id)
        if (found === undefined) return respond(404, problem(404).json)
        if (found.is_system) return respond(403, problem(403).json)
        if (state.expenses.some((e) => e.category_id === found.id)) {
          return respond(409, problem(409, { detail: 'The category is in use.' }).json)
        }
        state.categories = state.categories.filter((c) => c.id !== found.id)
        return respond(204)
      },
      'GET /expenses': () => listExpenses(query, respond),
      'POST /expenses': () => {
        counter += 1
        const input = body as {
          description: string
          amount_cents: number
          currency: string
          category_id: string
          spent_on: string
        }
        const stamp = `2026-10-12T10:${String(counter % 60).padStart(2, '0')}:00Z`
        const created = expense(
          `e-${String(counter)}`,
          input.description,
          input.amount_cents,
          input.category_id,
          input.spent_on,
          stamp,
        )
        state.expenses.push({ ...created, currency: input.currency })
        return respond(201, { data: { ...created, currency: input.currency } })
      },
      'PUT /expenses/:id': () => {
        const found = state.expenses.find((e) => e.id === /\/(e-\d+)/.exec(path)?.[1])
        if (found === undefined) return respond(404, problem(404).json)
        Object.assign(found, body)
        return respond(200, { data: found })
      },
      'DELETE /expenses/:id': () => {
        state.expenses = state.expenses.filter((e) => e.id !== /\/(e-\d+)/.exec(path)?.[1])
        return respond(204)
      },
    }

    function mutateCategory(
      categoryId: string | undefined,
      change: (found: MockCategory) => void,
    ): Promise<void> {
      const found = state.categories.find((c) => c.id === categoryId)
      if (found === undefined) return respond(404, problem(404).json)
      if (found.is_system) return respond(403, problem(403).json)
      change(found)
      return respond(200, { data: found })
    }

    function listExpenses(
      params: Record<string, string>,
      reply: (status: number, json?: unknown) => Promise<void>,
    ): Promise<void> {
      const { from, to } = params
      if (from === undefined || to === undefined) {
        return reply(422, problem(422, { errors: { from: ['Required.'] } }).json)
      }
      const needle = params.q?.toLowerCase()
      const matching = state.expenses
        .filter((e) => e.spent_on >= from && e.spent_on <= to)
        .filter((e) => params.category_id === undefined || e.category_id === params.category_id)
        .filter((e) => needle === undefined || e.description.toLowerCase().includes(needle))
        .sort((a, b) =>
          a.spent_on === b.spent_on
            ? b.created_at.localeCompare(a.created_at)
            : b.spent_on.localeCompare(a.spent_on),
        )
      const perPage = Number(params.per_page ?? 50)
      const page = Number(params.page ?? 1)
      return reply(200, {
        data: matching.slice((page - 1) * perPage, page * perPage),
        meta: {
          current_page: page,
          per_page: perPage,
          total: matching.length,
          last_page: Math.max(1, Math.ceil(matching.length / perPage)),
        },
      })
    }

    const handler = handlers[key]
    if (handler === undefined) {
      await route.fulfill(problem(404))
      return
    }
    await handler()
  })

  return state
}
