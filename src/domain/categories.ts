// Category palette, form validation, visibility and the "recent categories" ordering.
import { z } from 'zod'
import type { Category, CategoryIcon, CategoryInput } from '@/api/types'
import type { MessageKey } from '@/i18n/keys'
import { type FormResult, runSchema } from './validation'

/**
 * The fixed colour palette. The hex values mirror the `--category-*` design tokens (a test keeps
 * them in sync); they are sent to the API because the contract stores a hex colour.
 */
export const CATEGORY_COLORS = [
  { id: 'ocean', hex: '#0B6B72', labelKey: 'categories.colors.ocean' },
  { id: 'brick', hex: '#A32A3A', labelKey: 'categories.colors.brick' },
  { id: 'slate', hex: '#3F5A63', labelKey: 'categories.colors.slate' },
  { id: 'amber', hex: '#8A5A00', labelKey: 'categories.colors.amber' },
  { id: 'moss', hex: '#3F6B2B', labelKey: 'categories.colors.moss' },
  { id: 'plum', hex: '#6B3A7A', labelKey: 'categories.colors.plum' },
  { id: 'indigo', hex: '#3D4F9E', labelKey: 'categories.colors.indigo' },
  { id: 'rust', hex: '#B2571C', labelKey: 'categories.colors.rust' },
] as const satisfies readonly { id: string; hex: string; labelKey: MessageKey }[]

export const CATEGORY_ICONS = [
  'cart',
  'home',
  'car',
  'bolt',
  'heart',
  'plane',
  'coffee',
  'gift',
  'book',
  'briefcase',
  'tag',
  'other',
] as const satisfies readonly CategoryIcon[]

export const MAX_CATEGORY_NAME_LENGTH = 60
export const RECENT_CATEGORY_CAP = 5

export interface CategoryFormValues {
  name: string
  color: string
  icon: string
}

/** Every message the category form can show. Typed against MessageKey, so a typo fails to compile. */
export const CATEGORY_MESSAGES = {
  nameRequired: 'categories.form.errors.nameRequired',
  nameTooLong: 'categories.form.errors.nameTooLong',
  colorInvalid: 'categories.form.errors.colorInvalid',
  iconInvalid: 'categories.form.errors.iconInvalid',
} as const satisfies Record<string, MessageKey>

const CATEGORY_KEYS: ReadonlySet<MessageKey> = new Set<MessageKey>(Object.values(CATEGORY_MESSAGES))

/** Colours are compared case-insensitively and stored as the palette's canonical hex. */
const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: CATEGORY_MESSAGES.nameRequired })
    .max(MAX_CATEGORY_NAME_LENGTH, { error: CATEGORY_MESSAGES.nameTooLong }),
  color: z.string().transform((value, ctx) => {
    const palette = CATEGORY_COLORS.find((color) => color.hex === value.toUpperCase())
    if (palette === undefined) {
      ctx.addIssue({ code: 'custom', message: CATEGORY_MESSAGES.colorInvalid, input: value })
      return z.NEVER
    }
    return palette.hex
  }),
  icon: z.enum(CATEGORY_ICONS, { error: CATEGORY_MESSAGES.iconInvalid }),
})

export type CategoryField = keyof CategoryFormValues
export type CategoryFormErrors = Partial<Record<CategoryField, MessageKey>>
export type CategoryFormResult = FormResult<CategoryInput, CategoryField>

export function validateCategoryForm(values: CategoryFormValues): CategoryFormResult {
  const result = runSchema<z.output<typeof categorySchema>, CategoryField>(
    categorySchema,
    values,
    CATEGORY_KEYS,
  )
  if (!result.ok) return result
  return { ok: true, value: result.value }
}

export function visibleCategories(
  categories: readonly Category[],
  showArchived: boolean,
): Category[] {
  return categories.filter((category) => showArchived || !category.archived)
}

/** Puts `id` first, drops its earlier position and keeps at most `cap` entries. */
export function recordRecentCategory(
  ids: readonly string[],
  id: string,
  cap: number = RECENT_CATEGORY_CAP,
): string[] {
  return [id, ...ids.filter((existing) => existing !== id)].slice(0, cap)
}

/** Recent ids resolved to categories that still exist and are not archived, most recent first. */
export function recentCategories(
  ids: readonly string[],
  categories: readonly Category[],
): Category[] {
  const byId = new Map(categories.map((category) => [category.id, category]))
  return ids.flatMap((id) => {
    const category = byId.get(id)
    return category === undefined || category.archived ? [] : [category]
  })
}
