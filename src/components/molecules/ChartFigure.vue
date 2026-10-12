<script setup lang="ts">
// A chart is a picture for sighted people: it is exposed as one image described by `label`, and
// the numbers behind it travel as a table next to it.
defineProps<{ label: string }>()
</script>

<template>
  <div class="chart" role="img" :aria-label="label">
    <slot />
  </div>
</template>

<style scoped>
.chart {
  position: relative;
  width: 100%;
  height: 16rem;
}
</style>
