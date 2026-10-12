import { vi } from 'vitest'
import type { User } from '@/api/types'

/** Shared mock of the auth API used by store and view tests (`vi.mock('@/api', ...)`). */
export const authApi = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  updateMe: vi.fn(),
}

export const categoriesApi = {
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  archive: vi.fn(),
  unarchive: vi.fn(),
}

export const expensesApi = {
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}

export const statsApi = {
  summary: vi.fn(),
  byCategory: vi.fn(),
  timeseries: vi.fn(),
  topExpenses: vi.fn(),
}

export const apiMock = { authApi, categoriesApi, expensesApi, statsApi, onUnauthorized: vi.fn() }

export const sampleUser: User = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@example.com',
  locale: 'en',
  createdAt: '2026-10-12T10:00:00Z',
}
