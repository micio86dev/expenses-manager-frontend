import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import OfflineNotice from './OfflineNotice.vue'

describe('OfflineNotice', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('tells the person politely that they are offline', () => {
    const wrapper = mount(OfflineNotice, { global: { plugins: [i18n] } })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.text()).toContain('You are offline')
  })
})
