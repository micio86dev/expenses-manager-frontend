import { describe, expect, it } from 'vitest'
import { ApiError } from '@/api/errors'
import { setLocale } from '@/i18n'
import { describeError } from './describeError'

describe('describeError', () => {
  it('returns null without an error', async () => {
    await setLocale('en')
    expect(describeError(null)).toBeNull()
  })

  it('uses the localized server detail, then the title', async () => {
    await setLocale('en')
    expect(
      describeError(
        new ApiError({
          kind: 'problem',
          status: 401,
          title: 'Unauthenticated',
          detail: 'Wrong password',
        }),
      ),
    ).toBe('Wrong password')
    expect(
      describeError(new ApiError({ kind: 'problem', status: 500, title: 'Server error' })),
    ).toBe('Server error')
  })

  it('uses a translated message for network failures', async () => {
    await setLocale('en')
    expect(describeError(ApiError.network())).toContain('Cannot reach the server')
  })
})
