import { describe, expect, it, vi } from 'vitest'
import { makeExpense } from '../../tests/fixtures'
import type { ApiClient } from './client'
import { createStatsApi } from './stats'

function fakeClient() {
  const conditional = vi.fn()
  return { client: { conditional } as unknown as ApiClient, conditional }
}

const range = { from: '2026-10-01', to: '2026-10-31', currency: 'EUR' }

describe('stats api', () => {
  it('requests the summary for a range and currency', async () => {
    const { client, conditional } = fakeClient()
    conditional.mockResolvedValue({
      notModified: false,
      data: { data: { totalCents: 1 } },
      etag: 'e',
    })
    const result = await createStatsApi(client).summary(range)
    expect(result).toEqual({ notModified: false, data: { totalCents: 1 }, etag: 'e' })
    expect(conditional).toHaveBeenCalledWith('GET', '/stats/summary', {
      query: { from: '2026-10-01', to: '2026-10-31', currency: 'EUR' },
    })
  })

  it('sends the cached ETag and the abort signal', async () => {
    const { client, conditional } = fakeClient()
    conditional.mockResolvedValue({ notModified: true })
    const controller = new AbortController()
    const result = await createStatsApi(client).byCategory(range, {
      etag: '"v1"',
      signal: controller.signal,
    })
    expect(result).toEqual({ notModified: true })
    expect(conditional).toHaveBeenCalledWith('GET', '/stats/by-category', {
      query: { from: '2026-10-01', to: '2026-10-31', currency: 'EUR' },
      etag: '"v1"',
      signal: controller.signal,
    })
  })

  it('maps the timeseries granularity', async () => {
    const { client, conditional } = fakeClient()
    conditional.mockResolvedValue({ notModified: false, data: { data: [] }, etag: null })
    await expect(createStatsApi(client).timeseries(range, 'week')).resolves.toEqual({
      notModified: false,
      data: [],
      etag: null,
    })
    expect(conditional).toHaveBeenCalledWith('GET', '/stats/timeseries', {
      query: { from: '2026-10-01', to: '2026-10-31', currency: 'EUR', granularity: 'week' },
    })
  })

  it('maps the top expenses limit', async () => {
    const { client, conditional } = fakeClient()
    conditional.mockResolvedValue({
      notModified: false,
      data: { data: [makeExpense()] },
      etag: '"t"',
    })
    await expect(createStatsApi(client).topExpenses(range, 5)).resolves.toEqual({
      notModified: false,
      data: [makeExpense()],
      etag: '"t"',
    })
    expect(conditional).toHaveBeenCalledWith('GET', '/stats/top-expenses', {
      query: { from: '2026-10-01', to: '2026-10-31', currency: 'EUR', limit: 5 },
    })
  })
})
