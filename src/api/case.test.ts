import { describe, expect, expectTypeOf, it } from 'vitest'
import { camelizeKeys, snakeizeKeys, type Camelize } from './case'

describe('case mappers', () => {
  it('converts snake_case keys to camelCase recursively, including arrays', () => {
    const input = {
      created_at: '2026-10-12',
      nested_value: { per_page: 20, items: [{ category_id: 'a_b' }] },
    }
    expect(camelizeKeys(input)).toEqual({
      createdAt: '2026-10-12',
      nestedValue: { perPage: 20, items: [{ categoryId: 'a_b' }] },
    })
  })

  it('converts camelCase keys to snake_case recursively', () => {
    expect(
      snakeizeKeys({ categoryId: 'x', spentOn: { dayOfMonth: 1 }, list: [{ aB: 1 }] }),
    ).toEqual({ category_id: 'x', spent_on: { day_of_month: 1 }, list: [{ a_b: 1 }] })
  })

  it('leaves primitives, null and undefined untouched', () => {
    expect(camelizeKeys('a_b')).toBe('a_b')
    expect(camelizeKeys(null)).toBeNull()
    expect(snakeizeKeys(undefined)).toBeUndefined()
    expect(snakeizeKeys(3)).toBe(3)
  })

  it('maps keys at the type level', () => {
    expectTypeOf<
      Camelize<{ created_at: string; user_list: { first_name: string }[] }>
    >().toEqualTypeOf<{
      createdAt: string
      userList: { firstName: string }[]
    }>()
  })
})
