import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { validateRegisterForm } from '@/domain/auth-form'
import { i18n, setLocale } from '@/i18n'
import { useValidatedForm } from './useValidatedForm'

const Probe = defineComponent({
  setup() {
    return useValidatedForm(validateRegisterForm, () => undefined)
  },
  render: () => h('p'),
})

describe('useValidatedForm', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('returns null and shows the rule messages when the input is invalid', () => {
    const wrapper = mount(Probe, { global: { plugins: [i18n] } })
    const payload = wrapper.vm.validated({ name: '', email: 'ada@example.com', password: 'short' })
    expect(payload).toBeNull()
    expect(wrapper.vm.messages('name')).toEqual(['Enter your name.'])
    expect(wrapper.vm.messages('password')).toEqual(['Use at least 8 characters.'])
  })

  it('returns the payload and clears the messages when the input is valid', () => {
    const wrapper = mount(Probe, { global: { plugins: [i18n] } })
    wrapper.vm.validated({ name: '', email: 'ada@example.com', password: 'short' })
    const payload = wrapper.vm.validated({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password1',
    })
    expect(payload).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'password1' })
    expect(wrapper.vm.messages('name')).toEqual([])
  })
})
