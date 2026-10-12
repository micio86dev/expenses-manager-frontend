import { camelizeKeys, snakeizeKeys } from './case'
import { ApiError, parseProblem } from './errors'

export interface ApiClientOptions {
  baseUrl: string
  fetch?: typeof fetch
  /** Current bearer token, or null when signed out. */
  getToken: () => string | null
  /** Current UI locale, sent as Accept-Language so the API localizes its messages. */
  getLocale: () => string
  /** Called when an authenticated request is rejected with 401. */
  onUnauthorized: () => void
}

export type Query = Record<string, string | number | boolean | undefined>

export interface RequestOptions {
  query?: Query
  /** camelCase body; it is sent as snake_case JSON. */
  body?: unknown
  /** Set to false for public endpoints (login, register). Default true. */
  auth?: boolean
  signal?: AbortSignal
}

export interface ApiClient {
  request: <T = undefined>(method: string, path: string, options?: RequestOptions) => Promise<T>
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const send = options.fetch ?? ((...args) => fetch(...args))
  const baseUrl = options.baseUrl.replace(/\/+$/, '')

  // The single place where authentication and localization headers are decided.
  function buildHeaders(auth: boolean, hasBody: boolean): Headers {
    const headers = new Headers({
      Accept: 'application/json',
      'Accept-Language': options.getLocale(),
    })
    const token = options.getToken()
    if (auth && token !== null) headers.set('Authorization', `Bearer ${token}`)
    if (hasBody) headers.set('Content-Type', 'application/json')
    return headers
  }

  function buildUrl(path: string, query: Query | undefined): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) params.set(key, String(value))
    }
    const search = params.toString()
    return `${baseUrl}${path}${search === '' ? '' : `?${search}`}`
  }

  async function decode(response: Response): Promise<unknown> {
    const text = await response.text()
    if (text === '') return undefined
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }

  async function request<T = undefined>(
    method: string,
    path: string,
    { query, body, auth = true, signal }: RequestOptions = {},
  ): Promise<T> {
    const hasBody = body !== undefined
    let response: Response
    try {
      response = await send(buildUrl(path, query), {
        method,
        headers: buildHeaders(auth, hasBody),
        ...(hasBody ? { body: JSON.stringify(snakeizeKeys(body)) } : {}),
        ...(signal === undefined ? {} : { signal }),
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw ApiError.network()
    }

    const payload = await decode(response)
    if (!response.ok) {
      if (response.status === 401 && auth) options.onUnauthorized()
      throw parseProblem(response.status, payload)
    }
    return camelizeKeys(payload) as T
  }

  return { request }
}
