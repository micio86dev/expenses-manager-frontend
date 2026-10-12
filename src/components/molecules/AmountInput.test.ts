import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AmountInput from './AmountInput.vue'

function render(props: Record<string, unknown> = {}) {
  return mount(AmountInput, {
    props: {
      label: 'Amount',
      hint: 'For example 12.50',
      currencyLabel: 'Currency',
      modelValue: '',
      currency: 'EUR',
      currencies: ['EUR', 'USD'],
      ...props,
    },
    attachTo: document.body,
  })
}

describe('AmountInput', () => {
  it('is a decimal text field with a visible label and hint', () => {
    const wrapper = render()
    const input = wrapper.get('input')
    expect(input.attributes('inputmode')).toBe('decimal')
    expect(input.attributes('autocomplete')).toBe('off')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('[data-hint]').text()).toBe('For example 12.50')
    expect(input.attributes('aria-describedby')).toContain(
      wrapper.get('[data-hint]').attributes('id'),
    )
  })

  it('reports what is typed and the chosen currency', async () => {
    const wrapper = render()
    await wrapper.get('input').setValue('12,50')
    await wrapper.get('select').setValue('USD')
    expect(wrapper.emitted('update:modelValue')).toEqual([['12,50']])
    expect(wrapper.emitted('update:currency')).toEqual([['USD']])
  })

  it('labels the currency select', () => {
    const wrapper = render()
    const select = wrapper.get('select')
    expect(wrapper.findAll('label')[1]?.attributes('for')).toBe(select.attributes('id'))
    expect(wrapper.findAll('label')[1]?.text()).toBe('Currency')
    expect(select.element.value).toBe('EUR')
  })

  it('shows an error linked to the field', () => {
    const wrapper = render({ errors: ['Enter an amount.'] })
    const error = wrapper.get('[data-error]')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('input').attributes('aria-describedby')).toContain(error.attributes('id'))
  })
})
