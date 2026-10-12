import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SkeletonList from './SkeletonList.vue'

describe('SkeletonList', () => {
  it('renders placeholder rows that are hidden from assistive technology', () => {
    const wrapper = mount(SkeletonList, { props: { rows: 3 } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('li')).toHaveLength(3)
  })

  it('defaults to four rows', () => {
    expect(mount(SkeletonList).findAll('li')).toHaveLength(4)
  })
})
