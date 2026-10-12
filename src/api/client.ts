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

export interface ConditionalOptions extends RequestOptions {
  /** ETag of the copy the caller already holds; sent as `If-None-Match`. */
  etag?: string
}

/** Either "your copy is still current" (304) or a fresh body with its ETag (null when absent). */
export type Conditional<T> =
  { notModified: true } | { notModified: false; data: T; etag: string | null }

export interface ApiClient {
  request: <T = undefined>(method: string, path: string, options?: RequestOptions) => Promise<T>
  conditional: <T>(
    method: string,
    path: string,
    options?: ConditionalOptions,
  ) => Promise<Conditional<T>>
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const send = options.fetch ?? ((...args) => fetch(...args))
  const baseUrl = options.baseUrl.replace(/\/+$/, '')

  // The single place where authentication and localization headers are decided.
  function buildHeaders(auth: boolean, hasBody: boolean, etag: string | undefined): Headers {
    const headers = new Headers({
      Accept: 'application/json',
      'Accept-Language': options.getLocale(),
    })
    const token = options.getToken()
    if (auth && token !== null) headers.set('Authorization', `Bearer ${token}`)
    if (hasBody) headers.set('Content-Type', 'application/json')
    if (etag !== undefined) headers.set('If-None-Match', etag)
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

  interface Outcome {
    notModified: boolean
    data: unknown
    etag: string | null
  }

  async function perform(
    method: string,
    path: string,
    { query, body, auth = true, signal, etag }: ConditionalOptions,
  ): Promise<Outcome> {
    const hasBody = body !== undefined
    let response: Response
    try {
      response = await send(buildUrl(path, query), {
        method,
        headers: buildHeaders(auth, hasBody, etag),
        ...(hasBody ? { body: JSON.stringify(snakeizeKeys(body)) } : {}),
        ...(signal === undefined ? {} : { signal }),
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw ApiError.network()
    }

    if (response.status === 304) return { notModified: true, data: undefined, etag: null }
    const payload = await decode(response)
    if (!response.ok) {
      if (response.status === 401 && auth) options.onUnauthorized()
      throw parseProblem(response.status, payload)
    }
    return { notModified: false, data: camelizeKeys(payload), etag: response.headers.get('ETag') }
  }

  return {
    request: async <T = undefined>(
      method: string,
      path: string,
      requestOptions: RequestOptions = {},
    ): Promise<T> => (await perform(method, path, requestOptions)).data as T,
    conditional: async <T>(
      method: string,
      path: string,
      conditionalOptions: ConditionalOptions = {},
    ): Promise<Conditional<T>> => {
      const outcome = await perform(method, path, conditionalOptions)
      return outcome.notModified
        ? { notModified: true }
        : { notModified: false, data: outcome.data as T, etag: outcome.etag }
    },
  }
}
