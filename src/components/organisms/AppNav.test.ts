import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations, renderWithApp } from '../../../tests/helpers'
import AppNav from './AppNav.vue'

describe('AppNav', () => {
  it('is a labelled navigation landmark with the four destinations', async () => {
    const { wrapper } = await renderWithApp(AppNav, { route: '/expenses', token: 'tok' })
    const nav = wrapper.get('nav')
    expect(nav.attributes('aria-label')).toBe('Main navigation')
    expect(wrapper.findAll('a').map((a) => a.text())).toEqual([
      'Dashboard',
      'Expenses',
      'Categories',
      'Settings',
    ])
  })

  it('marks the current page, not by colour alone', async () => {
    const { wrapper } = await renderWithApp(AppNav, { route: '/categories', token: 'tok' })
    const current = wrapper.findAll('a[aria-current=page]')
    expect(current).toHaveLength(1)
    expect(current[0]?.text()).toBe('Categories')
  })

  it('has no axe violations', async () => {
    const { wrapper } = await renderWithApp(AppNav, { route: '/', token: 'tok' })
    await expectNoA11yViolations(wrapper.element)
  })

  it('translates labels', async () => {
    const { wrapper } = await renderWithApp(AppNav, { route: '/', token: 'tok', locale: 'it' })
    expect(wrapper.get('nav').attributes('aria-label')).not.toBe('Main navigation')
  })
})
