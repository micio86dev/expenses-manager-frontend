import type { MessageKey } from '@/i18n/keys'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    layout?: 'app' | 'auth'
    titleKey?: MessageKey
  }
}
