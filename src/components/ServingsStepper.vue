<script setup lang="ts">
import { MAX_SERVINGS } from '../domain/validation'

const props = defineProps<{ modelValue: number; base: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function change(delta: number) {
  const next = Math.min(MAX_SERVINGS, Math.max(1, props.modelValue + delta))
  if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>

<template>
  <div class="stepper">
    <span class="stepper__label">Порции</span>
    <button
      type="button"
      class="btn btn-icon"
      aria-label="Меньше порций"
      :disabled="modelValue <= 1"
      @click="change(-1)"
    >
      −
    </button>
    <output class="stepper__value" aria-live="polite" data-testid="servings">{{ modelValue }}</output>
    <button
      type="button"
      class="btn btn-icon"
      aria-label="Больше порций"
      :disabled="modelValue >= MAX_SERVINGS"
      @click="change(1)"
    >
      +
    </button>
    <span v-if="modelValue !== base" class="muted stepper__base">в рецепте: {{ base }}</span>
  </div>
</template>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.stepper__label {
  font-weight: 600;
  margin-right: var(--space-1);
}

.stepper__value {
  min-width: 2ch;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
}

.stepper__base {
  font-size: 14px;
}
</style>
