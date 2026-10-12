import { ApiError } from '@/api/errors'
import { describeError } from '@/composables/describeError'
import type { MessageKey } from '@/i18n/keys'
import { translate } from '@/i18n'
import { useNoticesStore } from './notices'

export type MutationResult<T> = { ok: true; value: T } | { ok: false; error: ApiError }

/**
 * Runs a store mutation. An API failure becomes a result (after `onFailure` reports it) so the
 * caller can react, e.g. by reopening a form; any other error is a bug and is rethrown.
 */
export async function settle<T>(
  run: () => Promise<T>,
  onFailure: (error: ApiError) => void,
): Promise<MutationResult<T>> {
  try {
    return { ok: true, value: await run() }
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    onFailure(error)
    return { ok: false, error }
  }
}

/** Tells the person that a change was undone, with the server's reason when there is one. */
export function reportFailure(key: MessageKey, error: ApiError): void {
  useNoticesStore().push('error', `${translate(key)} ${describeError(error) ?? ''}`.trim())
}
