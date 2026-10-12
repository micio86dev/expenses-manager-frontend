<script setup lang="ts">
import { ref } from 'vue'
import { useTranslate } from '@/composables/useTranslate'
import BaseButton from '../atoms/BaseButton.vue'
import ErrorAlert from '../molecules/ErrorAlert.vue'
import FormField from '../molecules/FormField.vue'

defineProps<{
  submitting: boolean
  errorMessage: string | null
  fieldErrors: Record<string, string[]>
}>()

const emit = defineEmits<{ submit: [credentials: { email: string; password: string }] }>()

const t = useTranslate()
const email = ref('')
const password = ref('')
</script>

<template>
  <form class="auth-form" novalidate @submit.prevent="emit('submit', { email, password })">
    <ErrorAlert v-if="errorMessage !== null" :message="errorMessage" />
    <FormField
      v-model="email"
      :label="t('auth.email')"
      type="email"
      autocomplete="email"
      required
      :errors="fieldErrors['email'] ?? []"
    />
    <FormField
      v-model="password"
      :label="t('auth.password')"
      type="password"
      autocomplete="current-password"
      required
      :errors="fieldErrors['password'] ?? []"
    />
    <BaseButton type="submit" :loading="submitting">{{ t('auth.login.submit') }}</BaseButton>
  </form>
</template>

<style scoped>
.auth-form {
  display: grid;
  gap: var(--space-4);
}
</style>
