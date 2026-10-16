<script setup lang="ts">
import { computed } from 'vue'
import type { Ingredient } from '../domain/types'
import { formatQuantity } from '../domain/units'

const props = defineProps<{ ingredient: Ingredient; baseServings: number; servings: number }>()
const emit = defineEmits<{ toggle: [value: boolean] }>()

const quantity = computed(() => formatQuantity(props.ingredient, props.baseServings, props.servings))
</script>

<template>
  <li class="ingredient-row" :class="{ 'is-bought': ingredient.bought }">
    <label class="ingredient-row__label">
      <input
        type="checkbox"
        class="ingredient-row__check"
        :checked="ingredient.bought"
        :aria-label="`Куплено: ${ingredient.name}`"
        @change="emit('toggle', ($event.target as HTMLInputElement).checked)"
      />
      <span class="ingredient-row__name">{{ ingredient.name }}</span>
      <span class="ingredient-row__dots" aria-hidden="true" />
      <span class="ingredient-row__qty">{{ quantity }}</span>
    </label>
  </li>
</template>

<style scoped>
.ingredient-row {
  border-bottom: 1px solid var(--color-border);
}

.ingredient-row__label {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  min-height: var(--tap);
  cursor: pointer;
}

.ingredient-row__check {
  flex: none;
  width: 20px;
  height: 20px;
  margin: 0;
  align-self: center;
  accent-color: var(--color-accent);
}

.ingredient-row__name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.ingredient-row__dots {
  flex: 1;
  border-bottom: 1px dotted var(--color-border);
  min-width: var(--space-4);
}

.ingredient-row__qty {
  white-space: nowrap;
  font-weight: 600;
}

.is-bought .ingredient-row__name,
.is-bought .ingredient-row__qty {
  color: var(--color-done);
  text-decoration: line-through;
}
</style>
