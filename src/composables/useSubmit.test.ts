import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { useSubmit } from './useSubmit'

describe('useSubmit', () => {
  it('tracks the submitting state and reports success', async () => {
    let release: () => void = () => undefined
    const received: string[] = []
    const { submitting, error, run } = useSubmit(
      (value: string) =>
        new Promise<void>((resolve) => {
          received.push(value)
          release = resolve
        }),
    )
    const pending = run('x')
    expect(submitting.value).toBe(true)
    release()
    await expect(pending).resolves.toBe(true)
    expect(received).toEqual(['x'])
    expect(submitting.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('captures an ApiError and clears it on the next attempt', async () => {
    const failure = new ApiError({ kind: 'problem', status: 422, title: 'Invalid' })
    let fail = true
    const { error, run } = useSubmit(() => (fail ? Promise.reject(failure) : Promise.resolve()))
    await expect(run()).resolves.toBe(false)
    expect(error.value).toBe(failure)
    fail = false
    await expect(run()).resolves.toBe(true)
    expect(error.value).toBeNull()
  })

  it('does not swallow unexpected errors', async () => {
    const { submitting, run } = useSubmit(() => Promise.reject(new TypeError('bug')))
    await expect(run()).rejects.toThrow('bug')
    expect(submitting.value).toBe(false)
  })
})
