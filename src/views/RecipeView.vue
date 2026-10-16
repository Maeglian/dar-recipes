<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BackButton from '../components/BackButton.vue'
import IngredientRow from '../components/IngredientRow.vue'
import NewBadge from '../components/NewBadge.vue'
import RatingBadge from '../components/RatingBadge.vue'
import RecipeImagePlaceholder from '../components/RecipeImagePlaceholder.vue'
import RatingPicker from '../components/RatingPicker.vue'
import ServingsStepper from '../components/ServingsStepper.vue'
import ShoppingToggle from '../components/ShoppingToggle.vue'
import { useCollections } from '../composables/useCollections'
import { useObjectUrl } from '../composables/useObjectUrl'
import { useRecipe, useRecipeImage } from '../composables/useRecipe'
import {
  deleteRecipe,
  resetBought,
  setBought,
  setCooked,
  setRating,
  setSelected,
  setServings,
} from '../data/recipeRepository'
import { NEW_COLLECTION_ID } from '../domain/catalog'
import { ratingClass } from '../domain/ratings'
import type { Rating } from '../domain/types'

const props = defineProps<{ id: string }>()
const router = useRouter()

const { recipe, loading, notFound } = useRecipe(() => props.id)
const image = useRecipeImage(() => props.id)
const imageUrl = useObjectUrl(image)

const { byId: collectionsById } = useCollections()
const recipeCollections = computed(() =>
  (recipe.value?.collectionIds ?? [])
    .map((id) => collectionsById.value.get(id))
    .filter((c) => c !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
)

const hasBought = computed(() => recipe.value?.ingredients.some((i) => i.bought) ?? false)

function onToggle(ingredientId: string, value: boolean) {
  void setBought(props.id, [ingredientId], value)
}

function onRating(value: Rating | null) {
  void setRating(props.id, value)
}

function onServings(value: number) {
  void setServings(props.id, value)
}

async function remove() {
  if (!recipe.value) return
  if (!window.confirm(`Удалить рецепт «${recipe.value.title}»?`)) return
  await deleteRecipe(props.id)
  await router.replace({ name: 'catalog' })
}
</script>

<template>
  <div class="page">
    <BackButton />
    <p v-if="loading" class="muted">Загрузка…</p>
    <div v-else-if="notFound" class="empty">
      <p>Рецепт не найден.</p>
      <RouterLink class="btn" to="/">К рецептам</RouterLink>
    </div>

    <article v-else-if="recipe" class="recipe">
      <header class="recipe__header card" :class="ratingClass(recipe.rating)" data-testid="recipe-header">
        <img v-if="imageUrl" class="recipe__image" :src="imageUrl" alt="" />
        <RecipeImagePlaceholder v-else-if="!recipe.hasImage" class="recipe__placeholder" :rating="recipe.rating" />
        <div class="recipe__header-body">
          <h1>{{ recipe.title }}</h1>
          <div v-if="!recipe.cooked || recipe.rating" class="recipe__badges">
            <RouterLink v-if="!recipe.cooked" :to="{ name: 'catalog', query: { collection: NEW_COLLECTION_ID } }">
              <NewBadge />
            </RouterLink>
            <RatingBadge v-if="recipe.rating" :rating="recipe.rating" />
          </div>
          <div v-if="recipeCollections.length" class="recipe__collections" data-testid="recipe-collections">
            <RouterLink
              v-for="c in recipeCollections"
              :key="c.id"
              class="chip"
              :to="{ name: 'catalog', query: { collection: c.id } }"
            >
              {{ c.name }}
            </RouterLink>
          </div>
          <ServingsStepper :model-value="recipe.servings" :base="recipe.baseServings" @update:model-value="onServings" />
          <label class="recipe__cooked">
            <input
              type="checkbox"
              :checked="recipe.cooked"
              data-testid="cooked"
              @change="setCooked(recipe.id, ($event.target as HTMLInputElement).checked)"
            />
            Приготовлено
          </label>
          <div>
            <ShoppingToggle :selected="recipe.selected" @toggle="setSelected(recipe.id, !recipe.selected)" />
          </div>
        </div>
      </header>

      <section class="recipe__section">
        <div class="recipe__section-header">
          <h2>Ингредиенты</h2>
          <button type="button" class="btn recipe__reset" :disabled="!hasBought" @click="resetBought(recipe.id)">
            Сбросить отметки
          </button>
        </div>
        <ul v-if="recipe.ingredients.length" class="recipe__ingredients">
          <IngredientRow
            v-for="ingredient in recipe.ingredients"
            :key="ingredient.id"
            :ingredient="ingredient"
            :base-servings="recipe.baseServings"
            :servings="recipe.servings"
            @toggle="onToggle(ingredient.id, $event)"
          />
        </ul>
        <p v-else class="muted">Ингредиенты не указаны</p>
      </section>

      <section class="recipe__section">
        <h2>Оценка</h2>
        <RatingPicker :model-value="recipe.rating" @update:model-value="onRating" />
      </section>

      <section v-if="recipe.description" class="recipe__section">
        <h2>Описание</h2>
        <p class="recipe__description" data-testid="description">{{ recipe.description }}</p>
      </section>

      <footer class="recipe__actions">
        <RouterLink class="btn" :to="{ name: 'recipe-edit', params: { id: recipe.id } }">Редактировать</RouterLink>
        <button type="button" class="btn btn-danger" @click="remove">Удалить</button>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.recipe__header {
  overflow: hidden;
  margin-bottom: var(--space-5);
}

.recipe__image {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
}

.recipe__placeholder {
  height: 140px;
  font-size: 28px;
}

.recipe__header-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
}

.recipe__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.recipe__cooked {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--space-2);
  min-height: var(--tap);
  cursor: pointer;
}

.recipe__cooked input {
  width: 20px;
  height: 20px;
  margin: 0;
  accent-color: var(--color-accent);
}

.recipe__collections {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.recipe__section {
  margin-bottom: var(--space-5);
}

.recipe__section h2 {
  font-size: 18px;
  margin-bottom: var(--space-2);
}

.recipe__section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.recipe__section-header h2 {
  margin-bottom: 0;
}

.recipe__reset {
  min-height: 36px;
  font-size: 14px;
}

.recipe__ingredients {
  list-style: none;
  margin: 0;
  padding: 0;
}

.recipe__description {
  /* Переносы строк сохраняются, разметка не интерпретируется */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin: 0;
}

.recipe__actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
</style>
