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
    notices: {
      createFailed: 'Could not save the expense. Your change was undone.',
      updateFailed: 'Could not update the expense. Your change was undone.',
      deleteFailed: 'Could not delete the expense. Your change was undone.',
      loadMoreFailed: 'Could not load more expenses.',
    },
    form: {
      errors: {
        amountInvalid: 'Enter an amount above zero with at most two decimals.',
        descriptionRequired: 'Enter a description.',
        descriptionTooLong: 'Use at most 255 characters.',
        categoryRequired: 'Pick a category.',
        dateInvalid: 'Enter a valid date.',
      },
    },
  },
  categories: {
    title: 'Categories',
    empty: {
      title: 'No categories',
      description: 'Categories help you understand where your money goes.',
    },
    colors: {
      ocean: 'Ocean',
      brick: 'Brick',
      slate: 'Slate',
      amber: 'Amber',
      moss: 'Moss',
      plum: 'Plum',
      indigo: 'Indigo',
      rust: 'Rust',
    },
    notices: {
      createFailed: 'Could not create the category. Your change was undone.',
      updateFailed: 'Could not update the category. Your change was undone.',
      archiveFailed: 'Could not archive the category. Your change was undone.',
      unarchiveFailed: 'Could not restore the category. Your change was undone.',
      deleteFailed: 'Could not delete the category. Your change was undone.',
      deleteInUse: 'This category is used by expenses and cannot be deleted. Archive it instead.',
    },
    form: {
      errors: {
        nameRequired: 'Enter a name.',
        nameTooLong: 'Use at most 60 characters.',
        colorInvalid: 'Pick a colour.',
        iconInvalid: 'Pick an icon.',
      },
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
