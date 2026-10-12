import { describe, expect, it } from 'vitest'
import { ApiError, parseProblem } from './errors'

describe('ApiError', () => {
  it('parses a Problem Details body with camelized field errors', () => {
    const error = parseProblem(422, {
      type: 'about:blank',
      title: 'Invalid data',
      status: 422,
      detail: 'The given data was invalid.',
      errors: { email: ['Taken'], category_id: ['Required'] },
    })
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      kind: 'problem',
      status: 422,
      title: 'Invalid data',
      detail: 'The given data was invalid.',
      fieldErrors: { email: ['Taken'], categoryId: ['Required'] },
    })
    expect(error.message).toBe('The given data was invalid.')
  })

  it('falls back to the HTTP status when the body is not a problem document', () => {
    const error = parseProblem(502, 'Bad gateway')
    expect(error).toMatchObject({
      kind: 'problem',
      status: 502,
      title: 'HTTP 502',
      fieldErrors: {},
    })
    expect(error.detail).toBeUndefined()
    expect(error.message).toBe('HTTP 502')
  })

  it('ignores malformed field errors', () => {
    const error = parseProblem(422, {
      title: 'x',
      status: 422,
      errors: { a: 'nope', b: [1, 'ok'] },
    })
    expect(error.fieldErrors).toEqual({ b: ['ok'] })
  })

  it('creates network errors without a status', () => {
    const error = ApiError.network()
    expect(error).toMatchObject({ kind: 'network', status: 0, fieldErrors: {} })
  })
})
