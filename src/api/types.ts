import type { components } from './schema'
import type { Camelize } from './case'

type Schemas = components['schemas']

export type Locale = Schemas['Locale']
export type User = Camelize<Schemas['User']>
export type LoginInput = Camelize<Schemas['LoginInput']>
export type RegisterInput = Camelize<Schemas['RegisterInput']>
export type ProfileInput = Camelize<Schemas['ProfileInput']>
export type AuthSession = Camelize<NonNullable<Schemas['AuthResource']['data']>>
