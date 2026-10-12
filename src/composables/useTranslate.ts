import { useI18n } from 'vue-i18n'
import type { MessageKey } from '@/i18n/keys'

/** Key-checked translation function: unknown keys fail the type check. */
export function useTranslate(): (key: MessageKey) => string {
  const { t } = useI18n()
  return (key) => t(key)
}
