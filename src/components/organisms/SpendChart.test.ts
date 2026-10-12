import type { ChartData, ChartOptions } from 'chart.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callWith, chartStub } from '../../../tests/chart-stubs'
import { expectNoA11yViolations, renderWithApp } from '../../../tests/helpers'
import SpendChart from './SpendChart.vue'

vi.mock('vue-chartjs', () => ({ Bar: chartStub('Bar') }))

const points = [
  { start: '2026-10-10', totalCents: 0 },
  { start: '2026-10-11', totalCents: 500 },
  { start: '2026-10-12', totalCents: 70 },
]

async function render(props: Record<string, unknown> = {}) {
  const { wrapper } = await renderWithApp(SpendChart, {
    route: '/',
    token: 'tok',
    props: { points, granularity: 'day', currency: 'EUR', ...props },
  })
  return wrapper
}

describe('SpendChart', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('draws one bar per bucket with the amount in cents', async () => {
    const wrapper = await render()
    const bar = wrapper.getComponent({ name: 'Bar' })
    const data = bar.props('data') as ChartData<'bar'>
    expect(data.labels).toEqual(['10 Oct', '11 Oct', '12 Oct'])
    expect(data.datasets[0]?.data).toEqual([0, 500, 70])
  })

  it('formats ticks and tooltips with the currency', async () => {
    const wrapper = await render()
    const options = wrapper.getComponent({ name: 'Bar' }).props('options') as ChartOptions<'bar'>
    expect(callWith(options.plugins?.tooltip?.callbacks?.label, { parsed: { y: 500 } })).toBe(
      '€5.00',
    )
    expect(callWith(options.scales?.y?.ticks?.callback, 1250)).toBe('€12.50')
  })

  it('animates by default and not for people who prefer reduced motion', async () => {
    const options = async () =>
      (await render()).getComponent({ name: 'Bar' }).props('options') as ChartOptions<'bar'>
    expect((await options()).animation).toBeUndefined()
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    try {
      expect((await options()).animation).toBe(false)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('describes the chart in words and keeps it out of the way of screen readers', async () => {
    const wrapper = await render()
    const figure = wrapper.get('[role=img]')
    expect(figure.attributes('aria-label')).toBe(
      'Spending over time: €5.70 in total, highest €5.00 on 11 Oct.',
    )
  })

  it('offers the same numbers as a table for assistive technology', async () => {
    const wrapper = await render()
    const table = wrapper.get('table')
    expect(table.get('caption').text()).toBe('Spending over time')
    expect(table.findAll('th[scope=col]').map((th) => th.text())).toEqual(['Day', 'Amount'])
    expect(table.findAll('tbody tr').map((tr) => tr.text())).toEqual([
      '10 Oct€0.00',
      '11 Oct€5.00',
      '12 Oct€0.70',
    ])
  })

  it('names the bucket column after the granularity', async () => {
    const week = await render({ granularity: 'week' })
    expect(week.findAll('th[scope=col]')[0]?.text()).toBe('Week starting')
    const month = await render({ granularity: 'month' })
    expect(month.findAll('th[scope=col]')[0]?.text()).toBe('Month')
  })

  it('says so when nothing was spent', async () => {
    const wrapper = await render({ points: [{ start: '2026-10-10', totalCents: 0 }] })
    expect(wrapper.get('[role=img]').attributes('aria-label')).toBe(
      'Spending over time: nothing was spent in this period.',
    )
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations((await render()).element)
  })
})
