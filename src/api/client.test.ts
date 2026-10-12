import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './errors'
import { createApiClient } from './client'

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function setup(token: string | null = 'secret-token') {
  const fetchMock = vi.fn<typeof fetch>()
  const onUnauthorized = vi.fn()
  const client = createApiClient({
    baseUrl: 'http://api.test/api/v1/',
    fetch: fetchMock,
    getToken: () => token,
    getLocale: () => 'it',
    onUnauthorized,
  })
  return { client, fetchMock, onUnauthorized }
}

function lastCall(fetchMock: ReturnType<typeof setup>['fetchMock']) {
  const [url, init] = fetchMock.mock.calls.at(-1) ?? []
  return { url: url as string, init: init ?? {}, headers: new Headers(init?.headers) }
}

describe('api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends the bearer token, Accept-Language and JSON accept header from one place', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }))
    await client.request('GET', '/expenses')
    const { url, init, headers } = lastCall(fetchMock)
    expect(url).toBe('http://api.test/api/v1/expenses')
    expect(init.method).toBe('GET')
    expect(headers.get('Authorization')).toBe('Bearer secret-token')
    expect(headers.get('Accept-Language')).toBe('it')
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('omits the Authorization header without a token or when auth is disabled', async () => {
    const withoutToken = setup(null)
    withoutToken.fetchMock.mockResolvedValue(jsonResponse({}))
    await withoutToken.client.request('GET', '/auth/me')
    expect(lastCall(withoutToken.fetchMock).headers.has('Authorization')).toBe(false)

    const noAuth = setup()
    noAuth.fetchMock.mockResolvedValue(jsonResponse({}))
    await noAuth.client.request('POST', '/auth/login', { auth: false, body: {} })
    expect(lastCall(noAuth.fetchMock).headers.has('Authorization')).toBe(false)
  })

  it('serializes the query string and skips undefined values', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockResolvedValue(jsonResponse({}))
    await client.request('GET', '/expenses', {
      query: { from: '2026-10-01', q: undefined, page: 2 },
    })
    expect(lastCall(fetchMock).url).toBe('http://api.test/api/v1/expenses?from=2026-10-01&page=2')
  })

  it('sends camelCase bodies as snake_case JSON', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockResolvedValue(jsonResponse({}))
    await client.request('POST', '/expenses', { body: { categoryId: 'c1', amountMinor: 1250 } })
    const { init, headers } = lastCall(fetchMock)
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(JSON.parse(init.body as string)).toEqual({ category_id: 'c1', amount_minor: 1250 })
  })

  it('maps snake_case responses to camelCase', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockResolvedValue(jsonResponse({ data: { created_at: 'x', user_name: 'Ada' } }))
    const result = await client.request<{ data: { createdAt: string; userName: string } }>(
      'GET',
      '/auth/me',
    )
    expect(result).toEqual({ data: { createdAt: 'x', userName: 'Ada' } })
  })

  it('returns undefined for 204 responses', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    await expect(client.request('POST', '/auth/logout')).resolves.toBeUndefined()
  })

  it('throws a typed ApiError built from Problem Details', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockResolvedValue(
      jsonResponse(
        { title: 'Invalid data', status: 422, errors: { email: ['Taken'] } },
        { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
      ),
    )
    const error = await client
      .request('POST', '/auth/register', { auth: false })
      .catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      title: 'Invalid data',
      fieldErrors: { email: ['Taken'] },
    })
  })

  it('copes with error responses that are not JSON', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }))
    await expect(client.request('GET', '/expenses')).rejects.toMatchObject({
      kind: 'problem',
      status: 502,
      title: 'HTTP 502',
    })
  })

  it('calls onUnauthorized on 401 for authenticated requests only', async () => {
    const { client, fetchMock, onUnauthorized } = setup()
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ title: 'Unauthenticated', status: 401 }, { status: 401 })),
    )
    await expect(client.request('GET', '/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)

    await expect(client.request('POST', '/auth/login', { auth: false })).rejects.toMatchObject({
      status: 401,
    })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('wraps transport failures in a network ApiError', async () => {
    const { client, fetchMock } = setup()
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(client.request('GET', '/expenses')).rejects.toMatchObject({
      kind: 'network',
      status: 0,
    })
  })

  it('lets aborted requests propagate untouched', async () => {
    const { client, fetchMock } = setup()
    const abort = new DOMException('Aborted', 'AbortError')
    fetchMock.mockRejectedValue(abort)
    await expect(client.request('GET', '/expenses')).rejects.toBe(abort)
  })
  describe('conditional requests', () => {
    it('sends If-None-Match and returns the data with its ETag', async () => {
      const { client, fetchMock } = setup()
      fetchMock.mockResolvedValue(
        jsonResponse({ data: { total_cents: 5 } }, { headers: { ETag: '"v2"' } }),
      )
      const result = await client.conditional('GET', '/stats/summary', { etag: '"v1"' })
      expect(lastCall(fetchMock).headers.get('If-None-Match')).toBe('"v1"')
      expect(result).toEqual({
        notModified: false,
        data: { data: { totalCents: 5 } },
        etag: '"v2"',
      })
    })

    it('omits If-None-Match without a cached ETag and reports a missing ETag as null', async () => {
      const { client, fetchMock } = setup()
      fetchMock.mockResolvedValue(jsonResponse({ data: [] }))
      const result = await client.conditional('GET', '/stats/summary')
      expect(lastCall(fetchMock).headers.has('If-None-Match')).toBe(false)
      expect(result).toEqual({ notModified: false, data: { data: [] }, etag: null })
    })

    it('treats 304 as "use the cached copy"', async () => {
      const { client, fetchMock, onUnauthorized } = setup()
      fetchMock.mockResolvedValue(new Response(null, { status: 304 }))
      await expect(client.conditional('GET', '/stats/summary', { etag: '"v1"' })).resolves.toEqual({
        notModified: true,
      })
      expect(onUnauthorized).not.toHaveBeenCalled()
    })

    it('still throws for failures', async () => {
      const { client, fetchMock } = setup()
      fetchMock.mockResolvedValue(jsonResponse({ title: 'Too many', status: 429 }, { status: 429 }))
      await expect(client.conditional('GET', '/stats/summary')).rejects.toMatchObject({
        status: 429,
      })
    })
  })
})
