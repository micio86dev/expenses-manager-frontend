<script setup lang="ts">
import { ref } from 'vue'
import { useTranslate } from '@/composables/useTranslate'
import { useValidatedForm } from '@/composables/useValidatedForm'
import { PASSWORD_MIN, type RegisterFormValues, validateRegisterForm } from '@/domain/auth-form'
import BaseButton from '../atoms/BaseButton.vue'
import ErrorAlert from '../molecules/ErrorAlert.vue'
import FormField from '../molecules/FormField.vue'

const props = defineProps<{
  submitting: boolean
  errorMessage: string | null
  fieldErrors: Record<string, string[]>
}>()

const emit = defineEmits<{
  submit: [account: RegisterFormValues]
}>()

const t = useTranslate()
const name = ref('')
const email = ref('')
const password = ref('')
const { messages, validated } = useValidatedForm(validateRegisterForm, () => props.fieldErrors)

function submit(): void {
  const account = validated({ name: name.value, email: email.value, password: password.value })
  if (account !== null) emit('submit', account)
}
</script>

<template>
  <form class="form-stack" novalidate @submit.prevent="submit">
    <ErrorAlert v-if="errorMessage !== null" :message="errorMessage" />
    <FormField
      v-model="name"
      :label="t('auth.name')"
      autocomplete="name"
      required
      :errors="messages('name')"
    />
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
      autocomplete="new-password"
      required
      :minlength="PASSWORD_MIN"
      :hint="t('auth.register.passwordHint')"
      :errors="messages('password')"
    />
    <BaseButton type="submit" :loading="submitting">{{ t('auth.register.submit') }}</BaseButton>
  </form>
</template>
