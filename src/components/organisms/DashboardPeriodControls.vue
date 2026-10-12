<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFormatters } from '@/composables/useFormatters'
import { useTranslate } from '@/composables/useTranslate'
import { CURRENCIES } from '@/domain/money'
import {
  PERIOD_KINDS,
  type Period,
  type PeriodKind,
  resolveCustomPeriod,
  type StandardPeriodKind,
} from '@/domain/period'
import BaseButton from '../atoms/BaseButton.vue'
import FormField from '../molecules/FormField.vue'
import PeriodNav from '../molecules/PeriodNav.vue'
import SelectField from '../molecules/SelectField.vue'

const props = defineProps<{
  period: Period
  currency: string
  canGoNext: boolean
  today: string
}>()

const emit = defineEmits<{
  select: [kind: StandardPeriodKind]
  shift: [direction: 1 | -1]
  applyCustom: [from: string, to: string]
  'update:currency': [currency: string]
}>()

const t = useTranslate()
const format = useFormatters()

const kindLabels = {
  day: 'expenses.period.day',
  week: 'expenses.period.week',
  month: 'expenses.period.month',
  custom: 'expenses.period.custom',
} as const

const customOpen = ref(props.period.kind === 'custom')
const from = ref(props.period.from)
const to = ref(props.period.to < props.today ? props.period.to : props.today)
const rangeError = ref<string | null>(null)

const pressed = computed<PeriodKind>(() => (customOpen.value ? 'custom' : props.period.kind))
const currencyOptions = CURRENCIES.map((code) => ({ value: code, label: code }))

function choose(kind: PeriodKind): void {
  if (kind === 'custom') {
    customOpen.value = true
    return
  }
  customOpen.value = false
  rangeError.value = null
  emit('select', kind)
}

function submit(): void {
  if (resolveCustomPeriod(from.value, to.value, props.today) === null) {
    rangeError.value = t('expenses.filters.rangeInvalid')
    return
  }
  rangeError.value = null
  emit('applyCustom', from.value, to.value)
}
</script>

<template>
  <div class="controls">
    <div class="controls__row">
      <div role="group" :aria-label="t('expenses.period.label')" class="kinds">
        <button
          v-for="kind in PERIOD_KINDS"
          :key="kind"
          type="button"
          class="kinds__button"
          :aria-pressed="pressed === kind ? 'true' : 'false'"
          @click="choose(kind)"
        >
          {{ t(kindLabels[kind]) }}
        </button>
      </div>
      <SelectField
        class="controls__currency"
        :label="t('dashboard.currency')"
        :model-value="currency"
        :options="currencyOptions"
        @update:model-value="emit('update:currency', $event)"
      />
    </div>

    <form v-if="customOpen" class="range" novalidate @submit.prevent="submit">
      <FormField v-model="from" type="date" :label="t('expenses.period.from')" :max="today" />
      <FormField v-model="to" type="date" :label="t('expenses.period.to')" :max="today" />
      <BaseButton type="submit" variant="secondary">{{ t('dashboard.range.apply') }}</BaseButton>
      <p v-if="rangeError !== null" class="range__error" data-error>{{ rangeError }}</p>
    </form>

    <PeriodNav
      :label="format.period(period)"
      :can-go-next="canGoNext"
      @previous="emit('shift', -1)"
      @next="emit('shift', 1)"
    />
  </div>
</template>

<style scoped>
.controls {
  display: grid;
  gap: var(--space-4);
}

.controls__row {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
}

.kinds {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.kinds__button {
  min-height: var(--target-min);
  padding: 0 var(--space-4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-weight: var(--weight-medium);
  cursor: pointer;
}

.kinds__button[aria-pressed='true'] {
  border-color: var(--color-text);
  background: var(--color-text);
  color: var(--color-bg);
}

.range {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: var(--space-3);
}

.range__error {
  flex-basis: 100%;
  color: var(--color-danger);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
</style>
