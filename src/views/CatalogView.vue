<script setup lang="ts">
import LoadingState from '../components/LoadingState.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RecipeCard from '../components/RecipeCard.vue'
import ShoppingToggle from '../components/ShoppingToggle.vue'
import { useCollections } from '../composables/useCollections'
import { useLiveQuery } from '../composables/useLiveQuery'
import { listRecipes, setSelected } from '../data/recipeRepository'
import {
  NEW_COLLECTION_ID,
  NEW_COLLECTION_NAME,
  filterCatalog,
  isFilterActive,
  type CatalogFilter,
  type RatingFilter,
} from '../domain/catalog'
import { RATINGS } from '../domain/ratings'
import type { Recipe } from '../domain/types'

const route = useRoute()
const router = useRouter()

const { data, loading } = useLiveQuery<Recipe[]>(listRecipes, [])
const { collections } = useCollections()

const RATING_VALUES = new Set<string>([...RATINGS.map((r) => r.value), 'none'])

function queryString(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

// Фильтры живут в адресе: переживают переход в рецепт и обратно
const filter = computed<CatalogFilter>(() => ({
  search: queryString('q'),
  collectionId: queryString('collection') || null,
  rating: RATING_VALUES.has(queryString('rating')) ? (queryString('rating') as RatingFilter) : null,
}))

function setQuery(patch: Record<string, string | null>) {
  const query = { ...route.query, ...patch }
  for (const key of Object.keys(query)) if (!query[key]) delete query[key]
  void router.replace({ query })
}

const search = computed({
  get: () => filter.value.search,
  set: (value: string) => setQuery({ q: value }),
})
const collectionId = computed({
  get: () => filter.value.collectionId ?? '',
  set: (value: string) => setQuery({ collection: value }),
})
const rating = computed({
  get: () => filter.value.rating ?? '',
  set: (value: string) => setQuery({ rating: value }),
})

const recipes = computed(() => filterCatalog(data.value, filter.value))
const hasRecipes = computed(() => data.value.length > 0)

function resetFilters() {
  void router.replace({ query: {} })
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>Рецепты</h1>
      <RouterLink class="btn btn-primary" :to="{ name: 'recipe-new' }">+ Рецепт</RouterLink>
    </header>

    <LoadingState v-if="loading" />

    <div v-else-if="!hasRecipes" class="empty">
      <p>Рецептов пока нет. Добавьте первый — с ингредиентами, порциями и фото.</p>
      <RouterLink class="btn btn-primary" :to="{ name: 'recipe-new' }">Создать рецепт</RouterLink>
    </div>

    <template v-else>
      <div class="filters">
        <input v-model="search" class="input" type="search" placeholder="Поиск по названию" aria-label="Поиск" />
        <div class="filters__row">
          <select v-model="collectionId" class="input" aria-label="Коллекция">
            <option value="">Все коллекции</option>
            <option :value="NEW_COLLECTION_ID">{{ NEW_COLLECTION_NAME }}</option>
            <option v-for="c in collections" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <select v-model="rating" class="input" aria-label="Оценка">
            <option value="">Любая оценка</option>
            <option v-for="r in RATINGS" :key="r.value" :value="r.value">{{ r.label }}</option>
            <option value="none">Без оценки</option>
          </select>
        </div>
      </div>

      <div v-if="recipes.length === 0" class="empty">
        <p>Ничего не найдено</p>
        <button type="button" class="btn" @click="resetFilters">Сбросить фильтры</button>
      </div>

      <ul v-else class="catalog">
        <li v-for="recipe in recipes" :key="recipe.id">
          <RecipeCard :recipe="recipe">
            <div class="catalog__toggle">
              <ShoppingToggle compact :selected="recipe.selected" @toggle="setSelected(recipe.id, !recipe.selected)" />
            </div>
          </RecipeCard>
        </li>
      </ul>

      <p v-if="isFilterActive(filter) && recipes.length > 0" class="catalog__reset">
        <button type="button" class="btn" @click="resetFilters">Сбросить фильтры</button>
      </p>
    </template>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.filters__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}

.filters__row .input {
  min-width: 0;
}

.catalog {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.catalog__toggle {
  display: flex;
  align-items: center;
  padding: var(--space-2);
}

.catalog__reset {
  text-align: center;
  margin-top: var(--space-4);
}
</style>
