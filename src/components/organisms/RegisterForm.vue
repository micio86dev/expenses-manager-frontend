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

const emit = defineEmits<{
  submit: [account: { name: string; email: string; password: string }]
}>()

const t = useTranslate()
const name = ref('')
const email = ref('')
const password = ref('')
</script>

<template>
  <form class="auth-form" novalidate @submit.prevent="emit('submit', { name, email, password })">
    <ErrorAlert v-if="errorMessage !== null" :message="errorMessage" />
    <FormField
      v-model="name"
      :label="t('auth.name')"
      autocomplete="name"
      required
      :errors="fieldErrors['name'] ?? []"
    />
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
      autocomplete="new-password"
      required
      :minlength="8"
      :hint="t('auth.register.passwordHint')"
      :errors="fieldErrors['password'] ?? []"
    />
    <BaseButton type="submit" :loading="submitting">{{ t('auth.register.submit') }}</BaseButton>
  </form>
</template>

<style scoped>
.auth-form {
  display: grid;
  gap: var(--space-4);
}
</style>
