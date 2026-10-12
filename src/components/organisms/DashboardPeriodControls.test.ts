import { beforeEach, describe, expect, it } from 'vitest'
import { resolvePeriod } from '@/domain/period'
import { expectNoA11yViolations, renderWithApp } from '../../../tests/helpers'
import DashboardPeriodControls from './DashboardPeriodControls.vue'

const base = {
  period: resolvePeriod('month', '2026-10-12'),
  currency: 'EUR',
  canGoNext: true,
  today: '2026-10-12',
}

async function render(props: Record<string, unknown> = {}) {
  return (
    await renderWithApp(DashboardPeriodControls, {
      route: '/',
      token: 'tok',
      props: { ...base, ...props },
    })
  ).wrapper
}

describe('DashboardPeriodControls', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('names the period and marks the current kind as pressed', async () => {
    const wrapper = await render()
    expect(wrapper.get('[aria-live=polite]').text()).toBe('October 2026')
    const group = wrapper.get('[role=group]')
    expect(group.attributes('aria-label')).toBe('Period')
    const pressed = Object.fromEntries(
      group.findAll('button').map((b) => [b.text(), b.attributes('aria-pressed')]),
    )
    expect(pressed).toEqual({
      Day: 'false',
      Week: 'false',
      Month: 'true',
      'Custom range': 'false',
    })
  })

  it('asks for another kind of period', async () => {
    const wrapper = await render()
    await wrapper.get('[role=group] button:nth-child(2)').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['week']])
  })

  it('asks for the previous and the next period', async () => {
    const wrapper = await render()
    await wrapper.get('button[aria-label="Previous period"]').trigger('click')
    await wrapper.get('button[aria-label="Next period"]').trigger('click')
    expect(wrapper.emitted('shift')).toEqual([[-1], [1]])
  })

  it('does not offer a period after today', async () => {
    const wrapper = await render({ canGoNext: false })
    expect(wrapper.get('button[aria-label="Next period"]').attributes('disabled')).toBeDefined()
  })

  it('opens the custom range and applies it', async () => {
    const wrapper = await render()
    expect(wrapper.find('input[type=date]').exists()).toBe(false)
    await wrapper.get('[role=group] button:nth-child(4)').trigger('click')
    const [from, to] = wrapper.findAll('input[type=date]')
    expect(from?.attributes('max')).toBe('2026-10-12')
    await from?.setValue('2026-09-01')
    await to?.setValue('2026-09-10')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('applyCustom')).toEqual([['2026-09-01', '2026-09-10']])
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('shows the range inputs for a custom period and rejects an invalid range', async () => {
    const wrapper = await render({
      period: { kind: 'custom', from: '2026-09-01', to: '2026-09-10' },
    })
    const [from, to] = wrapper.findAll('input[type=date]')
    expect((from?.element as HTMLInputElement).value).toBe('2026-09-01')
    expect(wrapper.get('[role=group] button:nth-child(4)').attributes('aria-pressed')).toBe('true')
    await from?.setValue('2026-09-20')
    await to?.setValue('2026-09-10')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('applyCustom')).toBeUndefined()
    expect(wrapper.get('[data-error]').text()).toBe(
      'Choose dates up to today, with the start not after the end.',
    )
    await from?.setValue('2026-09-01')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.find('[data-error]').exists()).toBe(false)
    expect(wrapper.emitted('applyCustom')).toEqual([['2026-09-01', '2026-09-10']])
  })

  it('caps the custom end date at today', async () => {
    const wrapper = await render({
      period: { kind: 'custom', from: '2026-10-01', to: '2026-10-31' },
    })
    expect((wrapper.findAll('input[type=date]')[1]?.element as HTMLInputElement).value).toBe(
      '2026-10-12',
    )
  })

  it('changes the currency', async () => {
    const wrapper = await render()
    const select = wrapper.get('select')
    expect(select.element.value).toBe('EUR')
    await select.setValue('USD')
    expect(wrapper.emitted('update:currency')).toEqual([['USD']])
  })

  it('has no axe violations', async () => {
    const wrapper = await render()
    await wrapper.get('[role=group] button:nth-child(4)').trigger('click')
    await expectNoA11yViolations(wrapper.element)
  })
})
