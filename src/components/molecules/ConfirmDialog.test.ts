import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { expectNoA11yViolations } from '../../../tests/helpers'
import ConfirmDialog from './ConfirmDialog.vue'

function render() {
  return mount(ConfirmDialog, {
    props: {
      title: 'Delete this category?',
      message: 'You are about to delete “Pets”.',
      confirmLabel: 'Delete category',
    },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('ConfirmDialog', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('is an alert dialog described by its message', () => {
    const wrapper = render()
    const dialog = wrapper.get('[role=alertdialog]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    const message = wrapper.get('p')
    expect(dialog.attributes('aria-describedby')).toBe(message.attributes('id'))
    expect(message.text()).toContain('Pets')
  })

  it('starts on the safe choice', () => {
    const wrapper = render()
    expect(document.activeElement).toBe(wrapper.get('button[data-cancel]').element)
  })

  it('confirms and cancels', async () => {
    const wrapper = render()
    await wrapper.get('button[data-confirm]').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    await wrapper.get('button[data-cancel]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('cancels on Escape and on the close button', async () => {
    const wrapper = render()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('cancel')).toHaveLength(1)
    await wrapper.get('button[aria-label="Close"]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(2)
  })

  it('has no axe violations', async () => {
    const wrapper = render()
    await expectNoA11yViolations(wrapper.element)
  })
})
