import { describe, expect, it } from 'vitest'
import { deferred } from '../../tests/deferred'
import { runOptimistic } from './optimistic'

describe('runOptimistic', () => {
  it('applies the change before the request settles, then commits the result', async () => {
    const log: string[] = []
    const request = deferred<string>()
    const pending = runOptimistic({
      apply: () => log.push('apply'),
      rollback: () => log.push('rollback'),
      request: () => {
        log.push('request')
        return request.promise
      },
      commit: (result) => log.push(`commit:${result}`),
    })
    expect(log).toEqual(['apply', 'request'])
    request.resolve('server')
    await expect(pending).resolves.toBe('server')
    expect(log).toEqual(['apply', 'request', 'commit:server'])
  })

  it('rolls back and rethrows when the request fails', async () => {
    const log: string[] = []
    const failure = new Error('boom')
    await expect(
      runOptimistic({
        apply: () => log.push('apply'),
        rollback: () => log.push('rollback'),
        request: () => Promise.reject(failure),
        commit: () => log.push('commit'),
      }),
    ).rejects.toBe(failure)
    expect(log).toEqual(['apply', 'rollback'])
  })

  it('does not need a commit step', async () => {
    await expect(
      runOptimistic({
        apply: () => undefined,
        rollback: () => undefined,
        request: () => Promise.resolve(7),
      }),
    ).resolves.toBe(7)
  })

  it('rolls back when the request throws synchronously', async () => {
    const log: string[] = []
    await expect(
      runOptimistic({
        apply: () => undefined,
        rollback: () => log.push('rollback'),
        request: () => {
          throw new Error('sync')
        },
      }),
    ).rejects.toThrow('sync')
    expect(log).toEqual(['rollback'])
  })
})
