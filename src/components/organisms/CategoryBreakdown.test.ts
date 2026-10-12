import type { ChartData } from 'chart.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chartStub } from '../../../tests/chart-stubs'
import { expectNoA11yViolations, renderWithApp } from '../../../tests/helpers'
import CategoryBreakdown from './CategoryBreakdown.vue'

vi.mock('vue-chartjs', () => ({ Doughnut: chartStub('Doughnut') }))

const items = [
  { categoryId: 'a', name: 'Rent', totalCents: 70_000, count: 1, percent: 70, color: '#0B6B72' },
  { categoryId: 'b', name: 'Food', totalCents: 30_000, count: 9, percent: 30, color: '#A32A3A' },
]

async function render(props: Record<string, unknown> = {}) {
  const { wrapper } = await renderWithApp(CategoryBreakdown, {
    route: '/',
    token: 'tok',
    props: { items, currency: 'EUR', ...props },
  })
  return wrapper
}

describe('CategoryBreakdown', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('feeds the doughnut with the amounts and the category colours', async () => {
    const wrapper = await render()
    const data = wrapper.getComponent({ name: 'Doughnut' }).props('data') as ChartData<'doughnut'>
    expect(data.labels).toEqual(['Rent', 'Food'])
    expect(data.datasets[0]?.data).toEqual([70_000, 30_000])
    expect(data.datasets[0]?.backgroundColor).toEqual(['#0B6B72', '#A32A3A'])
  })

  it('ranks the categories with name, amount and share, so colour is not the only signal', async () => {
    const wrapper = await render()
    const list = wrapper.get('ol')
    expect(list.attributes('aria-label')).toBe('Categories ranked by spending')
    expect(list.findAll('li').map((li) => li.text())).toEqual(['Rent€700.0070%', 'Food€300.0030%'])
  })

  it('describes the chart in words', async () => {
    const wrapper = await render()
    expect(wrapper.get('[role=img]').attributes('aria-label')).toBe(
      'Spending by category: Rent is the largest with 70% of €1,000.00.',
    )
  })

  it('says so when there are no categories', async () => {
    const wrapper = await render({ items: [] })
    expect(wrapper.get('[role=img]').attributes('aria-label')).toBe(
      'Spending by category: nothing was spent in this period.',
    )
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations((await render()).element)
  })
})
