import { flushPromises } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { renderWithApp } from '../../../tests/helpers'
import LoginForm from './LoginForm.vue'

describe('LoginForm', () => {
  it('emits the credentials on submit', async () => {
    const { wrapper } = await renderWithApp(LoginForm, {
      props: { submitting: false, errorMessage: null, fieldErrors: {} },
    })
    await wrapper.get('input[type=email]').setValue('ada@example.com')
    await wrapper.get('input[type=password]').setValue('secret-pw')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('submit')).toEqual([
      [{ email: 'ada@example.com', password: 'secret-pw' }],
    ])
  })

  it('shows the general error and field errors', async () => {
    const { wrapper } = await renderWithApp(LoginForm, {
      props: {
        submitting: false,
        errorMessage: 'These credentials do not match.',
        fieldErrors: { email: ['Enter a valid email'] },
      },
    })
    expect(wrapper.get('[role=alert]').text()).toContain('These credentials do not match.')
    expect(wrapper.get('[data-error]').text()).toBe('Enter a valid email')
  })

  it('disables the submit button while submitting', async () => {
    const { wrapper } = await renderWithApp(LoginForm, {
      props: { submitting: true, errorMessage: null, fieldErrors: {} },
    })
    expect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()
  })
})
