import { onScopeDispose, readonly, ref, watch, type Ref } from 'vue'

/** A copy of `source` that only follows it once it has been stable for `delayMs`. */
export function useDebouncedValue<T>(source: Ref<T>, delayMs: number) {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delayMs)
  })
  onScopeDispose(() => {
    clearTimeout(timer)
  })

  return readonly(debounced)
}
