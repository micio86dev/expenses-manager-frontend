import { createPinia } from 'pinia'
import { createApp, type App as VueApp } from 'vue'
import type { Router, RouterHistory } from 'vue-router'
import App from './App.vue'
import { onUnauthorized } from './api'
import { i18n } from './i18n'
import { createAppRouter } from './router'
import { useAuthStore } from './stores/auth'
import { useLocaleStore } from './stores/locale'

/** Builds the app: language first (so the first paint is localized), then session, then router. */
export async function createExpensesApp(
  history?: RouterHistory,
): Promise<{ app: VueApp; router: Router }> {
  const pinia = createPinia()
  const app = createApp(App).use(pinia).use(i18n)

  await useLocaleStore().init()
  const auth = useAuthStore()
  await auth.boot()

  const router = createAppRouter(history)
  onUnauthorized(() => {
    auth.clearSession()
    void router.replace({
      name: 'login',
      query:
        router.currentRoute.value.fullPath === '/'
          ? {}
          : { redirect: router.currentRoute.value.fullPath },
    })
  })

  app.use(router)
  await router.isReady()
  return { app, router }
}
