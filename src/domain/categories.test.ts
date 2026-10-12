import { describe, expect, it } from 'vitest'
import { makeCategory } from '../../tests/fixtures'
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  RECENT_CATEGORY_CAP,
  recentCategories,
  recordRecentCategory,
  validateCategoryForm,
  visibleCategories,
} from './categories'

describe('category palette', () => {
  it('offers a fixed set of colours and the contract icons', () => {
    expect(CATEGORY_COLORS.length).toBeGreaterThanOrEqual(6)
    for (const { hex } of CATEGORY_COLORS) expect(hex).toMatch(/^#[0-9A-F]{6}$/)
    expect(CATEGORY_ICONS).toEqual([
      'cart',
      'home',
      'car',
      'bolt',
      'heart',
      'plane',
      'coffee',
      'gift',
      'book',
      'briefcase',
      'tag',
      'other',
    ])
  })
})

describe('validateCategoryForm', () => {
  const valid = { name: ' Pets ', color: CATEGORY_COLORS[0].hex, icon: 'heart' } as const

  it('trims the name and accepts palette values', () => {
    expect(validateCategoryForm(valid)).toEqual({
      ok: true,
      value: { name: 'Pets', color: valid.color, icon: 'heart' },
    })
  })

  it('reports each invalid field with a message key', () => {
    const result = validateCategoryForm({ name: '   ', color: '#123456', icon: 'nope' })
    expect(result).toEqual({
      ok: false,
      errors: {
        name: 'categories.form.errors.nameRequired',
        color: 'categories.form.errors.colorInvalid',
        icon: 'categories.form.errors.iconInvalid',
      },
    })
  })

  it('rejects names longer than 60 characters', () => {
    const result = validateCategoryForm({ ...valid, name: 'x'.repeat(61) })
    expect(result).toEqual({
      ok: false,
      errors: { name: 'categories.form.errors.nameTooLong' },
    })
    expect(validateCategoryForm({ ...valid, name: 'x'.repeat(60) }).ok).toBe(true)
  })

  it('compares colours case-insensitively', () => {
    const lower = valid.color.toLowerCase()
    expect(validateCategoryForm({ ...valid, color: lower })).toMatchObject({
      ok: true,
      value: { color: valid.color },
    })
  })
})

describe('visibleCategories', () => {
  const active = makeCategory({ id: 'a' })
  const archived = makeCategory({ id: 'b', archived: true })

  it('hides archived categories unless asked', () => {
    expect(visibleCategories([active, archived], false)).toEqual([active])
    expect(visibleCategories([active, archived], true)).toEqual([active, archived])
  })
})

describe('recent categories', () => {
  it('moves the latest category to the front without duplicates', () => {
    expect(recordRecentCategory(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b'])
    expect(recordRecentCategory([], 'a')).toEqual(['a'])
  })

  it('caps the list', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    expect(RECENT_CATEGORY_CAP).toBe(5)
    expect(recordRecentCategory(ids, 'f')).toEqual(['f', 'a', 'b', 'c', 'd'])
    expect(recordRecentCategory(ids, 'f', 2)).toEqual(['f', 'a'])
  })

  it('resolves ids to active categories in recency order', () => {
    const a = makeCategory({ id: 'a' })
    const b = makeCategory({ id: 'b', archived: true })
    const c = makeCategory({ id: 'c' })
    expect(recentCategories(['c', 'zzz', 'b', 'a'], [a, b, c])).toEqual([c, a])
  })
})
