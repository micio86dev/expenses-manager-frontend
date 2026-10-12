<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginForm from '@/components/organisms/LoginForm.vue'
import { describeError } from '@/composables/describeError'
import { useSubmit } from '@/composables/useSubmit'
import { useTranslate } from '@/composables/useTranslate'
import { safeRedirect } from '@/router/guards'
import { useAuthStore } from '@/stores/auth'

const t = useTranslate()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const { submitting, error, run } = useSubmit((credentials: { email: string; password: string }) =>
  auth.login(credentials),
)
const errorMessage = computed(() => describeError(error.value))
const fieldErrors = computed(() => error.value?.fieldErrors ?? {})

async function onSubmit(credentials: { email: string; password: string }): Promise<void> {
  if (await run(credentials)) await router.push(safeRedirect(route.query.redirect))
}
</script>

<template>
  <div class="auth-view">
    <h1>{{ t('auth.login.title') }}</h1>
    <p class="auth-view__subtitle">{{ t('auth.login.subtitle') }}</p>
    <LoginForm
      :submitting="submitting"
      :error-message="errorMessage"
      :field-errors="fieldErrors"
      @submit="onSubmit"
    />
    <p class="auth-view__switch">
      {{ t('auth.login.switchPrompt') }}
      <RouterLink :to="{ name: 'register', query: route.query }">{{
        t('auth.login.switchAction')
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
