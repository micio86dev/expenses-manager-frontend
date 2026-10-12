import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { useNoticesStore } from '@/stores/notices'
import { categoriesApi } from '../../tests/api-mock'
import { deferred } from '../../tests/deferred'
import { makeCategory } from '../../tests/fixtures'
import { expectNoA11yViolations, renderWithApp } from '../../tests/helpers'
import CategoriesView from './CategoriesView.vue'

vi.mock('@/api', async () => (await import('../../tests/api-mock')).apiMock)

const pets = makeCategory({ id: 'c1', name: 'Pets', icon: 'heart' })
const groceries = makeCategory({ id: 'c2', name: 'Groceries', isSystem: true })
const old = makeCategory({ id: 'c3', name: 'Old hobby', archived: true })

async function render() {
  const result = await renderWithApp(CategoriesView, { route: '/categories', token: 'tok' })
  await flushPromises()
  return result
}

function rowNames(wrapper: Awaited<ReturnType<typeof render>>['wrapper']): string[] {
  return wrapper.findAll('.category-badge__name').map((n) => n.text())
}

describe('CategoriesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    categoriesApi.list.mockResolvedValue([groceries, old, pets])
  })

  it('shows a skeleton while loading, then the list without archived categories', async () => {
    const pending = deferred<never[]>()
    categoriesApi.list.mockReturnValue(pending.promise)
    const { wrapper } = await renderWithApp(CategoriesView, { route: '/categories', token: 'tok' })
    expect(wrapper.find('.skeleton').exists()).toBe(true)
    expect(wrapper.get('[aria-busy=true]').text()).toContain('Loading')
    pending.resolve([])
    await flushPromises()
    expect(wrapper.find('.skeleton').exists()).toBe(false)
  })

  it('lists categories by name and hides archived ones by default', async () => {
    const { wrapper } = await render()
    expect(wrapper.get('h1').text()).toBe('Categories')
    expect(rowNames(wrapper)).toEqual(['Groceries', 'Pets'])
  })

  it('reveals archived categories with the toggle', async () => {
    const { wrapper } = await render()
    await wrapper.get('input[type=checkbox]').setValue(true)
    expect(rowNames(wrapper)).toEqual(['Groceries', 'Old hobby', 'Pets'])
  })

  it('invites you to add the first category', async () => {
    categoriesApi.list.mockResolvedValue([])
    const { wrapper } = await render()
    expect(wrapper.get('h2').text()).toBe('No categories')
    await wrapper.get('.empty-state button').trigger('click')
    expect(wrapper.find('[role=dialog]').exists()).toBe(true)
  })

  it('shows an error with a retry when loading fails', async () => {
    categoriesApi.list.mockRejectedValueOnce(
      new ApiError({ kind: 'problem', status: 500, title: 'Server error' }),
    )
    const { wrapper } = await render()
    expect(wrapper.get('[role=alert]').text()).toContain('We could not load your data.')
    await wrapper.get('.error-state button').trigger('click')
    await flushPromises()
    expect(rowNames(wrapper)).toEqual(['Groceries', 'Pets'])
  })

  it('explains that the device is offline when the network fails', async () => {
    categoriesApi.list.mockRejectedValueOnce(ApiError.network())
    const { wrapper } = await render()
    expect(wrapper.get('[role=alert]').text()).toContain('You are offline')
  })

  it('warns while the browser reports being offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { wrapper } = await render()
    expect(wrapper.get('[role=status]').text()).toContain('You are offline')
  })

  it('creates a category from the sheet and closes it', async () => {
    categoriesApi.create.mockResolvedValue(makeCategory({ id: 'c9', name: 'Gym', icon: 'tag' }))
    const { wrapper } = await render()
    const trigger = wrapper.get('button[data-add]')
    await trigger.trigger('click')
    expect(wrapper.get('[role=dialog] h2').text()).toBe('New category')
    await wrapper.get('[role=dialog] input[type=text]').setValue('Gym')
    await wrapper.get('[role=dialog] form').trigger('submit')
    await flushPromises()
    expect(categoriesApi.create).toHaveBeenCalledWith({
      name: 'Gym',
      color: '#0B6B72',
      icon: 'tag',
    })
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(rowNames(wrapper)).toContain('Gym')
  })

  it('reopens the sheet with the draft and the server message when validation fails', async () => {
    categoriesApi.create.mockRejectedValue(
      new ApiError({
        kind: 'problem',
        status: 422,
        title: 'Invalid',
        fieldErrors: { name: ['The name has already been taken.'] },
      }),
    )
    const { wrapper } = await render()
    await wrapper.get('button[data-add]').trigger('click')
    await wrapper.get('[role=dialog] input[type=text]').setValue('Pets')
    await wrapper.get('[role=dialog] form').trigger('submit')
    await flushPromises()
    expect(wrapper.get<HTMLInputElement>('[role=dialog] input[type=text]').element.value).toBe(
      'Pets',
    )
    expect(wrapper.get('[role=dialog] [data-error]').text()).toContain('already been taken')
    expect(rowNames(wrapper)).not.toContain('Pets Pets')
  })

  it('edits a category in the sheet', async () => {
    categoriesApi.update.mockResolvedValue({ ...pets, name: 'Cats' })
    const { wrapper } = await render()
    await wrapper.get('button[aria-label="Edit Pets"]').trigger('click')
    expect(wrapper.get('[role=dialog] h2').text()).toBe('Edit category')
    await wrapper.get('[role=dialog] input[type=text]').setValue('Cats')
    await wrapper.get('[role=dialog] form').trigger('submit')
    await flushPromises()
    expect(categoriesApi.update).toHaveBeenCalledWith('c1', {
      name: 'Cats',
      color: '#0B6B72',
      icon: 'heart',
    })
    expect(rowNames(wrapper)).toContain('Cats')
  })

  it('closes the sheet without saving', async () => {
    const { wrapper } = await render()
    await wrapper.get('button[data-add]').trigger('click')
    await wrapper.get('[role=dialog] button[data-cancel]').trigger('click')
    expect(wrapper.find('[role=dialog]').exists()).toBe(false)
    expect(categoriesApi.create).not.toHaveBeenCalled()
  })

  it('archives and restores', async () => {
    categoriesApi.archive.mockResolvedValue({ ...pets, archived: true })
    categoriesApi.unarchive.mockResolvedValue(pets)
    const { wrapper } = await render()
    await wrapper.get('button[aria-label="Archive Pets"]').trigger('click')
    await flushPromises()
    expect(categoriesApi.archive).toHaveBeenCalledWith('c1')
    expect(rowNames(wrapper)).toEqual(['Groceries'])
    await wrapper.get('input[type=checkbox]').setValue(true)
    await wrapper.get('button[aria-label="Restore Pets"]').trigger('click')
    await flushPromises()
    expect(categoriesApi.unarchive).toHaveBeenCalledWith('c1')
  })

  it('asks before deleting and deletes on confirmation', async () => {
    categoriesApi.remove.mockResolvedValue(undefined)
    const { wrapper } = await render()
    await wrapper.get('button[aria-label="Delete Pets"]').trigger('click')
    const dialog = wrapper.get('[role=alertdialog]')
    expect(dialog.text()).toContain('Pets')
    expect(categoriesApi.remove).not.toHaveBeenCalled()
    await dialog.get('button[data-confirm]').trigger('click')
    await flushPromises()
    expect(categoriesApi.remove).toHaveBeenCalledWith('c1')
    expect(wrapper.find('[role=alertdialog]').exists()).toBe(false)
    expect(rowNames(wrapper)).toEqual(['Groceries'])
  })

  it('keeps the category when the deletion is cancelled', async () => {
    const { wrapper } = await render()
    await wrapper.get('button[aria-label="Delete Pets"]').trigger('click')
    await wrapper.get('[role=alertdialog] button[data-cancel]').trigger('click')
    expect(wrapper.find('[role=alertdialog]').exists()).toBe(false)
    expect(categoriesApi.remove).not.toHaveBeenCalled()
  })

  it('puts the category back and suggests archiving when it is in use', async () => {
    categoriesApi.remove.mockRejectedValue(
      new ApiError({ kind: 'problem', status: 409, title: 'Conflict' }),
    )
    const { wrapper } = await render()
    await wrapper.get('button[aria-label="Delete Pets"]').trigger('click')
    await wrapper.get('[role=alertdialog] button[data-confirm]').trigger('click')
    await flushPromises()
    expect(rowNames(wrapper)).toEqual(['Groceries', 'Pets'])
    expect(useNoticesStore().items[0]?.message).toContain('Archive it instead')
  })

  it('has no axe violations in any state', async () => {
    const { wrapper } = await render()
    await expectNoA11yViolations(wrapper.element)
    await wrapper.get('button[data-add]').trigger('click')
    await expectNoA11yViolations(wrapper.element)
    await wrapper.get('[role=dialog] button[data-cancel]').trigger('click')
    await wrapper.get('button[aria-label="Delete Pets"]').trigger('click')
    await expectNoA11yViolations(wrapper.element)
  })
})
