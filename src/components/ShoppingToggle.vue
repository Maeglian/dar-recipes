<script setup lang="ts">
defineProps<{ selected: boolean; compact?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="btn shopping-toggle"
    :class="{ 'is-selected': selected, 'btn-icon': compact }"
    :aria-pressed="selected"
    :aria-label="compact ? (selected ? 'Убрать из покупок' : 'Добавить в покупки') : undefined"
    data-testid="shopping-toggle"
    @click.prevent.stop="emit('toggle')"
  >
    <span aria-hidden="true">🛒</span>
    <span v-if="!compact">{{ selected ? 'В списке покупок' : 'В покупки' }}</span>
    <span v-else-if="selected" class="shopping-toggle__check" aria-hidden="true">✓</span>
  </button>
</template>

<style scoped>
.shopping-toggle.is-selected {
  background: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-accent-text);
}

.shopping-toggle__check {
  font-size: 12px;
  font-weight: 700;
  margin-left: -4px;
}
</style>
