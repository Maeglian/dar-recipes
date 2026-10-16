<script setup lang="ts">
import { UNIT_OPTIONS } from '../domain/units'
import type { IngredientDraft, IngredientErrors } from '../domain/validation'

defineProps<{
  index: number
  total: number
  errors?: IngredientErrors
}>()

const row = defineModel<IngredientDraft>({ required: true })

const emit = defineEmits<{
  moveUp: []
  moveDown: []
  remove: []
}>()

function update<K extends keyof IngredientDraft>(key: K, value: IngredientDraft[K]) {
  row.value = { ...row.value, [key]: value }
}
</script>

<template>
  <div class="ingredient-editor" :data-testid="`ingredient-${index}`">
    <div class="ingredient-editor__main">
      <input
        class="input ingredient-editor__name"
        :class="{ 'has-error': errors?.name }"
        :value="row.name"
        placeholder="Ингредиент"
        aria-label="Название ингредиента"
        @input="update('name', ($event.target as HTMLInputElement).value)"
      />
      <div class="ingredient-editor__qty">
        <input
          class="input ingredient-editor__amount"
          :class="{ 'has-error': errors?.amount }"
          :value="row.amount"
          inputmode="decimal"
          placeholder="по вкусу"
          aria-label="Количество"
          @input="update('amount', ($event.target as HTMLInputElement).value)"
        />
        <select
          class="input ingredient-editor__unit"
          :value="row.unit"
          aria-label="Единица"
          :disabled="row.amount.trim() === ''"
          @change="update('unit', ($event.target as HTMLSelectElement).value as IngredientDraft['unit'])"
        >
          <option v-for="opt in UNIT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
      <input
        v-if="row.unit === 'custom' && row.amount.trim() !== ''"
        class="input"
        :class="{ 'has-error': errors?.customUnit }"
        :value="row.customUnit"
        placeholder="Своя единица, например «пучок»"
        aria-label="Своя единица"
        @input="update('customUnit', ($event.target as HTMLInputElement).value)"
      />
      <div v-if="errors" class="error">
        {{ [errors.name, errors.amount, errors.customUnit].filter(Boolean).join('. ') }}
      </div>
    </div>
    <div class="ingredient-editor__actions">
      <button type="button" class="btn btn-icon" :disabled="index === 0" aria-label="Выше" @click="emit('moveUp')">
        ↑
      </button>
      <button
        type="button"
        class="btn btn-icon"
        :disabled="index === total - 1"
        aria-label="Ниже"
        @click="emit('moveDown')"
      >
        ↓
      </button>
      <button type="button" class="btn btn-icon btn-danger" aria-label="Удалить ингредиент" @click="emit('remove')">
        ✕
      </button>
    </div>
  </div>
</template>

<style scoped>
.ingredient-editor {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.ingredient-editor__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.ingredient-editor__qty {
  display: flex;
  gap: var(--space-2);
}

.ingredient-editor__amount {
  flex: 1;
  min-width: 0;
}

.ingredient-editor__unit {
  width: 110px;
  flex: none;
}

.ingredient-editor__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ingredient-editor__actions .btn {
  min-height: 36px;
  min-width: 36px;
}
</style>
