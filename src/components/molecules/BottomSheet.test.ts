import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { expectNoA11yViolations } from '../../../tests/helpers'
import BottomSheet from './BottomSheet.vue'

function render(props: Record<string, unknown> = {}) {
  return mount(BottomSheet, {
    props: { title: 'New category', ...props },
    slots: { default: '<label>Name <input id="name" /></label><button>Save</button>' },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('BottomSheet', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('is a labelled modal dialog', () => {
    const wrapper = render()
    const dialog = wrapper.get('[role=dialog]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    const heading = wrapper.get('h2')
    expect(heading.text()).toBe('New category')
    expect(dialog.attributes('aria-labelledby')).toBe(heading.attributes('id'))
  })

  it('can be an alert dialog described by another element', () => {
    const wrapper = render({ role: 'alertdialog', describedby: 'why' })
    const dialog = wrapper.get('[role=alertdialog]')
    expect(dialog.attributes('aria-describedby')).toBe('why')
  })

  it('moves focus to the first field and closes with the close button', async () => {
    const wrapper = render()
    expect(document.activeElement).toBe(wrapper.get('#name').element)
    await wrapper.get('button[aria-label="Close"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes with Escape and with a tap on the backdrop', async () => {
    const wrapper = render()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toHaveLength(1)
    await wrapper.get('.sheet__backdrop').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(2)
  })

  it('honours a custom initial focus target', () => {
    const wrapper = render({ initialFocus: 'button:not([aria-label])' })
    expect(document.activeElement).toBe(wrapper.get('.sheet__body button').element)
  })

  it('has no axe violations', async () => {
    const wrapper = render()
    await expectNoA11yViolations(wrapper.element)
  })
})
