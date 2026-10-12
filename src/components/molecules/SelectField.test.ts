import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SelectField from './SelectField.vue'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

describe('SelectField', () => {
  it('labels the select and lists the options', () => {
    const wrapper = mount(SelectField, { props: { label: 'Letter', modelValue: 'b', options } })
    const select = wrapper.get('select')
    expect(wrapper.get('label').attributes('for')).toBe(select.attributes('id'))
    expect(wrapper.findAll('option').map((o) => o.text())).toEqual(['Alpha', 'Beta'])
    expect(select.element.value).toBe('b')
  })

  it('can offer an empty first choice', () => {
    const wrapper = mount(SelectField, {
      props: { label: 'Letter', modelValue: '', options, placeholder: 'Any' },
    })
    expect(wrapper.findAll('option')[0]?.text()).toBe('Any')
  })

  it('reports the chosen value', async () => {
    const wrapper = mount(SelectField, { props: { label: 'Letter', modelValue: 'a', options } })
    await wrapper.get('select').setValue('b')
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('links its error to the select', () => {
    const wrapper = mount(SelectField, {
      props: { label: 'Letter', modelValue: '', options, errors: ['Pick one.'] },
    })
    const error = wrapper.get('[data-error]')
    expect(error.text()).toBe('Pick one.')
    expect(wrapper.get('select').attributes('aria-describedby')).toBe(error.attributes('id'))
    expect(wrapper.get('select').attributes('aria-invalid')).toBe('true')
  })
})
