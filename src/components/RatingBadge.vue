<script setup lang="ts">
import { ratingLabel } from '../domain/ratings'
import type { Rating } from '../domain/types'

defineProps<{ rating: Rating }>()
</script>

<template>
  <span class="rating-badge" data-testid="rating-label">{{ ratingLabel(rating) }}</span>
</template>

<style scoped>
.rating-badge {
  display: inline-block;
  /* В колонке (шапка рецепта) не растягиваться на всю ширину */
  align-self: flex-start;
  padding: 2px var(--space-2);
  border: 1px solid rgba(31, 35, 40, 0.2);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.6);
}
</style>
