import { onScopeDispose, readonly, ref } from 'vue'

/** Whether the browser believes it is online (a failed request is the other half of the signal). */
export function useOnline() {
  const online = ref(navigator.onLine)
  const goOnline = (): void => {
    online.value = true
  }
  const goOffline = (): void => {
    online.value = false
  }
  window.addEventListener('online', goOnline)
  window.addEventListener('offline', goOffline)
  onScopeDispose(() => {
    window.removeEventListener('online', goOnline)
    window.removeEventListener('offline', goOffline)
  })
  return readonly(online)
}
