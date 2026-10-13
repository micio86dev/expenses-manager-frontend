import type { Ref } from 'vue'
import type { FieldMessages } from '@/domain/validation'
import { useTranslate } from './useTranslate'

/**
 * A message list per field: the rule this form found (translated), then what the server rejected
 * for the same field. `serverField` lets a form map its field to the API's name.
 */
export function useFieldMessages<Field extends string>(
  localErrors: Ref<FieldMessages<Field>>,
  serverErrors: () => Partial<Record<string, readonly string[]>> | undefined,
): (field: Field, serverField?: string) => string[] {
  const t = useTranslate()
  return (field, serverField = field) => {
    const key = localErrors.value[field]
    return [...(key === undefined ? [] : [t(key)]), ...(serverErrors()?.[serverField] ?? [])]
  }
}
