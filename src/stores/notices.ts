import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Notice {
  id: number
  kind: 'error' | 'success'
  message: string
}

const DEFAULT_TIMEOUT_MS = 7000

/** Toast-style messages, rendered in an accessible live region by the app shell. */
export const useNoticesStore = defineStore('notices', () => {
  const items = ref<Notice[]>([])
  let nextId = 1

  function dismiss(id: number): void {
    items.value = items.value.filter((notice) => notice.id !== id)
  }

  function push(kind: Notice['kind'], message: string, timeoutMs = DEFAULT_TIMEOUT_MS): number {
    const id = nextId
    nextId += 1
    items.value = [...items.value, { id, kind, message }]
    setTimeout(() => {
      dismiss(id)
    }, timeoutMs)
    return id
  }

  return { items, push, dismiss }
})
