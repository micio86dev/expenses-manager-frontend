import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseInput from './BaseInput.vue'

describe('BaseInput', () => {
  it('reflects the model value and emits updates', async () => {
    const wrapper = mount(BaseInput, { props: { id: 'email', modelValue: 'a@b.c' } })
    const input = wrapper.get('input')
    expect(input.element.value).toBe('a@b.c')
    await input.setValue('x@y.z')
    expect(wrapper.emitted('update:modelValue')).toEqual([['x@y.z']])
  })

  it('forwards native attributes and accessibility state', () => {
    const wrapper = mount(BaseInput, {
      props: {
        id: 'pw',
        modelValue: '',
        type: 'password',
        autocomplete: 'current-password',
        required: true,
        minlength: 8,
        invalid: true,
        describedby: 'pw-error',
      },
    })
    const input = wrapper.get('input')
    expect(input.attributes('id')).toBe('pw')
    expect(input.attributes('type')).toBe('password')
    expect(input.attributes('autocomplete')).toBe('current-password')
    expect(input.attributes('required')).toBeDefined()
    expect(input.attributes('minlength')).toBe('8')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe('pw-error')
  })

  it('defaults to a valid text input', () => {
    const input = mount(BaseInput, { props: { id: 'n', modelValue: '' } }).get('input')
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('aria-invalid')).toBeUndefined()
  })
})
