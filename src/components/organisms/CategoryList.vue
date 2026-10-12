<script setup lang="ts">
import type { Category } from '@/api/types'
import { isTempId } from '@/domain/optimistic'
import { useTranslate } from '@/composables/useTranslate'
import BaseButton from '../atoms/BaseButton.vue'
import CategoryBadge from '../molecules/CategoryBadge.vue'

defineProps<{ categories: readonly Category[] }>()

const emit = defineEmits<{
  edit: [category: Category]
  archive: [category: Category]
  unarchive: [category: Category]
  delete: [category: Category]
}>()

const t = useTranslate()

function toggleArchive(category: Category): void {
  if (category.archived) emit('unarchive', category)
  else emit('archive', category)
}
</script>

<template>
  <ul class="category-list" :aria-label="t('categories.listLabel')">
    <li
      v-for="category in categories"
      :key="category.id"
      class="category-row"
      :aria-busy="isTempId(category.id) ? 'true' : undefined"
    >
      <div class="category-row__main">
        <CategoryBadge :name="category.name" :color="category.color" :icon="category.icon" />
        <span v-if="category.isSystem" class="category-row__tag">
          {{ t('categories.badges.system') }}
        </span>
        <span v-if="category.archived" class="category-row__tag">
          {{ t('categories.badges.archived') }}
        </span>
      </div>
      <p v-if="category.isSystem" class="category-row__hint">{{ t('categories.systemHint') }}</p>
      <div v-else class="category-row__actions">
        <BaseButton
          variant="secondary"
          :disabled="isTempId(category.id)"
          :aria-label="t('categories.actions.edit', { name: category.name })"
          @click="emit('edit', category)"
        >
          {{ t('common.edit') }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          :disabled="isTempId(category.id)"
          :aria-label="
            t(category.archived ? 'categories.actions.unarchive' : 'categories.actions.archive', {
              name: category.name,
            })
          "
          @click="toggleArchive(category)"
        >
          {{ t(category.archived ? 'common.restore' : 'common.archive') }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          :disabled="isTempId(category.id)"
          :aria-label="t('categories.actions.delete', { name: category.name })"
          @click="emit('delete', category)"
        >
          {{ t('common.delete') }}
        </BaseButton>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.category-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.category-row {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-top: 2px solid var(--color-rule);
}

.category-row:last-child {
  border-bottom: 2px solid var(--color-rule);
}

.category-row[aria-busy='true'] {
  opacity: 0.6;
}

.category-row__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.category-row__tag {
  padding: 0 var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.category-row__hint {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.category-row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.category-row__actions :deep(.base-button) {
  padding-inline: var(--space-4);
}
</style>
