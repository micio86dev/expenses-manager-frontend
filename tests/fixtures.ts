import type { Category, Expense } from '@/api/types'

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'c1',
    name: 'Groceries',
    color: '#0B6B72',
    icon: 'cart',
    isSystem: false,
    archived: false,
    createdAt: '2026-10-01T08:00:00Z',
    ...overrides,
  }
}

export function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    description: 'Lunch',
    amountCents: 1250,
    currency: 'EUR',
    categoryId: 'c1',
    spentOn: '2026-10-12',
    createdAt: '2026-10-12T12:00:00Z',
    updatedAt: '2026-10-12T12:00:00Z',
    ...overrides,
  }
}
