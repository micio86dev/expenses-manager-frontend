import type { Messages } from './it'

const en: Messages = {
  app: {
    name: 'Expenses manager',
    skipToContent: 'Skip to content',
    loading: 'Loading',
  },
  nav: {
    label: 'Main navigation',
    dashboard: 'Dashboard',
    expenses: 'Expenses',
    categories: 'Categories',
    settings: 'Settings',
  },
  auth: {
    email: 'Email',
    password: 'Password',
    name: 'Name',
    login: {
      title: 'Sign in',
      subtitle: 'Welcome back. Sign in to see your expenses.',
      submit: 'Sign in',
      switchPrompt: 'No account yet?',
      switchAction: 'Create one',
    },
    register: {
      title: 'Create an account',
      subtitle: 'It takes a few seconds to start tracking your spending.',
      passwordHint: 'At least 8 characters.',
      submit: 'Create account',
      switchPrompt: 'Already have an account?',
      switchAction: 'Sign in',
    },
  },
  dashboard: {
    title: 'Dashboard',
    empty: {
      title: 'No data yet',
      description: 'Once you record your first expenses, you will see how you spend here.',
    },
  },
  expenses: {
    title: 'Expenses',
    empty: {
      title: 'No expenses recorded',
      description: 'The expenses you add will show up here, grouped by day.',
    },
  },
  categories: {
    title: 'Categories',
    empty: {
      title: 'No categories',
      description: 'Categories help you understand where your money goes.',
    },
  },
  settings: {
    title: 'Settings',
    language: {
      label: 'Language',
      description: 'Your choice is remembered on this device and in your account.',
    },
    account: {
      title: 'Account',
      logout: 'Sign out',
    },
  },
  errors: {
    network: 'Cannot reach the server. Check your connection and try again.',
    unknown: 'Something went wrong. Try again in a moment.',
    sessionExpired: 'Your session has expired. Sign in again.',
  },
}

export default en
