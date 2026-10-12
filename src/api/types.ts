import type { components } from './schema'
import type { Camelize } from './case'

type Schemas = components['schemas']

export type Locale = Schemas['Locale']
export type User = Camelize<Schemas['User']>
export type LoginInput = Camelize<Schemas['LoginInput']>
export type RegisterInput = Camelize<Schemas['RegisterInput']>
export type ProfileInput = Camelize<Schemas['ProfileInput']>
export type AuthSession = Camelize<NonNullable<Schemas['AuthResource']['data']>>
export type Currency = Schemas['Currency']
export type Category = Camelize<Schemas['Category']>
export type CategoryInput = Camelize<Schemas['CategoryInput']>
export type CategoryIcon = Schemas['CategoryIcon']
export type Expense = Camelize<Schemas['Expense']>
export type ExpenseInput = Camelize<Schemas['ExpenseInput']>
export type PaginationMeta = Camelize<Schemas['PaginationMeta']>
export type StatsSummary = Camelize<Schemas['StatsSummaryResource']['data']>
export type CategoryStat = Camelize<Schemas['CategoryStat']>
export type TimeseriesBucket = Camelize<Schemas['TimeseriesBucket']>
export type Granularity = components['parameters']['Granularity']
