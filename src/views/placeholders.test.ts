import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import DashboardView from './DashboardView.vue'
import ExpensesView from './ExpensesView.vue'

describe.each([
  ['dashboard', DashboardView, '/', 'Dashboard', 'No data yet'],
  ['expenses', ExpensesView, '/expenses', 'Expenses', 'No expenses recorded'],
])('%s placeholder view', (_name, view, route, heading, emptyTitle) => {
  it('shows the page heading and an empty state', async () => {
    const { wrapper } = await renderWithApp(view, { route, token: 'tok' })
    expect(wrapper.get('h1').text()).toBe(heading)
    expect(wrapper.get('h2').text()).toBe(emptyTitle)
  })

  it('has no axe violations', async () => {
    const { wrapper } = await renderWithApp(view, { route, token: 'tok' })
    await expectNoA11yViolations(wrapper.element)
  })
})
