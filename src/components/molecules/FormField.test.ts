import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FormField from './FormField.vue'

describe('FormField', () => {
  it('associates the label with the input', () => {
    const wrapper = mount(FormField, { props: { label: 'Email', modelValue: '' } })
    const input = wrapper.get('input')
    expect(wrapper.get('label').attributes('for')).toBe(input.attributes('id'))
    expect(wrapper.get('label').text()).toBe('Email')
  })

  it('emits model updates', async () => {
    const wrapper = mount(FormField, { props: { label: 'Email', modelValue: '' } })
    await wrapper.get('input').setValue('a@b.c')
    expect(wrapper.emitted('update:modelValue')).toEqual([['a@b.c']])
  })

  it('links the hint to the input', () => {
    const wrapper = mount(FormField, {
      props: { label: 'Password', modelValue: '', hint: 'At least 8 characters.' },
    })
    const hint = wrapper.get('[data-hint]')
    expect(hint.text()).toBe('At least 8 characters.')
    expect(wrapper.get('input').attributes('aria-describedby')).toContain(hint.attributes('id'))
  })

  it('shows errors as text, marks the input invalid and links them', () => {
    const wrapper = mount(FormField, {
      props: { label: 'Email', modelValue: '', errors: ['Already taken', 'Invalid'] },
    })
    const input = wrapper.get('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    const error = wrapper.get('[data-error]')
    expect(error.text()).toContain('Already taken')
    expect(error.text()).toContain('Invalid')
    expect(input.attributes('aria-describedby')).toContain(error.attributes('id'))
  })

  it('has no error or description when everything is fine', () => {
    const wrapper = mount(FormField, { props: { label: 'Email', modelValue: '' } })
    expect(wrapper.find('[data-error]').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-describedby')).toBeUndefined()
  })

  it('passes input attributes through', () => {
    const wrapper = mount(FormField, {
      props: {
        label: 'Email',
        modelValue: '',
        type: 'email',
        autocomplete: 'email',
        required: true,
        minlength: 3,
      },
    })
    const input = wrapper.get('input')
    expect(input.attributes('type')).toBe('email')
    expect(input.attributes('autocomplete')).toBe('email')
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('minlength')).toBe('3')
  })

  it('renders a textarea when multiline and keeps the label and errors linked', async () => {
    const wrapper = mount(FormField, {
      props: { label: 'Description', modelValue: 'Lunch', multiline: true, errors: ['Too long'] },
    })
    expect(wrapper.find('input').exists()).toBe(false)
    const textarea = wrapper.get('textarea')
    expect(wrapper.get('label').attributes('for')).toBe(textarea.attributes('id'))
    expect(textarea.attributes('aria-invalid')).toBe('true')
    expect(textarea.attributes('aria-describedby')).toContain(
      wrapper.get('[data-error]').attributes('id') ?? '',
    )
    await textarea.setValue('Lunch with Sam')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Lunch with Sam']])
  })
})
