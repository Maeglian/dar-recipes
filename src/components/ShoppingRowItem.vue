<script setup lang="ts">
import { computed } from 'vue'
import type { ShoppingRow } from '../domain/shopping-list'

const props = defineProps<{ row: ShoppingRow }>()
const emit = defineEmits<{ toggle: [value: boolean]; removeManual: [] }>()

const hasManual = computed(() => props.row.sources.some((s) => s.kind === 'manual'))
</script>

<template>
  <li class="shopping-row" :class="{ 'is-bought': row.bought }" data-testid="shopping-row">
    <label class="shopping-row__label">
      <input
        type="checkbox"
        class="shopping-row__check"
        :checked="row.bought"
        :aria-label="`Куплено: ${row.name}`"
        @change="emit('toggle', ($event.target as HTMLInputElement).checked)"
      />
      <span class="shopping-row__body">
        <span class="shopping-row__main">
          <span class="shopping-row__name">{{ row.name }}</span>
          <span v-if="row.quantity" class="shopping-row__qty">{{ row.quantity }}</span>
        </span>
        <span class="shopping-row__sources muted">{{ row.sourceLabel }}</span>
      </span>
    </label>
    <button
      v-if="hasManual"
      type="button"
      class="btn btn-icon shopping-row__remove"
      :aria-label="`Удалить «${row.name}» из добавленного вручную`"
      @click="emit('removeManual')"
    >
      ✕
    </button>
  </li>
</template>

<style scoped>
.shopping-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

.shopping-row__label {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
  min-height: 56px;
  cursor: pointer;
}

.shopping-row__check {
  flex: none;
  width: 22px;
  height: 22px;
  margin: 0;
  accent-color: var(--color-accent);
}

.shopping-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.shopping-row__main {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.shopping-row__name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.shopping-row__qty {
  white-space: nowrap;
  font-weight: 600;
}

.shopping-row__sources {
  font-size: 13px;
}

.shopping-row__remove {
  min-width: 36px;
  min-height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
}

.is-bought .shopping-row__name,
.is-bought .shopping-row__qty {
  color: var(--color-done);
  text-decoration: line-through;
}
</style>
