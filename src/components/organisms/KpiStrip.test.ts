import { beforeEach, describe, expect, it } from 'vitest'
import type { KpiView } from '@/domain/dashboard'
import { expectNoA11yViolations, renderWithApp } from '../../../tests/helpers'
import KpiStrip from './KpiStrip.vue'

const kpi: KpiView = {
  currency: 'EUR',
  totalCents: 123_456,
  count: 12,
  dailyAverageCents: 4115,
  days: 30,
  delta: { direction: 'up', percent: 12.5 },
}

async function render(props: Record<string, unknown>) {
  return (
    await renderWithApp(KpiStrip, {
      route: '/',
      token: 'tok',
      props: { status: 'ready', kpi, ...props },
    })
  ).wrapper
}

function figures(wrapper: Awaited<ReturnType<typeof render>>): Record<string, string> {
  const names = wrapper.findAll('dt').map((node) => node.text())
  const values = wrapper.findAll('dd').map((node) => node.text())
  return Object.fromEntries(names.map((name, index) => [name, values[index] ?? '']))
}

describe('KpiStrip', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the total, the change, the daily average and the count', async () => {
    const wrapper = await render({})
    expect(wrapper.get('h2').text()).toBe('Key figures')
    expect(figures(wrapper)).toEqual({
      'Total spent': '€1,234.56',
      Change: '+12.5% vs previous period',
      'Daily average': '€41.15Over 30 days',
      Expenses: '12',
    })
  })

  it.each([
    [{ direction: 'down', percent: 40 }, '-40% vs previous period', 'down'],
    [{ direction: 'flat', percent: 0 }, 'No change vs previous period', 'flat'],
    [{ direction: 'none' }, 'No previous spending', 'none'],
  ] as const)(
    'describes the change %j in words, not only with a colour',
    async (delta, text, tone) => {
      const wrapper = await render({ kpi: { ...kpi, delta } })
      expect(figures(wrapper).Change).toBe(text)
      expect(wrapper.get('[data-delta]').attributes('data-delta')).toBe(tone)
    },
  )

  it('formats the amounts with the currency of the response', async () => {
    const wrapper = await render({ kpi: { ...kpi, currency: 'USD' } })
    expect(figures(wrapper)['Total spent']).toBe('$1,234.56')
  })

  it('shows skeleton tiles while loading', async () => {
    const wrapper = await render({ status: 'loading', kpi: null })
    expect(wrapper.find('dl').exists()).toBe(false)
    expect(wrapper.findAll('[data-skeleton]')).toHaveLength(4)
    expect(wrapper.get('[role=status]').text()).toBe('Loading')
    expect(wrapper.get('section').attributes('aria-busy')).toBe('true')
  })

  it('shows the error with a retry', async () => {
    const wrapper = await render({ status: 'error', kpi: null, errorMessage: 'Nope' })
    expect(wrapper.get('[role=alert]').text()).toContain('Nope')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations((await render({})).element)
  })
})
