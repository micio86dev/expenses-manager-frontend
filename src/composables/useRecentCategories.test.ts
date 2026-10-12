import { effectScope, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { recentCategoriesKey, useRecentCategories } from './useRecentCategories'

describe('useRecentCategories', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keys the storage by owner', () => {
    expect(recentCategoriesKey('u1')).toBe('expenses.recent-categories.u1')
  })

  it('records the latest category first and persists it per owner', () => {
    const owner = ref<string | undefined>('u1')
    const recent = useRecentCategories(() => owner.value)
    recent.record('a')
    recent.record('b')
    recent.record('a')
    expect(recent.ids.value).toEqual(['a', 'b'])
    expect(JSON.parse(localStorage.getItem('expenses.recent-categories.u1') ?? '[]')).toEqual([
      'a',
      'b',
    ])
  })

  it('caps the stored list', () => {
    const recent = useRecentCategories(() => 'u1')
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) recent.record(id)
    expect(recent.ids.value).toEqual(['f', 'e', 'd', 'c', 'b'])
  })

  it('keeps each owner separate and follows owner changes', () => {
    localStorage.setItem(recentCategoriesKey('u2'), JSON.stringify(['z']))
    const owner = ref<string | undefined>('u1')
    const scope = effectScope()
    const recent = scope.run(() => useRecentCategories(() => owner.value))
    recent?.record('a')
    owner.value = 'u2'
    return Promise.resolve().then(() => {
      expect(recent?.ids.value).toEqual(['z'])
      scope.stop()
    })
  })

  it('ignores corrupted storage', () => {
    localStorage.setItem(recentCategoriesKey('u1'), '{not json')
    expect(useRecentCategories(() => 'u1').ids.value).toEqual([])
    localStorage.setItem(recentCategoriesKey('u1'), JSON.stringify({ a: 1 }))
    expect(useRecentCategories(() => 'u1').ids.value).toEqual([])
    localStorage.setItem(recentCategoriesKey('u1'), JSON.stringify(['a', 3, 'b']))
    expect(useRecentCategories(() => 'u1').ids.value).toEqual(['a', 'b'])
  })

  it('does not store anything without a signed-in owner', () => {
    const recent = useRecentCategories(() => undefined)
    recent.record('a')
    expect(recent.ids.value).toEqual(['a'])
    expect(localStorage.length).toBe(0)
  })
})
