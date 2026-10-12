import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/domain/categories'
import { i18n, setLocale } from '@/i18n'
import { expectNoA11yViolations } from '../../../tests/helpers'
import CategoryForm from './CategoryForm.vue'

function render(props: Record<string, unknown> = {}) {
  return mount(CategoryForm, {
    props: { initial: null, ...props },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('CategoryForm', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('offers a name, the colour palette and every icon, with sensible defaults', () => {
    const wrapper = render()
    expect(wrapper.get('label[for]').text()).toBe('Name')
    const [colour, icon] = wrapper.findAll('fieldset')
    expect(colour?.get('legend').text()).toBe('Colour')
    expect(colour?.findAll('input')).toHaveLength(CATEGORY_COLORS.length)
    expect(icon?.get('legend').text()).toBe('Icon')
    expect(icon?.findAll('input')).toHaveLength(CATEGORY_ICONS.length)
    expect(colour?.findAll('input').filter((i) => i.element.checked)).toHaveLength(1)
    expect(icon?.findAll('input').filter((i) => i.element.checked)).toHaveLength(1)
  })

  it('names colours and icons for assistive technology', () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('Ocean')
    expect(wrapper.text()).toContain('Shopping cart')
  })

  it('emits the trimmed values on submit', async () => {
    const wrapper = render()
    await wrapper.get('input[type=text]').setValue('  Pets ')
    await wrapper.get('input[value="#A32A3A"]').setValue(true)
    await wrapper.get('input[value="heart"]').setValue(true)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([[{ name: 'Pets', color: '#A32A3A', icon: 'heart' }]])
  })

  it('does not submit an empty name and explains why', async () => {
    const wrapper = render()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.get('[data-error]').text()).toBe('Enter a name.')
    expect(wrapper.get('input[type=text]').attributes('aria-invalid')).toBe('true')
  })

  it('starts from an existing category', () => {
    const wrapper = render({ initial: { name: 'Pets', color: '#6B3A7A', icon: 'heart' } })
    expect(wrapper.get<HTMLInputElement>('input[type=text]').element.value).toBe('Pets')
    expect(wrapper.get<HTMLInputElement>('input[value="#6B3A7A"]').element.checked).toBe(true)
    expect(wrapper.get<HTMLInputElement>('input[value="heart"]').element.checked).toBe(true)
  })

  it('asks for a colour when the stored one is outside the palette', async () => {
    const wrapper = render({ initial: { name: 'Old', color: '#123456', icon: 'tag' } })
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Pick a colour.')
  })

  it('shows what the server rejected', () => {
    const wrapper = render({ serverErrors: { name: ['The name has already been taken.'] } })
    expect(wrapper.get('[data-error]').text()).toBe('The name has already been taken.')
  })

  it('cancels', async () => {
    const wrapper = render()
    await wrapper.get('button[data-cancel]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('has no axe violations, with and without errors', async () => {
    const wrapper = render()
    await expectNoA11yViolations(wrapper.element)
    await wrapper.get('form').trigger('submit')
    await expectNoA11yViolations(wrapper.element)
  })
})
