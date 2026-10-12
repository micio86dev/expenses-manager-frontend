import { ref } from 'vue'
import { ApiError } from '@/api/errors'

/** Wraps a form action: tracks the pending state and keeps the last API error for display. */
export function useSubmit<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const submitting = ref(false)
  const error = ref<ApiError | null>(null)

  /** Resolves true on success and false on an API error; unexpected errors are rethrown. */
  async function run(...args: Args): Promise<boolean> {
    submitting.value = true
    error.value = null
    try {
      await action(...args)
      return true
    } catch (caught) {
      if (caught instanceof ApiError) {
        error.value = caught
        return false
      }
      throw caught
    } finally {
      submitting.value = false
    }
  }

  return { submitting, error, run }
}
