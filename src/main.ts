import './styles/base.css'
import { createExpensesApp } from './bootstrap'

void createExpensesApp().then(({ app }) => app.mount('#app'))
