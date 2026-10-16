<script setup lang="ts">
import { ref } from 'vue'
import { useCollections } from '../composables/useCollections'
import { CollectionNameError, createCollection } from '../data/collectionRepository'

const selected = defineModel<string[]>({ required: true })
const { collections } = useCollections()

const newName = ref('')
const error = ref<string | null>(null)

function toggle(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter((c) => c !== id) : [...selected.value, id]
}

async function add() {
  error.value = null
  try {
    const collection = await createCollection(newName.value)
    selected.value = [...selected.value, collection.id]
    newName.value = ''
  } catch (err) {
    error.value = err instanceof CollectionNameError ? err.message : 'Не удалось создать коллекцию'
  }
}
</script>

<template>
  <div class="picker">
    <div v-if="collections.length" class="picker__chips" role="group" aria-label="Коллекции">
      <button
        v-for="c in collections"
        :key="c.id"
        type="button"
        class="chip"
        :class="{ 'is-selected': selected.includes(c.id) }"
        :aria-pressed="selected.includes(c.id)"
        @click="toggle(c.id)"
      >
        {{ c.name }}
      </button>
    </div>
    <div class="picker__new">
      <input
        v-model="newName"
        class="input"
        :class="{ 'has-error': error }"
        placeholder="Новая коллекция"
        aria-label="Название новой коллекции"
        @keydown.enter.prevent="add"
      />
      <button type="button" class="btn" :disabled="newName.trim() === ''" @click="add">Создать</button>
    </div>
    <span v-if="error" class="error">{{ error }}</span>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.picker__new {
  display: flex;
  gap: var(--space-2);
}
</style>
