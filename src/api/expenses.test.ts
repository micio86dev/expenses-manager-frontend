import { describe, expect, it, vi } from 'vitest'
import { makeExpense } from '../../tests/fixtures'
import type { ApiClient } from './client'
import { createExpensesApi } from './expenses'

function fakeClient() {
  const request = vi.fn()
  return { client: { request } as unknown as ApiClient, request }
}

const meta = { currentPage: 1, perPage: 50, total: 1, lastPage: 1 }

describe('expenses api', () => {
  it('always sends the required period and omits unset filters', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: [makeExpense()], meta })
    const result = await createExpensesApi(client).list({ from: '2026-10-01', to: '2026-10-31' })
    expect(result).toEqual({ data: [makeExpense()], meta })
    expect(request).toHaveBeenCalledWith('GET', '/expenses', {
      query: { from: '2026-10-01', to: '2026-10-31' },
    })
  })

  it('maps filters and pagination to snake_case query parameters', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: [], meta })
    await createExpensesApi(client).list({
      from: '2026-10-01',
      to: '2026-10-31',
      categoryId: 'c1',
      q: 'lunch',
      page: 2,
      perPage: 25,
    })
    expect(request).toHaveBeenCalledWith('GET', '/expenses', {
      query: {
        from: '2026-10-01',
        to: '2026-10-31',
        category_id: 'c1',
        q: 'lunch',
        page: 2,
        per_page: 25,
      },
    })
  })

  it('forwards an abort signal', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: [], meta })
    const controller = new AbortController()
    await createExpensesApi(client).list({ from: 'a', to: 'b' }, controller.signal)
    expect(request).toHaveBeenCalledWith('GET', '/expenses', {
      query: { from: 'a', to: 'b' },
      signal: controller.signal,
    })
  })

  it('creates, updates and deletes', async () => {
    const { client, request } = fakeClient()
    request.mockResolvedValue({ data: makeExpense() })
    const api = createExpensesApi(client)
    const input = {
      description: 'Lunch',
      amountCents: 1250,
      currency: 'EUR',
      categoryId: 'c1',
      spentOn: '2026-10-12',
    }
    await expect(api.create(input)).resolves.toEqual(makeExpense())
    expect(request).toHaveBeenLastCalledWith('POST', '/expenses', { body: input })
    await api.update('e1', input)
    expect(request).toHaveBeenLastCalledWith('PUT', '/expenses/e1', { body: input })
    await api.remove('e1')
    expect(request).toHaveBeenLastCalledWith('DELETE', '/expenses/e1')
  })
})
