import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RadioTileGroup from './RadioTileGroup.vue'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
]

function render(modelValue = 'a') {
  return mount(RadioTileGroup, {
    props: { legend: 'Pick one', name: 'letters', options, modelValue },
  })
}

describe('RadioTileGroup', () => {
  it('is a fieldset of radios labelled by its legend and option labels', () => {
    const wrapper = render()
    expect(wrapper.get('legend').text()).toBe('Pick one')
    const radios = wrapper.findAll('input[type=radio]')
    expect(radios).toHaveLength(2)
    expect(radios.every((radio) => radio.attributes('name') === 'letters')).toBe(true)
    expect(wrapper.findAll('label').map((label) => label.text())).toEqual(['Alpha', 'Beta'])
  })

  it('checks the selected option and reports a change', async () => {
    const wrapper = render('b')
    expect(wrapper.findAll('input').map((r) => r.element.checked)).toEqual([false, true])
    await wrapper.findAll('input')[0]?.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toEqual([['a']])
  })

  it('shows an error linked to the group', () => {
    const wrapper = mount(RadioTileGroup, {
      props: { legend: 'Pick one', name: 'x', options, modelValue: '', error: 'Pick a colour.' },
    })
    const error = wrapper.get('[data-error]')
    expect(error.text()).toBe('Pick a colour.')
    expect(wrapper.get('fieldset').attributes('aria-describedby')).toBe(error.attributes('id'))
  })
})
