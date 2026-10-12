import { describe, expect, it } from 'vitest'
import { renderWithApp } from '../../../tests/helpers'
import SkipLink from './SkipLink.vue'

describe('SkipLink', () => {
  it('points at the main region with translated text', async () => {
    const { wrapper } = await renderWithApp(SkipLink, { locale: 'en' })
    expect(wrapper.attributes('href')).toBe('#main')
    expect(wrapper.text()).toBe('Skip to content')
    expect(wrapper.classes()).toContain('skip-link')
  })
})
