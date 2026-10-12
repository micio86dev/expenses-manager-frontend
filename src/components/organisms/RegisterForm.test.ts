import { describe, expect, it } from 'vitest'
import { renderWithApp } from '../../../tests/helpers'
import RegisterForm from './RegisterForm.vue'

describe('RegisterForm', () => {
  it('emits name, email and password on submit', async () => {
    const { wrapper } = await renderWithApp(RegisterForm, {
      props: { submitting: false, errorMessage: null, fieldErrors: {} },
    })
    await wrapper.get('input[autocomplete=name]').setValue('Ada')
    await wrapper.get('input[type=email]').setValue('ada@example.com')
    await wrapper.get('input[type=password]').setValue('password1')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([
      [{ name: 'Ada', email: 'ada@example.com', password: 'password1' }],
    ])
  })

  it('explains the password rule and shows server errors per field', async () => {
    const { wrapper } = await renderWithApp(RegisterForm, {
      props: {
        submitting: false,
        errorMessage: 'The given data was invalid.',
        fieldErrors: { email: ['Already taken'], password: ['Too short'] },
      },
    })
    expect(wrapper.text()).toContain('At least 8 characters.')
    expect(wrapper.text()).toContain('Already taken')
    expect(wrapper.text()).toContain('Too short')
    expect(wrapper.get('[role=alert]').text()).toContain('The given data was invalid.')
  })

  it('shows the name error', async () => {
    const { wrapper } = await renderWithApp(RegisterForm, {
      props: { submitting: false, errorMessage: null, fieldErrors: { name: ['Required'] } },
    })
    expect(wrapper.text()).toContain('Required')
  })
})
