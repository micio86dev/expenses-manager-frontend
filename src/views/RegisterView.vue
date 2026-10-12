<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RegisterForm from '@/components/organisms/RegisterForm.vue'
import { describeError } from '@/composables/describeError'
import { useSubmit } from '@/composables/useSubmit'
import { useTranslate } from '@/composables/useTranslate'
import { safeRedirect } from '@/router/guards'
import { useAuthStore } from '@/stores/auth'

interface Account {
  name: string
  email: string
  password: string
}

const t = useTranslate()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const { submitting, error, run } = useSubmit((account: Account) => auth.register(account))
const errorMessage = computed(() => describeError(error.value))
const fieldErrors = computed(() => error.value?.fieldErrors ?? {})

async function onSubmit(account: Account): Promise<void> {
  if (await run(account)) await router.push(safeRedirect(route.query.redirect))
}
</script>

<template>
  <div class="auth-view">
    <h1>{{ t('auth.register.title') }}</h1>
    <p class="auth-view__subtitle">{{ t('auth.register.subtitle') }}</p>
    <RegisterForm
      :submitting="submitting"
      :error-message="errorMessage"
      :field-errors="fieldErrors"
      @submit="onSubmit"
    />
    <p class="auth-view__switch">
      {{ t('auth.register.switchPrompt') }}
      <RouterLink :to="{ name: 'login', query: route.query }">{{
        t('auth.register.switchAction')
      }}</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth-view {
  display: grid;
  gap: var(--space-4);
}

.auth-view__subtitle {
  color: var(--color-text-muted);
}

.auth-view__switch {
  padding-top: var(--space-3);
  border-top: 2px solid var(--color-rule);
}
</style>
