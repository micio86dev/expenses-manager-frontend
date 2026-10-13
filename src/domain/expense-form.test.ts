import { describe, expect, it } from 'vitest'
import { validateExpenseForm } from './expense-form'

const valid = {
  amount: '12,50',
  currency: 'EUR',
  description: ' Lunch ',
  categoryId: 'c1',
  spentOn: '2026-10-12',
}

describe('validateExpenseForm', () => {
  it('converts the amount to cents and trims the description', () => {
    expect(validateExpenseForm(valid)).toEqual({
      ok: true,
      value: {
        amountCents: 1250,
        currency: 'EUR',
        description: 'Lunch',
        categoryId: 'c1',
        spentOn: '2026-10-12',
      },
    })
  })

  it('reports every invalid field', () => {
    expect(
      validateExpenseForm({
        amount: '0',
        currency: 'EUR',
        description: ' ',
        categoryId: '',
        spentOn: '12/10',
      }),
    ).toEqual({
      ok: false,
      errors: {
        amount: 'expenses.form.errors.amountInvalid',
        description: 'expenses.form.errors.descriptionRequired',
        categoryId: 'expenses.form.errors.categoryRequired',
        spentOn: 'expenses.form.errors.dateInvalid',
      },
    })
  })

  it('rejects descriptions above 255 characters', () => {
    const result = validateExpenseForm({ ...valid, description: 'x'.repeat(256) })
    expect(result).toEqual({
      ok: false,
      errors: { description: 'expenses.form.errors.descriptionTooLong' },
    })
  })

  it('applies the currency minor units to the amount', () => {
    expect(validateExpenseForm({ ...valid, currency: 'JPY', amount: '12' })).toMatchObject({
      ok: true,
      value: { amountCents: 12, currency: 'JPY' },
    })
    expect(validateExpenseForm({ ...valid, currency: 'JPY', amount: '12,5' })).toEqual({
      ok: false,
      errors: { amount: 'expenses.form.errors.amountInvalid' },
    })
  })

  it('rejects amounts above the contract maximum', () => {
    expect(validateExpenseForm({ ...valid, amount: '1000000000' })).toEqual({
      ok: false,
      errors: { amount: 'expenses.form.errors.amountInvalid' },
    })
  })
})
