<script setup lang="ts">
import LoadingState from '../components/LoadingState.vue'
import { computed, nextTick, ref } from 'vue'
import { useCollections } from '../composables/useCollections'
import { useLiveQuery } from '../composables/useLiveQuery'
import {
  CollectionNameError,
  createCollection,
  deleteCollection,
  renameCollection,
} from '../data/collectionRepository'
import { listRecipes } from '../data/recipeRepository'
import { NEW_COLLECTION_ID, NEW_COLLECTION_NAME } from '../domain/catalog'
import type { Collection, Recipe } from '../domain/types'

const { collections, loading } = useCollections()
const { data: recipes } = useLiveQuery<Recipe[]>(listRecipes, [])

const counts = computed(() => {
  const map = new Map<string, number>()
  for (const r of recipes.value) for (const id of r.collectionIds) map.set(id, (map.get(id) ?? 0) + 1)
  return map
})

const newCount = computed(() => recipes.value.filter((r) => !r.cooked).length)

const newName = ref('')
const createError = ref<string | null>(null)

const editingId = ref<string | null>(null)
const editName = ref('')
const editError = ref<string | null>(null)
const editInput = ref<HTMLInputElement[]>([])

function messageOf(err: unknown): string {
  return err instanceof CollectionNameError ? err.message : 'Не удалось сохранить коллекцию'
}

async function create() {
  createError.value = null
  try {
    await createCollection(newName.value)
    newName.value = ''
  } catch (err) {
    createError.value = messageOf(err)
  }
}

async function startEdit(c: Collection) {
  editingId.value = c.id
  editName.value = c.name
  editError.value = null
  await nextTick()
  editInput.value[0]?.focus()
}

function cancelEdit() {
  editingId.value = null
  editError.value = null
}

async function saveEdit() {
  if (!editingId.value) return
  editError.value = null
  try {
    await renameCollection(editingId.value, editName.value)
    editingId.value = null
  } catch (err) {
    editError.value = messageOf(err)
  }
}

async function remove(c: Collection) {
  const count = counts.value.get(c.id) ?? 0
  const suffix = count > 0 ? ` Рецепты (${count}) останутся, коллекция просто будет снята с них.` : ''
  if (!window.confirm(`Удалить коллекцию «${c.name}»?${suffix}`)) return
  await deleteCollection(c.id)
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>Коллекции</h1>
    </header>

    <form class="collections__new" @submit.prevent="create">
      <input
        v-model="newName"
        class="input"
        :class="{ 'has-error': createError }"
        placeholder="Новая коллекция"
        aria-label="Название новой коллекции"
      />
      <button type="submit" class="btn btn-primary" :disabled="newName.trim() === ''">Создать</button>
    </form>
    <p v-if="createError" class="error">{{ createError }}</p>

    <LoadingState v-if="loading" />

    <ul v-else class="collections">
      <li class="collections__item card collections__item--builtin" data-testid="builtin-new">
        <RouterLink class="collections__name" :to="{ name: 'catalog', query: { collection: NEW_COLLECTION_ID } }">
          {{ NEW_COLLECTION_NAME }}
          <span class="muted">{{ newCount }}</span>
        </RouterLink>
        <span class="muted collections__hint">ещё не приготовленные</span>
      </li>
      <li v-for="c in collections" :key="c.id" class="collections__item card">
        <form v-if="editingId === c.id" class="collections__edit" @submit.prevent="saveEdit">
          <input
            ref="editInput"
            v-model="editName"
            class="input"
            :class="{ 'has-error': editError }"
            aria-label="Новое название коллекции"
            @keydown.esc="cancelEdit"
          />
          <div class="collections__actions">
            <button type="button" class="btn" @click="cancelEdit">Отмена</button>
            <button type="submit" class="btn btn-primary">Сохранить</button>
          </div>
          <span v-if="editError" class="error">{{ editError }}</span>
        </form>
        <template v-else>
          <RouterLink class="collections__name" :to="{ name: 'catalog', query: { collection: c.id } }">
            {{ c.name }}
            <span class="muted">{{ counts.get(c.id) ?? 0 }}</span>
          </RouterLink>
          <div class="collections__actions">
            <button type="button" class="btn btn-icon" :aria-label="`Переименовать «${c.name}»`" @click="startEdit(c)">
              ✎
            </button>
            <button
              type="button"
              class="btn btn-icon btn-danger"
              :aria-label="`Удалить «${c.name}»`"
              @click="remove(c)"
            >
              ✕
            </button>
          </div>
        </template>
      </li>
    </ul>
    <p v-if="!loading && collections.length === 0" class="empty">
      Своих коллекций пока нет. Создайте первую, например «Завтраки» или «Выпечка».
    </p>
  </div>
</template>

<style scoped>
.collections__new {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.collections {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.collections__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-2) var(--space-2) var(--space-4);
}

.collections__name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: var(--tap);
  color: inherit;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.collections__hint {
  font-size: 13px;
  padding-right: var(--space-2);
}

.collections__edit {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}

.collections__actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
