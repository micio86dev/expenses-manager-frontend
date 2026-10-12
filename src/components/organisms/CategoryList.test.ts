import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, setLocale } from '@/i18n'
import { makeCategory } from '../../../tests/fixtures'
import { expectNoA11yViolations } from '../../../tests/helpers'
import CategoryList from './CategoryList.vue'

const custom = makeCategory({ id: 'c1', name: 'Pets', icon: 'heart' })
const system = makeCategory({ id: 'c2', name: 'Groceries', isSystem: true })
const archived = makeCategory({ id: 'c3', name: 'Old hobby', archived: true })

function render(categories = [custom, system, archived]) {
  return mount(CategoryList, {
    props: { categories },
    attachTo: document.body,
    global: { plugins: [i18n] },
  })
}

describe('CategoryList', () => {
  beforeEach(async () => {
    await setLocale('en')
  })

  it('is a labelled list with one row per category', () => {
    const wrapper = render()
    expect(wrapper.get('ul').attributes('aria-label')).toBe('Your categories')
    expect(wrapper.findAll('li')).toHaveLength(3)
  })

  it('gives custom categories edit, archive and delete controls named after them', () => {
    const row = render().findAll('li')[0]
    expect(row?.findAll('button').map((b) => b.attributes('aria-label'))).toEqual([
      'Edit Pets',
      'Archive Pets',
      'Delete Pets',
    ])
  })

  it('keeps system categories read-only and says so', () => {
    const row = render().findAll('li')[1]
    expect(row?.findAll('button')).toHaveLength(0)
    expect(row?.text()).toContain('Default')
    expect(row?.text()).toContain('Default categories cannot be changed.')
  })

  it('marks archived categories in words and offers to restore them', () => {
    const row = render().findAll('li')[2]
    expect(row?.text()).toContain('Archived')
    expect(row?.findAll('button').map((b) => b.attributes('aria-label'))).toEqual([
      'Edit Old hobby',
      'Restore Old hobby',
      'Delete Old hobby',
    ])
  })

  it('reports which category each action is for', async () => {
    const wrapper = render()
    const buttons = wrapper.findAll('li')[0]?.findAll('button') ?? []
    await buttons[0]?.trigger('click')
    await buttons[1]?.trigger('click')
    await buttons[2]?.trigger('click')
    await wrapper.findAll('li')[2]?.findAll('button')[1]?.trigger('click')
    expect(wrapper.emitted('edit')).toEqual([[custom]])
    expect(wrapper.emitted('archive')).toEqual([[custom]])
    expect(wrapper.emitted('delete')).toEqual([[custom]])
    expect(wrapper.emitted('unarchive')).toEqual([[archived]])
  })

  it('disables the controls of a category the server has not confirmed yet', () => {
    const wrapper = render([makeCategory({ id: 'pending-1', name: 'New one' })])
    expect(wrapper.findAll('button').every((b) => b.attributes('disabled') !== undefined)).toBe(
      true,
    )
    expect(wrapper.get('li').attributes('aria-busy')).toBe('true')
  })

  it('has no axe violations', async () => {
    await expectNoA11yViolations(render().element)
  })
})
