import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ErrorAlert from './ErrorAlert.vue'

describe('ErrorAlert', () => {
  it('announces the message as an alert', () => {
    const wrapper = mount(ErrorAlert, { props: { message: 'Invalid credentials' } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.text()).toContain('Invalid credentials')
  })
})
