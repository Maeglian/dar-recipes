<script setup lang="ts">
import { useObjectUrl } from '../composables/useObjectUrl'
import { useRecipeImage } from '../composables/useRecipe'
import { ratingClass } from '../domain/ratings'
import type { Recipe } from '../domain/types'
import NewBadge from './NewBadge.vue'
import RatingBadge from './RatingBadge.vue'
import RecipeImagePlaceholder from './RecipeImagePlaceholder.vue'

const props = defineProps<{ recipe: Recipe }>()

const image = useRecipeImage(() => (props.recipe.hasImage ? props.recipe.id : ''))
const imageUrl = useObjectUrl(image)
</script>

<template>
  <article class="recipe-card card" :class="ratingClass(recipe.rating)" data-testid="recipe-card">
    <RouterLink class="recipe-card__link" :to="{ name: 'recipe', params: { id: recipe.id } }">
      <img v-if="imageUrl" class="recipe-card__image" :src="imageUrl" alt="" loading="lazy" />
      <RecipeImagePlaceholder v-else class="recipe-card__placeholder" :rating="recipe.rating" />
      <div class="recipe-card__body">
        <h2 class="recipe-card__title">{{ recipe.title }}</h2>
        <div v-if="!recipe.cooked || recipe.rating" class="recipe-card__badges">
          <NewBadge v-if="!recipe.cooked" />
          <RatingBadge v-if="recipe.rating" :rating="recipe.rating" />
        </div>
      </div>
    </RouterLink>
    <slot />
  </article>
</template>

<style scoped>
.recipe-card {
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.recipe-card__link {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  color: inherit;
  text-decoration: none;
}

.recipe-card__image,
.recipe-card__placeholder {
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.recipe-card__placeholder {
  font-size: 16px;
}

.recipe-card__body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
}

.recipe-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.recipe-card__title {
  font-size: 17px;
  overflow-wrap: anywhere;
}
</style>
