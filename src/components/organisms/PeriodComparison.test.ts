import type { ChartData } from 'chart.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chartStub } from '../../../tests/chart-stubs'
import { expectNoA11yViolations, renderWithApp } from '../../../tests/helpers'
import PeriodComparison from './PeriodComparison.vue'

vi.mock('vue-chartjs', () => ({ Line: chartStub('Line') }))

const points = [
  {
    index: 0,
    currentStart: '2026-10-12',
    previousStart: '2026-10-05',
    current: 400,
    previous: 100,
  },
  {
    index: 1,
    currentStart: '2026-10-13',
    previousStart: '2026-10-06',
    current: 200,
    previous: 500,
  },
  { index: 2, currentStart: null, previousStart: '2026-10-07', current: null, previous: 0 },
]

async function render(props: Record<string, unknown> = {}) {
  const { wrapper } = await renderWithApp(PeriodComparison, {
    route: '/',
    token: 'tok',
    props: { points, granularity: 'day', currency: 'EUR', ...props },
  })
  return wrapper
}

describe('PeriodComparison', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('draws both periods aligned by bucket, leaving a gap where one is shorter', async () => {
    const wrapper = await render()
    const data = wrapper.getComponent({ name: 'Line' }).props('data') as ChartData<'line'>
    expect(data.labels).toEqual(['12 Oct', '13 Oct', '7 Oct'])
    expect(data.datasets.map((set) => set.label)).toEqual(['This period', 'Previous period'])
    expect(data.datasets[0]?.data).toEqual([400, 200, null])
    expect(data.datasets[1]?.data).toEqual([100, 500, 0])
  })

  it('tells the two lines apart by their dash pattern, not only by colour', async () => {
    const wrapper = await render()
    const data = wrapper.getComponent({ name: 'Line' }).props('data') as ChartData<'line'>
    const [current, previous] = data.datasets
    expect(current).not.toHaveProperty('borderDash')
    expect(previous).toHaveProperty('borderDash')
  })

  it('describes the chart in words', async () => {
    const wrapper = await render()
    expect(wrapper.get('[role=img]').attributes('aria-label')).toBe(
      'Compared with the previous period: €6.00 now against €6.00 before.',
    )
  })

  it('offers the numbers as a table', async () => {
    const wrapper = await render()
    const table = wrapper.get('table')
    expect(table.get('caption').text()).toBe('Compared with the previous period')
    expect(table.findAll('th[scope=col]').map((th) => th.text())).toEqual([
      'Day',
      'This period',
      'Previous period',
    ])
    expect(table.findAll('tbody tr').map((tr) => tr.text())).toEqual([
      '12 Oct€4.00€1.00',
      '13 Oct€2.00€5.00',
      '7 Oct—€0.00',
    ])
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations((await render()).element)
  })
})
