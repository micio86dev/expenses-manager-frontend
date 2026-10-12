<script setup lang="ts">
import { useId } from 'vue'
import { useTranslate } from '@/composables/useTranslate'
import BaseButton from '../atoms/BaseButton.vue'
import BottomSheet from './BottomSheet.vue'

defineProps<{ title: string; message: string; confirmLabel: string }>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const t = useTranslate()
const messageId = useId()
</script>

<template>
  <BottomSheet
    :title="title"
    role="alertdialog"
    placement="center"
    :describedby="messageId"
    initial-focus="[data-cancel]"
    @close="emit('cancel')"
  >
    <p :id="messageId">{{ message }}</p>
    <div class="confirm__actions">
      <BaseButton data-cancel variant="secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton data-confirm variant="danger" @click="emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </div>
  </BottomSheet>
</template>

<style scoped>
.confirm__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
