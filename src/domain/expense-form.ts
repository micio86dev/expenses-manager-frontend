// Validation of the add/edit expense form: turns what the person typed into an API payload.
import { z } from 'zod'
import type { ExpenseInput } from '@/api/types'
import type { MessageKey } from '@/i18n/keys'
import { isIsoDate } from '@/lib/dates'
import { type FormResult, runSchema } from './validation'
import { parseAmount } from './money'

export const MAX_DESCRIPTION_LENGTH = 255

/** Every message the expense form can show. Typed against MessageKey, so a typo fails to compile. */
export const EXPENSE_MESSAGES = {
  amountInvalid: 'expenses.form.errors.amountInvalid',
  descriptionRequired: 'expenses.form.errors.descriptionRequired',
  descriptionTooLong: 'expenses.form.errors.descriptionTooLong',
  categoryRequired: 'expenses.form.errors.categoryRequired',
  dateInvalid: 'expenses.form.errors.dateInvalid',
} as const satisfies Record<string, MessageKey>

const EXPENSE_KEYS: ReadonlySet<MessageKey> = new Set<MessageKey>(Object.values(EXPENSE_MESSAGES))

export interface ExpenseFormValues {
  amount: string
  currency: string
  description: string
  categoryId: string
  spentOn: string
}

export type ExpenseField = keyof ExpenseFormValues
export type ExpenseFormErrors = Partial<Record<ExpenseField, MessageKey>>
export type ExpenseFormResult = FormResult<ExpenseInput, ExpenseField>

/**
 * The amount is parsed against the currency's minor units (JPY has none, EUR has two). A value that
 * does not parse becomes the amount's own issue, so the field's message stays with the field.
 */
function expenseSchema(currency: string) {
  return z.object({
    amount: z.string().transform((value, ctx) => {
      const cents = parseAmount(value, currency)
      if (cents === null) {
        ctx.addIssue({ code: 'custom', message: EXPENSE_MESSAGES.amountInvalid, input: value })
        return z.NEVER
      }
      return cents
    }),
    currency: z.string(),
    description: z
      .string()
      .trim()
      .min(1, { error: EXPENSE_MESSAGES.descriptionRequired })
      .max(MAX_DESCRIPTION_LENGTH, { error: EXPENSE_MESSAGES.descriptionTooLong }),
    categoryId: z.string().min(1, { error: EXPENSE_MESSAGES.categoryRequired }),
    spentOn: z.string().refine(isIsoDate, { error: EXPENSE_MESSAGES.dateInvalid }),
  })
}

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormResult {
  const result = runSchema<z.output<ReturnType<typeof expenseSchema>>, ExpenseField>(
    expenseSchema(values.currency),
    values,
    EXPENSE_KEYS,
  )
  if (!result.ok) return result
  const { amount, currency, description, categoryId, spentOn } = result.value
  return {
    ok: true,
    value: { amountCents: amount, currency, description, categoryId, spentOn },
  }
}
