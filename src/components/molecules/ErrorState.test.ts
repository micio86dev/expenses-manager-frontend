import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import ErrorState from './ErrorState.vue'

describe('ErrorState', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('announces the message and offers a retry', async () => {
    const wrapper = mount(ErrorState, {
      props: { message: 'We could not load your data.' },
      global: { plugins: [i18n] },
    })
    expect(wrapper.get('[role=alert]').text()).toContain('We could not load your data.')
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').text()).toBe('Try again')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
