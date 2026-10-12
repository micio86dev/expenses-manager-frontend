// snake_case (wire format) <-> camelCase (application code). Only keys change, never values.

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S

/** Type-level counterpart of `camelizeKeys`. */
export type Camelize<T> = T extends readonly (infer Item)[]
  ? Camelize<Item>[]
  : T extends object
    ? { [K in keyof T as K extends string ? CamelCase<K> : K]: Camelize<T[K]> }
    : T

const toCamel = (key: string): string =>
  key.replace(/_+([a-z0-9])/g, (_, c: string) => c.toUpperCase())
const toSnake = (key: string): string => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

function mapKeys(value: unknown, convert: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => mapKeys(item, convert))
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [convert(key), mapKeys(item, convert)]),
    )
  }
  return value
}

export function camelizeKeys<T>(value: T): Camelize<T> {
  return mapKeys(value, toCamel) as Camelize<T>
}

export function snakeizeKeys(value: unknown): unknown {
  return mapKeys(value, toSnake)
}
