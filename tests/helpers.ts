import axe from 'axe-core'
import { flushPromises, mount, type ComponentMountingOptions } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { expect } from 'vitest'
import type { Component } from 'vue'
import { createMemoryHistory, type Router } from 'vue-router'
import { tokenStorage } from '@/api/token'
import { i18n } from '@/i18n'
import { useLocaleStore } from '@/stores/locale'
import { createAppRouter } from '@/router'
import type { LocaleCode } from '@/i18n/registry'

interface RenderOptions {
  route?: string
  locale?: LocaleCode
  props?: Record<string, unknown>
  /** Pre-seeds a stored token so the auth store (and the route guard) see a signed-in user. */
  token?: string
  attachTo?: HTMLElement
}

/** Mounts a component with Pinia, vue-i18n and the real router (memory history). */
export async function renderWithApp(component: Component, options: RenderOptions = {}) {
  localStorage.clear()
  if (options.token !== undefined) tokenStorage.set(options.token)
  const pinia = createPinia()
  setActivePinia(pinia)
  await useLocaleStore().apply(options.locale ?? 'en')
  const router: Router = createAppRouter(createMemoryHistory())
  await router.push(options.route ?? '/login')
  await router.isReady()
  const mountOptions: ComponentMountingOptions<Component> = {
    global: { plugins: [pinia, i18n, router] },
    attachTo: options.attachTo ?? document.body,
    ...(options.props === undefined ? {} : { props: options.props }),
  }
  const wrapper = mount(component, mountOptions)
  await flushPromises()
  return { wrapper, router, pinia }
}

/**
 * Runs axe-core on the rendered DOM. Colour contrast needs real layout, so it is verified by the
 * Playwright suite instead (happy-dom has no rendering engine).
 */
export async function expectNoA11yViolations(root: unknown): Promise<void> {
  const results = await axe.run(root as Element, {
    rules: { 'color-contrast': { enabled: false } },
  })
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
}
