import type { Router } from 'vue-router'
import { translate } from '@/i18n'
import { useAuthStore } from '@/stores/auth'

/** Accepts only same-origin paths so a crafted `redirect` cannot send people elsewhere. */
export function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/'
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/'
}

export function installGuards(router: Router): void {
  router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta.requiresAuth === true && !auth.isAuthenticated) {
      return {
        name: 'login',
        query: to.fullPath === '/' ? {} : { redirect: to.fullPath },
      }
    }
    if (to.meta.guestOnly === true && auth.isAuthenticated) {
      return safeRedirect(to.query.redirect)
    }
    return true
  })

  router.afterEach((to) => {
    if (to.meta.titleKey !== undefined) {
      document.title = `${translate(to.meta.titleKey)} · ${translate('app.name')}`
    }
  })
}
