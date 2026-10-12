import type { ApiClient } from './client'
import type { AuthSession, LoginInput, ProfileInput, RegisterInput, User } from './types'

interface Envelope<T> {
  data: T
}

export function createAuthApi(client: ApiClient) {
  return {
    async login(input: LoginInput): Promise<AuthSession> {
      const { data } = await client.request<Envelope<AuthSession>>('POST', '/auth/login', {
        auth: false,
        body: input,
      })
      return data
    },
    async register(input: RegisterInput): Promise<AuthSession> {
      const { data } = await client.request<Envelope<AuthSession>>('POST', '/auth/register', {
        auth: false,
        body: input,
      })
      return data
    },
    async logout(): Promise<void> {
      await client.request('POST', '/auth/logout')
    },
    async getMe(): Promise<User> {
      const { data } = await client.request<Envelope<User>>('GET', '/auth/me')
      return data
    },
    async updateMe(input: ProfileInput): Promise<User> {
      const { data } = await client.request<Envelope<User>>('PATCH', '/auth/me', { body: input })
      return data
    },
  }
}

export type AuthApi = ReturnType<typeof createAuthApi>
