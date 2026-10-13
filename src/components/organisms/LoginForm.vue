<script setup lang="ts">
import { ref } from 'vue'
import { useTranslate } from '@/composables/useTranslate'
import { useValidatedForm } from '@/composables/useValidatedForm'
import { type LoginFormValues, validateLoginForm } from '@/domain/auth-form'
import BaseButton from '../atoms/BaseButton.vue'
import ErrorAlert from '../molecules/ErrorAlert.vue'
import FormField from '../molecules/FormField.vue'

const props = defineProps<{
  submitting: boolean
  errorMessage: string | null
  fieldErrors: Record<string, string[]>
}>()

const emit = defineEmits<{ submit: [credentials: LoginFormValues] }>()

const t = useTranslate()
const email = ref('')
const password = ref('')
const { messages, validated } = useValidatedForm(validateLoginForm, () => props.fieldErrors)

function submit(): void {
  const credentials = validated({ email: email.value, password: password.value })
  if (credentials !== null) emit('submit', credentials)
}
</script>

<template>
  <form class="form-stack" novalidate @submit.prevent="submit">
    <ErrorAlert v-if="errorMessage !== null" :message="errorMessage" />
    <FormField
      v-model="email"
      :label="t('auth.email')"
      type="email"
      autocomplete="email"
      required
      :errors="messages('email')"
    />
    <FormField
      v-model="password"
      :label="t('auth.password')"
      type="password"
      autocomplete="current-password"
      required
      :errors="messages('password')"
    />
    <BaseButton type="submit" :loading="submitting">{{ t('auth.login.submit') }}</BaseButton>
  </form>
</template>
