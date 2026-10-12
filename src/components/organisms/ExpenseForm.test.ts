import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { makeCategory } from '../../../tests/fixtures'
import { expectNoA11yViolations } from '../../../tests/helpers'
import ExpenseForm from './ExpenseForm.vue'

const groceries = makeCategory({ id: 'c1', name: 'Groceries' })
const travel = makeCategory({ id: 'c2', name: 'Travel' })

const initial = {
  amount: '',
  currency: 'EUR',
  description: '',
  categoryId: '',
  spentOn: '2026-10-12',
}

function render(props: Record<string, unknown> = {}) {
  return mount(ExpenseForm, {
    props: { initial, categories: [groceries, travel], recent: [], editing: false, ...props },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('ExpenseForm', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('puts the amount first, as a decimal field', () => {
    const wrapper = render()
    const first = wrapper.get('input, select, textarea')
    expect(first.attributes('inputmode')).toBe('decimal')
    expect(first.attributes('id')).toBe(wrapper.get('label').attributes('for'))
    expect(wrapper.get('label').text()).toBe('Amount')
  })

  it('defaults the currency to EUR and the date to the given day', () => {
    const wrapper = render()
    expect(wrapper.get<HTMLSelectElement>('select[data-currency]').element.value).toBe('EUR')
    expect(wrapper.get<HTMLInputElement>('input[type=date]').element.value).toBe('2026-10-12')
  })

  it('shows recent categories as chips and selects one with a tap', async () => {
    const wrapper = render({ recent: [travel, groceries] })
    const chips = wrapper.findAll('button[aria-pressed]')
    expect(chips.map((c) => c.text())).toEqual(['Travel', 'Groceries'])
    expect(chips.every((c) => c.attributes('aria-pressed') === 'false')).toBe(true)
    await chips[1]?.trigger('click')
    expect(wrapper.get<HTMLSelectElement>('select[data-category]').element.value).toBe('c1')
    expect(wrapper.findAll('button[aria-pressed]')[1]?.attributes('aria-pressed')).toBe('true')
  })

  it('omits the recent categories group when there are none', () => {
    const wrapper = render()
    expect(wrapper.find('button[aria-pressed]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Recent categories')
  })

  it('converts the amount to cents on submit', async () => {
    const wrapper = render()
    await wrapper.get('input[inputmode=decimal]').setValue('1.234,56')
    await wrapper.get('select[data-category]').setValue('c2')
    await wrapper.get('input[data-description]').setValue('  Train ticket ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          amountCents: 123456,
          currency: 'EUR',
          description: 'Train ticket',
          categoryId: 'c2',
          spentOn: '2026-10-12',
        },
      ],
    ])
  })

  it('does not submit invalid input and explains each problem', async () => {
    const wrapper = render()
    await wrapper.get('input[inputmode=decimal]').setValue('-5')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    const errors = wrapper.findAll('[data-error]').map((e) => e.text())
    expect(errors).toEqual([
      'Enter an amount above zero with at most two decimals.',
      'Pick a category.',
      'Enter a description.',
    ])
    expect(wrapper.get('input[inputmode=decimal]').attributes('aria-invalid')).toBe('true')
  })

  it('shows server-side field errors', () => {
    const wrapper = render({ serverErrors: { amountCents: ['The amount is too large.'] } })
    expect(wrapper.get('[data-error]').text()).toBe('The amount is too large.')
  })

  it('offers delete only when editing', async () => {
    expect(render().find('button[data-delete]').exists()).toBe(false)
    const wrapper = render({ editing: true })
    await wrapper.get('button[data-delete]').trigger('click')
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })

  it('keeps an archived category selectable while editing its expense', () => {
    const archived = makeCategory({ id: 'c3', name: 'Old hobby', archived: true })
    const wrapper = render({
      categories: [groceries, archived],
      initial: { ...initial, categoryId: 'c3' },
    })
    const options = wrapper.findAll('select[data-category] option').map((o) => o.text())
    expect(options).toContain('Old hobby')
  })

  it('cancels', async () => {
    const wrapper = render()
    await wrapper.get('button[data-cancel]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('has no axe violations, with and without errors', async () => {
    const wrapper = render({ recent: [groceries], editing: true })
    await expectNoA11yViolations(wrapper.element)
    await wrapper.get('form').trigger('submit')
    await expectNoA11yViolations(wrapper.element)
  })
})
