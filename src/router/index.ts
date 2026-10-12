import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router'
import { installGuards } from './guards'

// Every page is a dynamic import, so each one becomes its own chunk. The layout is chosen by
// `meta.layout` in App.vue (small enough to stay in the entry chunk, no nested-route ambiguity).
const authenticated = { requiresAuth: true, layout: 'app' } as const
const guest = { guestOnly: true, layout: 'auth' } as const

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { ...authenticated, titleKey: 'dashboard.title' },
  },
  {
    path: '/expenses',
    name: 'expenses',
    component: () => import('@/pages/ExpensesPage.vue'),
    meta: { ...authenticated, titleKey: 'expenses.title' },
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/pages/CategoriesPage.vue'),
    meta: { ...authenticated, titleKey: 'categories.title' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { ...authenticated, titleKey: 'settings.title' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { ...guest, titleKey: 'auth.login.title' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
    meta: { ...guest, titleKey: 'auth.register.title' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({ history, routes })
  installGuards(router)
  return router
}
