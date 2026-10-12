import { effectScope, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the source value and waits for typing to pause', async () => {
    const source = ref('a')
    const debounced = useDebouncedValue(source, 250)
    expect(debounced.value).toBe('a')
    source.value = 'ab'
    await Promise.resolve()
    vi.advanceTimersByTime(200)
    source.value = 'abc'
    await Promise.resolve()
    vi.advanceTimersByTime(200)
    expect(debounced.value).toBe('a')
    vi.advanceTimersByTime(50)
    expect(debounced.value).toBe('abc')
  })

  it('cancels a pending update when its scope ends', async () => {
    const source = ref('')
    const scope = effectScope()
    const debounced = scope.run(() => useDebouncedValue(source, 250))
    source.value = 'late'
    await Promise.resolve()
    scope.stop()
    vi.advanceTimersByTime(500)
    expect(debounced?.value).toBe('')
  })
})
