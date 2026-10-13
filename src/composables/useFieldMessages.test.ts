import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { FieldMessages } from '@/domain/validation'
import { i18n, setLocale } from '@/i18n'
import { useFieldMessages } from './useFieldMessages'

const Probe = defineComponent({
  setup() {
    const errors = ref<FieldMessages<'name' | 'email'>>({ name: 'auth.errors.nameRequired' })
    const messages = useFieldMessages(errors, () => ({ name: ['Already taken'] }))
    return { messages }
  },
  render: () => h('p'),
})

describe('useFieldMessages', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('puts the translated rule message before the server messages for the field', () => {
    const wrapper = mount(Probe, { global: { plugins: [i18n] } })
    expect(wrapper.vm.messages('name')).toEqual(['Enter your name.', 'Already taken'])
  })

  it('returns only the server messages when the form found no rule for the field', () => {
    const wrapper = mount(Probe, { global: { plugins: [i18n] } })
    expect(wrapper.vm.messages('email')).toEqual([])
  })
})
