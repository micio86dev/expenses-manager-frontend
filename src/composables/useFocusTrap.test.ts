import { mount } from '@vue/test-utils'
import { defineComponent, h, useTemplateRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useFocusTrap } from './useFocusTrap'

function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  document.dispatchEvent(event)
  return event
}

function trapComponent(onEscape: () => void, initialFocus?: string, buttons = ['one', 'two']) {
  return defineComponent({
    setup() {
      const panel = useTemplateRef<HTMLElement>('panel')
      useFocusTrap(panel, {
        onEscape,
        ...(initialFocus === undefined ? {} : { initialFocus: () => initialFocus }),
      })
      return () =>
        h(
          'div',
          { ref: 'panel', tabindex: -1, 'data-panel': '' },
          buttons.map((id) => h('button', { id }, id)),
        )
    },
  })
}

describe('useFocusTrap', () => {
  it('focuses the first control, wraps Tab in both directions and closes on Escape', () => {
    const onEscape = vi.fn()
    const wrapper = mount(trapComponent(onEscape), { attachTo: document.body })
    const [one, two] = wrapper.findAll('button').map((b) => b.element)
    expect(document.activeElement).toBe(one)

    two?.focus()
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(one)

    expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(two)

    expect(press('Tab').defaultPrevented).toBe(true)
    one?.focus()
    expect(press('Tab').defaultPrevented).toBe(false)

    press('Escape')
    expect(onEscape).toHaveBeenCalledTimes(1)
    press('a')
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('pulls focus back in when it has escaped the panel', () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const wrapper = mount(trapComponent(vi.fn()), { attachTo: document.body })
    outside.focus()
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('#one').element)
    outside.remove()
  })

  it('can start on a chosen control', () => {
    const wrapper = mount(trapComponent(vi.fn(), '#two'), { attachTo: document.body })
    expect(document.activeElement).toBe(wrapper.get('#two').element)
  })

  it('keeps focus on the panel when it has nothing focusable', () => {
    const wrapper = mount(trapComponent(vi.fn(), undefined, []), { attachTo: document.body })
    expect(document.activeElement).toBe(wrapper.get('[data-panel]').element)
    expect(press('Tab').defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(wrapper.get('[data-panel]').element)
  })

  it('returns focus to the trigger when it closes', () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(
      trapComponent(() => undefined),
      { attachTo: document.body },
    )
    expect(document.activeElement).not.toBe(trigger)
    wrapper.unmount()
    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it('lets only the topmost trap react', () => {
    const outer = vi.fn()
    const inner = vi.fn()
    mount(trapComponent(outer), { attachTo: document.body })
    const innerWrapper = mount(trapComponent(inner), { attachTo: document.body })
    press('Escape')
    expect(inner).toHaveBeenCalledTimes(1)
    expect(outer).not.toHaveBeenCalled()
    innerWrapper.unmount()
    press('Escape')
    expect(outer).toHaveBeenCalledTimes(1)
  })
})
