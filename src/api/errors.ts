import { camelizeKeys } from './case'

export type FieldErrors = Record<string, string[]>

/** Any failed API call: an RFC 9457 Problem Details response or a transport failure. */
export class ApiError extends Error {
  readonly kind: 'problem' | 'network'
  readonly status: number
  readonly title: string
  readonly detail: string | undefined
  readonly fieldErrors: FieldErrors

  constructor(init: {
    kind: 'problem' | 'network'
    status: number
    title: string
    detail?: string | undefined
    fieldErrors?: FieldErrors
  }) {
    super(init.detail ?? init.title)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.title = init.title
    this.detail = init.detail
    this.fieldErrors = init.fieldErrors ?? {}
  }

  static network(): ApiError {
    return new ApiError({ kind: 'network', status: 0, title: 'Network error' })
  }
}

interface ProblemBody {
  title?: unknown
  detail?: unknown
  errors?: unknown
}

function asProblemBody(value: unknown): ProblemBody {
  return typeof value === 'object' && value !== null ? value : {}
}

function parseFieldErrors(value: unknown): FieldErrors {
  const entries = Object.entries(asProblemBody(camelizeKeys(value)))
    .map(
      ([field, messages]) =>
        [
          field,
          Array.isArray(messages) ? messages.filter((m): m is string => typeof m === 'string') : [],
        ] as const,
    )
    .filter(([, messages]) => messages.length > 0)
  return Object.fromEntries(entries)
}

/** Builds an ApiError from a response status and its (already decoded) body. */
export function parseProblem(status: number, body: unknown): ApiError {
  const problem = asProblemBody(body)
  return new ApiError({
    kind: 'problem',
    status,
    title: typeof problem.title === 'string' ? problem.title : `HTTP ${String(status)}`,
    detail: typeof problem.detail === 'string' ? problem.detail : undefined,
    fieldErrors: parseFieldErrors(problem.errors),
  })
}
