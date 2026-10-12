import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Expense } from '@/api/types'

/** Whether the add/edit expense sheet is open, and which expense it edits (null = a new one). */
export const useExpenseSheetStore = defineStore('expenseSheet', () => {
  const isOpen = ref(false)
  const editing = ref<Expense | null>(null)

  function openCreate(): void {
    editing.value = null
    isOpen.value = true
  }

  function openEdit(expense: Expense): void {
    editing.value = expense
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
    editing.value = null
  }

  return { isOpen, editing, openCreate, openEdit, close }
})
