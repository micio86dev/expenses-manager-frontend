import type { Messages } from './locales/it'

type LeafPaths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : LeafPaths<T[K], `${Prefix}${K}.`>
}[keyof T & string]

/** Every translatable key as a dot path, e.g. `nav.dashboard`. Derived from the `it` resource. */
export type MessageKey = LeafPaths<Messages>
