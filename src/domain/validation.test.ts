import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { MessageKey } from '@/i18n/keys'
import { runSchema } from './validation'

const KEYS: ReadonlySet<MessageKey> = new Set<MessageKey>(['auth.errors.nameRequired'])
const schema = z.object({
  name: z
    .string({ error: 'auth.errors.nameRequired' })
    .min(1, { error: 'auth.errors.nameRequired' }),
})

describe('runSchema', () => {
  it('maps the first failed rule of each field to its translation key', () => {
    expect(runSchema(schema, { name: '' }, KEYS)).toEqual({
      ok: false,
      errors: { name: 'auth.errors.nameRequired' },
    })
  })

  it('throws for a rule whose message is not a translation key', () => {
    const bare = z.object({ name: z.string().min(1) })
    expect(() => runSchema(bare, { name: '' }, KEYS)).toThrow('has no translation key')
  })
})
