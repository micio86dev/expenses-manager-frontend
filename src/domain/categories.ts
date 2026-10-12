// Category palette, form validation, visibility and the "recent categories" ordering.
import type { Category, CategoryIcon, CategoryInput } from '@/api/types'
import type { MessageKey } from '@/i18n/keys'

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

export type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, MessageKey>>

export type CategoryFormResult =
  { ok: true; value: CategoryInput } | { ok: false; errors: CategoryFormErrors }

function isIcon(value: string): value is CategoryIcon {
  return (CATEGORY_ICONS as readonly string[]).includes(value)
}

export function validateCategoryForm(values: CategoryFormValues): CategoryFormResult {
  const name = values.name.trim()
  const palette = CATEGORY_COLORS.find((color) => color.hex === values.color.toUpperCase())
  const errors: CategoryFormErrors = {}
  if (name === '') errors.name = 'categories.form.errors.nameRequired'
  else if (name.length > MAX_CATEGORY_NAME_LENGTH)
    errors.name = 'categories.form.errors.nameTooLong'
  if (palette === undefined) errors.color = 'categories.form.errors.colorInvalid'
  if (!isIcon(values.icon)) errors.icon = 'categories.form.errors.iconInvalid'
  if (palette === undefined || !isIcon(values.icon) || errors.name !== undefined) {
    return { ok: false, errors }
  }
  return { ok: true, value: { name, color: palette.hex, icon: values.icon } }
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
