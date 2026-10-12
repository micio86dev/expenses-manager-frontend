import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useChartTheme } from './useChartTheme'

type Listener = () => void

function stubMedia(initial: Record<string, boolean>) {
  const matches = { ...initial }
  const listeners = new Map<string, Set<Listener>>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return matches[query] ?? false
    },
    addEventListener: (_: string, listener: Listener) => {
      listeners.set(query, (listeners.get(query) ?? new Set()).add(listener))
    },
    removeEventListener: (_: string, listener: Listener) => {
      listeners.get(query)?.delete(listener)
    },
  }))
  return {
    matches,
    fire: (query: string) => {
      listeners.get(query)?.forEach((listener) => {
        listener()
      })
    },
    count: (query: string) => listeners.get(query)?.size ?? 0,
  }
}

function probe() {
  let result: ReturnType<typeof useChartTheme> | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        result = useChartTheme()
        return () => h('div')
      },
    }),
  )
  if (result === undefined) throw new Error('composable did not run')
  return { wrapper, theme: result }
}

describe('useChartTheme', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('style')
  })

  it('reads the design tokens and the motion preference', () => {
    stubMedia({ '(prefers-reduced-motion: reduce)': true })
    document.documentElement.style.setProperty('--color-text', '#123456')
    document.documentElement.style.setProperty('--color-accent', '#0b6b72')
    const { theme } = probe()
    expect(theme.colors.value.text).toBe('#123456')
    expect(theme.colors.value.accent).toBe('#0b6b72')
    expect(theme.animate.value).toBe(false)
  })

  it('animates when reduced motion is not requested', () => {
    stubMedia({})
    expect(probe().theme.animate.value).toBe(true)
  })

  it('follows the colour scheme and the motion preference while mounted', async () => {
    const media = stubMedia({})
    document.documentElement.style.setProperty('--color-text', '#111111')
    const { wrapper, theme } = probe()
    expect(theme.colors.value.text).toBe('#111111')

    document.documentElement.style.setProperty('--color-text', '#eeeeee')
    media.fire('(prefers-color-scheme: dark)')
    await nextTick()
    expect(theme.colors.value.text).toBe('#eeeeee')

    media.matches['(prefers-reduced-motion: reduce)'] = true
    media.fire('(prefers-reduced-motion: reduce)')
    expect(theme.animate.value).toBe(false)

    wrapper.unmount()
    expect(media.count('(prefers-color-scheme: dark)')).toBe(0)
    expect(media.count('(prefers-reduced-motion: reduce)')).toBe(0)
  })
})
