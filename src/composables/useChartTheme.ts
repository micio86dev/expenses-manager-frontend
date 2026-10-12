import { onScopeDispose, readonly, ref } from 'vue'

const COLOR_SCHEME = '(prefers-color-scheme: dark)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export interface ChartColors {
  text: string
  muted: string
  rule: string
  surface: string
  accent: string
}

function readColors(): ChartColors {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string): string => style.getPropertyValue(name).trim()
  return {
    text: token('--color-text'),
    muted: token('--color-text-muted'),
    rule: token('--color-rule'),
    surface: token('--color-surface'),
    accent: token('--color-accent'),
  }
}

/**
 * What a canvas chart needs from the design system. A canvas cannot read CSS variables, so the
 * tokens are resolved here and refreshed when the colour scheme changes; animation is off for
 * people who asked for reduced motion.
 */
export function useChartTheme() {
  const colors = ref(readColors())
  const reduced = window.matchMedia(REDUCED_MOTION)
  const dark = window.matchMedia(COLOR_SCHEME)
  const animate = ref(!reduced.matches)

  const refreshColors = (): void => {
    colors.value = readColors()
  }
  const refreshMotion = (): void => {
    animate.value = !reduced.matches
  }
  dark.addEventListener('change', refreshColors)
  reduced.addEventListener('change', refreshMotion)
  onScopeDispose(() => {
    dark.removeEventListener('change', refreshColors)
    reduced.removeEventListener('change', refreshMotion)
  })

  return { colors: readonly(colors), animate: readonly(animate) }
}
