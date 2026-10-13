import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { MessageKey } from '@/i18n/keys'
import { runSchema } from './validation'

const KEYS: ReadonlySet<MessageKey> = new Set<MessageKey>([
  'auth.errors.nameRequired',
  'auth.errors.nameTooLong',
])
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

  it('keeps the first failed rule when a field fails several', () => {
    const twice = z.object({
      name: z
        .string({ error: 'auth.errors.nameRequired' })
        .min(5, { error: 'auth.errors.nameRequired' })
        .max(1, { error: 'auth.errors.nameTooLong' }),
    })
    expect(runSchema(twice, { name: 'Ada' }, KEYS)).toEqual({
      ok: false,
      errors: { name: 'auth.errors.nameRequired' },
    })
  })

  it('returns the parsed value when every rule passes', () => {
    expect(runSchema(schema, { name: 'Ada' }, KEYS)).toEqual({
      ok: true,
      value: { name: 'Ada' },
    })
  })

  it('throws for a rule whose message is not a translation key', () => {
    const bare = z.object({ name: z.string().min(1) })
    expect(() => runSchema(bare, { name: '' }, KEYS)).toThrow('has no translation key')
  })

  it('throws for a failed rule that belongs to no field, since no field could show it', () => {
    const whole = z
      .object({ name: z.string() })
      .refine(() => false, { error: 'auth.errors.nameRequired' })
    expect(() => runSchema(whole, { name: 'Ada' }, KEYS)).toThrow('belongs to no field')
  })
})
