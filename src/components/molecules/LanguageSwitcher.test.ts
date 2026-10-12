import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LanguageSwitcher from './LanguageSwitcher.vue'

const options = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
] as const

describe('LanguageSwitcher', () => {
  it('lists every language with the current one selected', () => {
    const wrapper = mount(LanguageSwitcher, {
      props: { label: 'Language', modelValue: 'en', options },
    })
    const select = wrapper.get('select')
    expect(select.element.value).toBe('en')
    expect(wrapper.findAll('option').map((o) => o.text())).toEqual(['Italiano', 'English'])
    expect(wrapper.get('label').text()).toBe('Language')
    expect(wrapper.get('label').attributes('for')).toBe(select.attributes('id'))
  })

  it('emits the chosen language code', async () => {
    const wrapper = mount(LanguageSwitcher, {
      props: { label: 'Language', modelValue: 'en', options },
    })
    await wrapper.get('select').setValue('it')
    expect(wrapper.emitted('update:modelValue')).toEqual([['it']])
  })
})
