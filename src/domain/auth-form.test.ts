import { describe, expect, it } from 'vitest'
import en from '@/i18n/locales/en'
import itLocale from '@/i18n/locales/it'
import { AUTH_MESSAGES, validateLoginForm, validateRegisterForm } from './auth-form'

describe('validateRegisterForm', () => {
  const valid = { name: ' Ada ', email: ' Ada@Example.com ', password: 'password1' }

  it('trims the name and email and keeps the password as typed', () => {
    expect(validateRegisterForm(valid)).toEqual({
      ok: true,
      value: { name: 'Ada', email: 'Ada@Example.com', password: 'password1' },
    })
  })

  it('reports every rule the backend enforces, one message per field', () => {
    const result = validateRegisterForm({ name: '  ', email: 'not-an-email', password: 'short' })
    expect(result).toEqual({
      ok: false,
      errors: {
        name: 'auth.errors.nameRequired',
        email: 'auth.errors.emailInvalid',
        password: 'auth.errors.passwordTooShort',
      },
    })
  })

  it('rejects names over 120 characters and passwords over 255', () => {
    const result = validateRegisterForm({
      name: 'x'.repeat(121),
      email: 'ada@example.com',
      password: 'p'.repeat(256),
    })
    expect(result).toEqual({
      ok: false,
      errors: { name: 'auth.errors.nameTooLong', password: 'auth.errors.passwordTooLong' },
    })
  })

  it('rejects an email over 255 characters', () => {
    const email = `${'a'.repeat(250)}@example.com`
    expect(validateRegisterForm({ ...valid, email })).toEqual({
      ok: false,
      errors: { email: 'auth.errors.emailTooLong' },
    })
  })

  it('accepts a password of exactly 8 characters', () => {
    expect(validateRegisterForm({ ...valid, password: '12345678' }).ok).toBe(true)
  })
})

describe('validateLoginForm', () => {
  it('trims the email and requires a password', () => {
    expect(validateLoginForm({ email: ' ada@example.com ', password: 'x' })).toEqual({
      ok: true,
      value: { email: 'ada@example.com', password: 'x' },
    })
    expect(validateLoginForm({ email: 'ada@example.com', password: '' })).toEqual({
      ok: false,
      errors: { password: 'auth.errors.passwordRequired' },
    })
  })

  it('rejects a malformed email', () => {
    expect(validateLoginForm({ email: 'ada@', password: 'x' })).toEqual({
      ok: false,
      errors: { email: 'auth.errors.emailInvalid' },
    })
  })
})

describe('auth validation messages', () => {
  it.each(Object.entries(AUTH_MESSAGES))(
    '%s is a translation key in both locales',
    (_name, key) => {
      for (const locale of [en, itLocale]) {
        const value = key
          .split('.')
          .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], locale)
        expect(typeof value, key).toBe('string')
      }
    },
  )
})
