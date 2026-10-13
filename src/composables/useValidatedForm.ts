import { shallowRef } from 'vue'
import type { FieldMessages, FormResult } from '@/domain/validation'
import { useFieldMessages } from './useFieldMessages'

/**
 * The gate every form runs on submit: validate what was typed, keep the messages per field, and
 * return the payload only when the form is valid.
 */
export function useValidatedForm<Values, Value, Field extends string>(
  validate: (values: Values) => FormResult<Value, Field>,
  serverErrors: () => Partial<Record<string, readonly string[]>> | undefined,
) {
  // The error map is always replaced as a whole, so a shallow ref is enough and types cleanly.
  const errors = shallowRef<FieldMessages<Field>>({})
  const messages = useFieldMessages(errors, serverErrors)

  /** The payload when valid (and the messages are cleared); otherwise null, with the messages set. */
  function validated(values: Values): Value | null {
    const result = validate(values)
    if (result.ok) {
      errors.value = {}
      return result.value
    }
    errors.value = result.errors
    return null
  }

  return { messages, validated }
}
