// Validation of the add/edit expense form: turns what the person typed into an API payload.
import type { ExpenseInput } from '@/api/types'
import type { MessageKey } from '@/i18n/keys'
import { isIsoDate } from '@/lib/dates'
import { parseAmount } from './money'

export const MAX_DESCRIPTION_LENGTH = 255

export interface ExpenseFormValues {
  amount: string
  currency: string
  description: string
  categoryId: string
  spentOn: string
}

export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, MessageKey>>

export type ExpenseFormResult =
  { ok: true; value: ExpenseInput } | { ok: false; errors: ExpenseFormErrors }

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormResult {
  const amountCents = parseAmount(values.amount, values.currency)
  const description = values.description.trim()
  const errors: ExpenseFormErrors = {}
  if (amountCents === null) errors.amount = 'expenses.form.errors.amountInvalid'
  if (description === '') errors.description = 'expenses.form.errors.descriptionRequired'
  else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = 'expenses.form.errors.descriptionTooLong'
  }
  if (values.categoryId === '') errors.categoryId = 'expenses.form.errors.categoryRequired'
  if (!isIsoDate(values.spentOn)) errors.spentOn = 'expenses.form.errors.dateInvalid'
  if (amountCents === null || Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    value: {
      amountCents,
      currency: values.currency,
      description,
      categoryId: values.categoryId,
      spentOn: values.spentOn,
    },
  }
}
