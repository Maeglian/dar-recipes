<script setup lang="ts">
import { RATINGS } from '../domain/ratings'
import type { Rating } from '../domain/types'

const props = defineProps<{ modelValue: Rating | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: Rating | null] }>()

function pick(value: Rating) {
  // Повторное нажатие на выбранную оценку снимает её
  emit('update:modelValue', props.modelValue === value ? null : value)
}
</script>

<template>
  <div class="rating-picker" role="group" aria-label="Оценка">
    <button
      v-for="r in RATINGS"
      :key="r.value"
      type="button"
      class="chip rating-picker__option"
      :class="[`rating-${r.value}`, { 'is-current': modelValue === r.value }]"
      :aria-pressed="modelValue === r.value"
      @click="pick(r.value)"
    >
      {{ r.label }}
    </button>
  </div>
</template>

<style scoped>
.rating-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.rating-picker__option {
  opacity: 0.75;
}

.rating-picker__option.is-current {
  opacity: 1;
  border-color: var(--color-text);
  font-weight: 600;
}
</style>
