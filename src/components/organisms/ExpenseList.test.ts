import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { expectNoA11yViolations } from '../../../tests/helpers'
import type { ExpenseGroupView } from '@/composables/useExpenseGroups'
import ExpenseList from './ExpenseList.vue'

const groups: ExpenseGroupView[] = [
  {
    date: '2026-10-12',
    label: 'Monday 12 October',
    totalLabel: '€15.00',
    rows: [
      {
        id: 'e1',
        description: 'Lunch',
        amountLabel: '€12.50',
        category: { name: 'Groceries', color: '#0B6B72', icon: 'cart' },
        pending: false,
      },
      {
        id: 'pending-1',
        description: 'Coffee',
        amountLabel: '€2.50',
        category: { name: 'Coffee', color: '#8A5A00', icon: 'coffee' },
        pending: true,
      },
    ],
  },
  {
    date: '2026-10-10',
    label: 'Saturday 10 October',
    totalLabel: '€9.00',
    rows: [
      {
        id: 'e2',
        description: 'Taxi',
        amountLabel: '€9.00',
        category: { name: 'Travel', color: '#3D4F9E', icon: 'plane' },
        pending: false,
      },
    ],
  },
]

function render() {
  return mount(ExpenseList, {
    props: { groups },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('ExpenseList', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('renders one labelled section per day with its total', () => {
    const wrapper = render()
    const sections = wrapper.findAll('section')
    expect(sections).toHaveLength(2)
    const heading = sections[0]?.get('h2')
    expect(heading?.text()).toContain('Monday 12 October')
    expect(heading?.text()).toContain('Day total')
    expect(heading?.text()).toContain('€15.00')
    expect(sections[0]?.attributes('aria-labelledby')).toBe(heading?.attributes('id'))
  })

  it('lists each expense with its category and amount as semantic list items', () => {
    const wrapper = render()
    const rows = wrapper.findAll('li')
    expect(rows).toHaveLength(3)
    expect(rows[0]?.text()).toContain('Lunch')
    expect(rows[0]?.text()).toContain('Groceries')
    expect(rows[0]?.text()).toContain('€12.50')
    expect(wrapper.findAll('ul')).toHaveLength(2)
  })

  it('selects an expense to edit', async () => {
    const wrapper = render()
    await wrapper.get('li button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['e1']])
  })

  it('does not let an unconfirmed expense be opened', () => {
    const wrapper = render()
    const pending = wrapper.findAll('li')[1]
    expect(pending?.get('button').attributes('disabled')).toBeDefined()
    expect(pending?.attributes('aria-busy')).toBe('true')
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations(render().element)
  })
})
