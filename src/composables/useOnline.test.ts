import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useOnline } from './useOnline'

function probe() {
  let online: ReturnType<typeof useOnline> | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        const state = useOnline()
        online = state
        return () => h('p', String(state.value))
      },
    }),
  )
  return { wrapper, online: () => online }
}

describe('useOnline', () => {
  it('starts from navigator.onLine and follows the browser events', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { wrapper, online } = probe()
    expect(online()?.value).toBe(false)
    window.dispatchEvent(new Event('online'))
    await wrapper.vm.$nextTick()
    expect(online()?.value).toBe(true)
    window.dispatchEvent(new Event('offline'))
    expect(online()?.value).toBe(false)
  })

  it('stops listening when the component unmounts', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const { wrapper, online } = probe()
    wrapper.unmount()
    window.dispatchEvent(new Event('offline'))
    expect(online()?.value).toBe(true)
  })
})
