import { onBeforeUnmount, onMounted, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// Dialogs can stack (a confirmation over a sheet); only the one opened last reacts to the keyboard.
const stack: symbol[] = []

export interface FocusTrapOptions {
  onEscape: () => void
  /** CSS selector of the control that should receive focus first. */
  initialFocus?: () => string | undefined
}

/**
 * Modal dialog focus management: moves focus in, keeps Tab inside, closes on Escape and gives
 * focus back to the element that opened it. The opener is read during setup, before the dialog
 * renders, because that is the last moment it is still focused.
 */
export function useFocusTrap(container: Ref<HTMLElement | null>, options: FocusTrapOptions): void {
  const token = Symbol('focus-trap')
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

  const focusables = (): HTMLElement[] => [
    ...(container.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
  ]

  function onKeydown(event: KeyboardEvent): void {
    if (stack.at(-1) !== token) return
    if (event.key === 'Escape') {
      event.preventDefault()
      options.onEscape()
      return
    }
    if (event.key !== 'Tab') return
    const items = focusables()
    const first = items[0]
    const last = items.at(-1)
    if (first === undefined || last === undefined) {
      event.preventDefault()
      container.value?.focus()
      return
    }
    const active = document.activeElement
    if (!container.value?.contains(active)) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  onMounted(() => {
    stack.push(token)
    document.addEventListener('keydown', onKeydown)
    const selector = options.initialFocus?.()
    const target =
      (selector === undefined ? null : container.value?.querySelector<HTMLElement>(selector)) ??
      focusables()[0] ??
      container.value
    target?.focus()
  })

  onBeforeUnmount(() => {
    stack.splice(stack.indexOf(token), 1)
    document.removeEventListener('keydown', onKeydown)
    if (opener?.isConnected === true) opener.focus()
  })
}
