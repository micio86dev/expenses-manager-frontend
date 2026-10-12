import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNoticesStore } from './notices'

describe('notices store', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('queues notices with distinct ids', () => {
    const notices = useNoticesStore()
    const first = notices.push('error', 'Could not save')
    const second = notices.push('success', 'Saved')
    expect(first).not.toBe(second)
    expect(notices.items.map((n) => [n.kind, n.message])).toEqual([
      ['error', 'Could not save'],
      ['success', 'Saved'],
    ])
  })

  it('dismisses a notice by id', () => {
    const notices = useNoticesStore()
    const id = notices.push('error', 'x')
    notices.dismiss(id)
    expect(notices.items).toEqual([])
    notices.dismiss(999)
    expect(notices.items).toEqual([])
  })

  it('dismisses a notice by itself after the timeout', () => {
    const notices = useNoticesStore()
    notices.push('error', 'x', 1000)
    vi.advanceTimersByTime(999)
    expect(notices.items).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(notices.items).toEqual([])
  })
})
