import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { makeExpense } from '../../tests/fixtures'
import { useExpenseSheetStore } from './expenseSheet'

describe('expense sheet store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts closed', () => {
    const sheet = useExpenseSheetStore()
    expect(sheet.isOpen).toBe(false)
    expect(sheet.editing).toBeNull()
  })

  it('opens empty to add an expense', () => {
    const sheet = useExpenseSheetStore()
    sheet.openCreate()
    expect(sheet.isOpen).toBe(true)
    expect(sheet.editing).toBeNull()
  })

  it('opens on an expense to edit it, and closes', () => {
    const sheet = useExpenseSheetStore()
    const expense = makeExpense()
    sheet.openEdit(expense)
    expect(sheet.isOpen).toBe(true)
    expect(sheet.editing).toEqual(expense)
    sheet.close()
    expect(sheet.isOpen).toBe(false)
    expect(sheet.editing).toBeNull()
  })
})
