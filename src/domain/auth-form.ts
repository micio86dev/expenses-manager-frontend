// Validation of the sign-in and registration forms. The rules mirror the backend requests.
import { z } from 'zod'
import type { MessageKey } from '@/i18n/keys'
import { type FormResult, runSchema } from './validation'

const EMAIL_MAX = 255
export const PASSWORD_MIN = 8
const PASSWORD_MAX = 255
const NAME_MAX = 120

/** Every message the auth forms can show. Typed against MessageKey, so a typo fails to compile. */
export const AUTH_MESSAGES = {
  emailInvalid: 'auth.errors.emailInvalid',
  emailTooLong: 'auth.errors.emailTooLong',
  passwordRequired: 'auth.errors.passwordRequired',
  passwordTooShort: 'auth.errors.passwordTooShort',
  passwordTooLong: 'auth.errors.passwordTooLong',
  nameRequired: 'auth.errors.nameRequired',
  nameTooLong: 'auth.errors.nameTooLong',
} as const satisfies Record<string, MessageKey>

const AUTH_KEYS: ReadonlySet<MessageKey> = new Set<MessageKey>(Object.values(AUTH_MESSAGES))

const loginSchema = z.object({
  email: z.email({ error: AUTH_MESSAGES.emailInvalid }),
  password: z.string({ error: AUTH_MESSAGES.passwordRequired }).min(1, {
    error: AUTH_MESSAGES.passwordRequired,
  }),
})

const registerSchema = z.object({
  name: z
    .string({ error: AUTH_MESSAGES.nameRequired })
    .trim()
    .min(1, { error: AUTH_MESSAGES.nameRequired })
    .max(NAME_MAX, { error: AUTH_MESSAGES.nameTooLong }),
  email: z.email({ error: AUTH_MESSAGES.emailInvalid }).max(EMAIL_MAX, {
    error: AUTH_MESSAGES.emailTooLong,
  }),
  password: z
    .string({ error: AUTH_MESSAGES.passwordTooShort })
    .min(PASSWORD_MIN, { error: AUTH_MESSAGES.passwordTooShort })
    .max(PASSWORD_MAX, { error: AUTH_MESSAGES.passwordTooLong }),
})

export interface LoginFormValues {
  email: string
  password: string
}

export interface RegisterFormValues {
  name: string
  email: string
  password: string
}

export type LoginField = keyof LoginFormValues
export type RegisterField = keyof RegisterFormValues

export function validateLoginForm(
  values: LoginFormValues,
): FormResult<LoginFormValues, LoginField> {
  return runSchema(loginSchema, { ...values, email: values.email.trim() }, AUTH_KEYS)
}

export function validateRegisterForm(
  values: RegisterFormValues,
): FormResult<RegisterFormValues, RegisterField> {
  return runSchema(registerSchema, { ...values, email: values.email.trim() }, AUTH_KEYS)
}
