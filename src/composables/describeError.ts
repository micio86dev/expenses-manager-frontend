import type { ApiError } from '@/api/errors'
import { translate } from '@/i18n'

/** Human-readable message for a failed call; server messages arrive already localized. */
export function describeError(error: ApiError | null): string | null {
  if (error === null) return null
  if (error.kind === 'network') return translate('errors.network')
  return error.detail ?? error.title
}
