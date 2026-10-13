// Shared plumbing for the zod schemas behind the forms: a failed rule carries its translation key
// as the zod message, so the first issue per field is already the text key the form shows.
import type { z } from 'zod'
import type { MessageKey } from '@/i18n/keys'

export type FieldMessages<Field extends string> = Partial<Record<Field, MessageKey>>

export type FormResult<Value, Field extends string> =
  { ok: true; value: Value } | { ok: false; errors: FieldMessages<Field> }

/**
 * Runs a schema and maps each field's first failed rule to its message. A rule whose message is not
 * in `messageKeys` is a developer error (a rule without a translation key), so it throws instead of
 * showing a raw English string or a missing key.
 */
export function runSchema<Value, Field extends string>(
  schema: z.ZodType<Value>,
  input: unknown,
  messageKeys: ReadonlySet<MessageKey>,
): FormResult<Value, Field> {
  const result = schema.safeParse(input)
  if (result.success) return { ok: true, value: result.data }
  const errors: Partial<Record<string, MessageKey>> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '')
    if (!isMessageKey(messageKeys, issue.message)) {
      throw new Error(`Validation rule on "${field}" has no translation key: ${issue.message}`)
    }
    if (field !== '' && errors[field] === undefined) errors[field] = issue.message
  }
  return { ok: false, errors }
}

function isMessageKey(
  messageKeys: ReadonlySet<MessageKey>,
  message: string,
): message is MessageKey {
  return (messageKeys as ReadonlySet<string>).has(message)
}
