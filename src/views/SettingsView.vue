<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/atoms/BaseButton.vue'
import ErrorAlert from '@/components/molecules/ErrorAlert.vue'
import LanguageSwitcher from '@/components/molecules/LanguageSwitcher.vue'
import { describeError } from '@/composables/describeError'
import { useLanguage } from '@/composables/useLanguage'
import { useSubmit } from '@/composables/useSubmit'
import { useTranslate } from '@/composables/useTranslate'
import type { LocaleCode } from '@/i18n/registry'
import { useAuthStore } from '@/stores/auth'

const t = useTranslate()
const router = useRouter()
const auth = useAuthStore()
const { current, available, change } = useLanguage()

const language = useSubmit((code: LocaleCode) => change(code))
const languageError = computed(() => describeError(language.error.value))

async function signOut(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="page">
    <h1>{{ t('settings.title') }}</h1>

    <section class="page__section" aria-labelledby="settings-language">
      <h2 id="settings-language" class="visually-hidden">{{ t('settings.language.label') }}</h2>
      <ErrorAlert v-if="languageError !== null" :message="languageError" />
      <LanguageSwitcher
        :label="t('settings.language.label')"
        :model-value="current"
        :options="available"
        @update:model-value="language.run"
      />
      <p class="page__hint">{{ t('settings.language.description') }}</p>
    </section>

    <section class="page__section" aria-labelledby="settings-account">
      <h2 id="settings-account">{{ t('settings.account.title') }}</h2>
      <div>
        <BaseButton variant="secondary" @click="signOut">{{
          t('settings.account.logout')
        }}</BaseButton>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  display: grid;
  gap: var(--space-5);
}

.page__section {
  display: grid;
  gap: var(--space-3);
  padding-top: var(--space-4);
  border-top: 2px solid var(--color-rule);
}

.page__hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}
</style>
