import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { resolvePeriod } from '@/domain/period'
import { i18n, setLocale } from '@/i18n'
import { makeCategory } from '../../../tests/fixtures'
import { expectNoA11yViolations } from '../../../tests/helpers'
import ExpenseFilterForm from './ExpenseFilterForm.vue'

const categories = [
  makeCategory({ id: 'c1', name: 'Groceries' }),
  makeCategory({ id: 'c2', name: 'Old hobby', archived: true }),
]

function render(props: Record<string, unknown> = {}) {
  return mount(ExpenseFilterForm, {
    props: {
      period: resolvePeriod('month', '2026-10-12'),
      categoryId: null,
      categories,
      today: '2026-10-12',
      ...props,
    },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('ExpenseFilterForm', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('offers the four period kinds with the current one selected', () => {
    const wrapper = render()
    expect(wrapper.get('legend').text()).toBe('Period')
    const labels = wrapper.findAll('fieldset label').map((l) => l.text())
    expect(labels).toEqual(['Day', 'Week', 'Month', 'Custom range'])
    expect(wrapper.get<HTMLInputElement>('input[value=month]').element.checked).toBe(true)
  })

  it('lists every category, marking archived ones, and preselects the active filter', () => {
    const wrapper = render({ categoryId: 'c1' })
    const options = wrapper.findAll('option').map((o) => o.text())
    expect(options).toEqual(['All categories', 'Groceries', 'Old hobby (archived)'])
    expect(wrapper.get<HTMLSelectElement>('select').element.value).toBe('c1')
  })

  it('applies a standard period with the chosen category', async () => {
    const wrapper = render()
    await wrapper.get('input[value=week]').setValue(true)
    await wrapper.get('select').setValue('c1')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('apply')).toEqual([[{ kind: 'week', categoryId: 'c1' }]])
  })

  it('shows the date fields only for a custom range', async () => {
    const wrapper = render()
    expect(wrapper.find('input[type=date]').exists()).toBe(false)
    await wrapper.get('input[value=custom]').setValue(true)
    const dates = wrapper.findAll<HTMLInputElement>('input[type=date]')
    expect(dates).toHaveLength(2)
    expect(dates.every((d) => d.attributes('max') === '2026-10-12')).toBe(true)
  })

  it('applies a valid custom range', async () => {
    const wrapper = render()
    await wrapper.get('input[value=custom]').setValue(true)
    const [from, to] = wrapper.findAll('input[type=date]')
    await from?.setValue('2026-09-01')
    await to?.setValue('2026-09-10')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('apply')).toEqual([
      [{ kind: 'custom', from: '2026-09-01', to: '2026-09-10', categoryId: null }],
    ])
  })

  it('refuses an inverted or future range and says why', async () => {
    const wrapper = render()
    await wrapper.get('input[value=custom]').setValue(true)
    const [from, to] = wrapper.findAll('input[type=date]')
    await from?.setValue('2026-09-10')
    await to?.setValue('2026-09-01')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('apply')).toBeUndefined()
    expect(wrapper.get('[data-error]').text()).toContain('Choose dates up to today')
    await to?.setValue('2026-10-20')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('apply')).toBeUndefined()
  })

  it('starts the custom range from the current custom period', () => {
    const wrapper = render({ period: { kind: 'custom', from: '2026-09-01', to: '2026-09-09' } })
    const dates = wrapper.findAll<HTMLInputElement>('input[type=date]')
    expect(dates.map((d) => d.element.value)).toEqual(['2026-09-01', '2026-09-09'])
  })

  it('cancels', async () => {
    const wrapper = render()
    await wrapper.get('button[data-cancel]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('has no axe violations', async () => {
    const wrapper = render()
    await wrapper.get('input[value=custom]').setValue(true)
    await expectNoA11yViolations(wrapper.element)
  })
})
