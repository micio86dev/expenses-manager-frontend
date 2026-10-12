// Optimistic updates: change local state first, confirm with the server, undo on failure.

export interface OptimisticPlan<T> {
  /** Applies the expected outcome to local state immediately. */
  apply: () => void
  /** Restores the state exactly as it was before `apply`. */
  rollback: () => void
  /** The real request. */
  request: () => Promise<T>
  /** Reconciles local state with the server's answer. */
  commit?: (result: T) => void
}

/** Rejections are rethrown after the rollback so callers can still report the cause. */
export async function runOptimistic<T>(plan: OptimisticPlan<T>): Promise<T> {
  plan.apply()
  let result: T
  try {
    result = await plan.request()
  } catch (error) {
    plan.rollback()
    throw error
  }
  plan.commit?.(result)
  return result
}

export const TEMP_ID_PREFIX = 'pending-'

let tempCounter = 0

/** An id for a record the server has not confirmed yet. */
export function tempId(): string {
  tempCounter += 1
  return `${TEMP_ID_PREFIX}${String(tempCounter)}`
}

export function isTempId(id: string): boolean {
  return id.startsWith(TEMP_ID_PREFIX)
}

/** Placeholder creation time of a record the server has not confirmed; it sorts as the newest. */
export const UNCONFIRMED_AT = '9999-12-31T23:59:59Z'
