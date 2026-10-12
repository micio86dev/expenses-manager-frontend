import { describe, expectTypeOf, it } from 'vitest'
import type { MessageKey } from './keys'

describe('MessageKey', () => {
  it('accepts existing keys and rejects unknown ones at compile time', () => {
    expectTypeOf<'nav.dashboard'>().toExtend<MessageKey>()
    expectTypeOf<'auth.login.title'>().toExtend<MessageKey>()
    expectTypeOf<'nav.nope'>().not.toExtend<MessageKey>()
    expectTypeOf<'nav'>().not.toExtend<MessageKey>()
  })
})
