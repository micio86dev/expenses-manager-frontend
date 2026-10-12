import { useI18n } from 'vue-i18n'
import type { MessageKey } from '@/i18n/keys'

export type MessageParams = Record<string, string | number>

/** Key-checked translation function: unknown keys fail the type check. */
export function useTranslate(): (key: MessageKey, params?: MessageParams) => string {
  const { t } = useI18n()
  return (key, params) => (params === undefined ? t(key) : t(key, params))
}
