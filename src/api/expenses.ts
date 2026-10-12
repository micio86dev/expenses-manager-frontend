import type { ApiClient } from './client'
import type { Expense, ExpenseInput, PaginationMeta } from './types'

interface Envelope<T> {
  data: T
}

/** `from` and `to` are required by the contract, so they cannot be left out. */
export interface ListExpensesParams {
  from: string
  to: string
  categoryId?: string
  q?: string
  page?: number
  perPage?: number
}

export interface ExpensePage {
  data: Expense[]
  meta: PaginationMeta
}

export function createExpensesApi(client: ApiClient) {
  return {
    list(params: ListExpensesParams, signal?: AbortSignal): Promise<ExpensePage> {
      return client.request<ExpensePage>('GET', '/expenses', {
        query: {
          from: params.from,
          to: params.to,
          category_id: params.categoryId,
          q: params.q,
          page: params.page,
          per_page: params.perPage,
        },
        ...(signal === undefined ? {} : { signal }),
      })
    },
    async create(input: ExpenseInput): Promise<Expense> {
      const { data } = await client.request<Envelope<Expense>>('POST', '/expenses', {
        body: input,
      })
      return data
    },
    async update(id: string, input: ExpenseInput): Promise<Expense> {
      const { data } = await client.request<Envelope<Expense>>('PUT', `/expenses/${id}`, {
        body: input,
      })
      return data
    },
    async remove(id: string): Promise<void> {
      await client.request('DELETE', `/expenses/${id}`)
    },
  }
}

export type ExpensesApi = ReturnType<typeof createExpensesApi>
