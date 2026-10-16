<script setup lang="ts">
import { ref, watch } from 'vue'
import { RATINGS } from '../domain/ratings'
import type { Rating } from '../domain/types'

const props = defineProps<{ modelValue: Rating | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: Rating | null] }>()

// Выбор показывается сразу, не дожидаясь записи в базу; новое значение из базы его подтверждает
const shown = ref<Rating | null>(props.modelValue)
watch(
  () => props.modelValue,
  (value) => (shown.value = value),
)

function pick(value: Rating) {
  // Повторное нажатие на выбранную оценку снимает её
  const next = shown.value === value ? null : value
  shown.value = next
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="rating-picker" role="group" aria-label="Оценка">
    <button
      v-for="r in RATINGS"
      :key="r.value"
      type="button"
      class="chip rating-picker__option"
      :class="{ [`rating-${r.value}`]: shown === r.value, 'is-current': shown === r.value }"
      :aria-pressed="shown === r.value"
      @click="pick(r.value)"
    >
      <span class="rating-picker__dot" :class="`rating-picker__dot--${r.value}`" aria-hidden="true" />
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
  gap: var(--space-2);
  transition:
    background-color 0.15s,
    border-color 0.15s;
}

.rating-picker__option.is-current {
  border-color: var(--color-text);
  font-weight: 600;
}

.rating-picker__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(31, 35, 40, 0.25);
}

.rating-picker__dot--excellent {
  background: var(--rating-excellent-deep);
}
.rating-picker__dot--good {
  background: var(--rating-good-deep);
}
.rating-picker__dot--sometimes {
  background: var(--rating-sometimes-deep);
}
.rating-picker__dot--bad {
  background: var(--rating-bad-deep);
}
</style>
