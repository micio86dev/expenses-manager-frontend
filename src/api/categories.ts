import type { ApiClient } from './client'
import type { Category, CategoryInput } from './types'

interface Envelope<T> {
  data: T
}

export function createCategoriesApi(client: ApiClient) {
  const send = async (method: string, path: string): Promise<Category> =>
    (await client.request<Envelope<Category>>(method, path)).data

  return {
    /** Every category; archived ones are included so the UI can toggle them without refetching. */
    async list(): Promise<Category[]> {
      const { data } = await client.request<Envelope<Category[]>>('GET', '/categories', {
        query: { include_archived: true },
      })
      return data
    },
    async create(input: CategoryInput): Promise<Category> {
      const { data } = await client.request<Envelope<Category>>('POST', '/categories', {
        body: input,
      })
      return data
    },
    async update(id: string, input: CategoryInput): Promise<Category> {
      const { data } = await client.request<Envelope<Category>>('PUT', `/categories/${id}`, {
        body: input,
      })
      return data
    },
    async remove(id: string): Promise<void> {
      await client.request('DELETE', `/categories/${id}`)
    },
    archive: (id: string): Promise<Category> => send('POST', `/categories/${id}/archive`),
    unarchive: (id: string): Promise<Category> => send('POST', `/categories/${id}/unarchive`),
  }
}

export type CategoriesApi = ReturnType<typeof createCategoriesApi>
