import { ref, watch } from 'vue'
import { recordRecentCategory } from '@/domain/categories'

export function recentCategoriesKey(ownerId: string): string {
  return `expenses.recent-categories.${ownerId}`
}

function read(ownerId: string | undefined): string[] {
  if (ownerId === undefined) return []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(recentCategoriesKey(ownerId)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

/** The categories used most recently, remembered on this device for each signed-in user. */
export function useRecentCategories(ownerId: () => string | undefined) {
  const ids = ref<string[]>(read(ownerId()))

  watch(ownerId, (next) => {
    ids.value = read(next)
  })

  function record(categoryId: string): void {
    ids.value = recordRecentCategory(ids.value, categoryId)
    const owner = ownerId()
    if (owner !== undefined) {
      localStorage.setItem(recentCategoriesKey(owner), JSON.stringify(ids.value))
    }
  }

  return { ids, record }
}
