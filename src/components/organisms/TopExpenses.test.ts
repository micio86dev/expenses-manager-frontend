import { beforeEach, describe, expect, it } from 'vitest'
import { makeCategory, makeExpense } from '../../../tests/fixtures'
import { expectNoA11yViolations, renderWithApp } from '../../../tests/helpers'
import TopExpenses from './TopExpenses.vue'

const categories = new Map([['c1', makeCategory({ id: 'c1', name: 'Groceries' })]])
const expenses = [
  makeExpense({ id: 'e1', description: 'Weekly shop', amountCents: 6420, spentOn: '2026-10-10' }),
  makeExpense({ id: 'e2', description: 'Mystery', amountCents: 900, categoryId: 'gone' }),
]

async function render(props: Record<string, unknown> = {}) {
  const { wrapper } = await renderWithApp(TopExpenses, {
    route: '/',
    token: 'tok',
    props: { expenses, categories, ...props },
  })
  return wrapper
}

describe('TopExpenses', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('ranks the expenses in a named ordered list', async () => {
    const wrapper = await render()
    const list = wrapper.get('ol')
    expect(list.attributes('aria-label')).toBe('Your largest expenses in this period')
    const rows = list.findAll('li')
    expect(rows).toHaveLength(2)
    expect(rows[0]?.text()).toContain('Weekly shop')
    expect(rows[0]?.text()).toContain('Groceries')
    expect(rows[0]?.text()).toContain('10 Oct')
    expect(rows[0]?.text()).toContain('€64.20')
  })

  it('falls back to a neutral label for a category that no longer exists', async () => {
    const wrapper = await render()
    expect(wrapper.findAll('li')[1]?.text()).toContain('Unknown category')
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations((await render()).element)
  })
})
