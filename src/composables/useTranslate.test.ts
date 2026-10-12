import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import italian from '@/i18n/locales/it'
import { i18n, setLocale } from '@/i18n'
import { useTranslate } from './useTranslate'

const Probe = defineComponent({
  props: { named: { type: Boolean, default: false } },
  setup(props) {
    const translate = useTranslate()
    return () =>
      h(
        'p',
        props.named
          ? translate('categories.actions.edit', { name: 'Pets' })
          : translate('nav.dashboard'),
      )
  },
})

describe('useTranslate', () => {
  beforeEach(async () => {
    await setLocale('it')
  })

  it('translates typed keys and reacts to locale changes', async () => {
    const wrapper = mount(Probe, { global: { plugins: [i18n] } })
    expect(wrapper.text()).toBe(italian.nav.dashboard)
    await setLocale('en')
    expect(wrapper.text()).toBe('Dashboard')
  })

  it('interpolates named parameters', async () => {
    await setLocale('en')
    const wrapper = mount(Probe, { props: { named: true }, global: { plugins: [i18n] } })
    expect(wrapper.text()).toBe('Edit Pets')
  })
})
