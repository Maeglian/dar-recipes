<script setup lang="ts">
import type { Rating } from '../domain/types'

defineProps<{ rating: Rating | null }>()
</script>

<template>
  <!-- Градиент от насыщенного оттенка оценки к фону карточки — заглушка перетекает в фон -->
  <div class="placeholder" :class="`placeholder--${rating ?? 'none'}`" aria-hidden="true" data-testid="image-placeholder">
    <span class="placeholder__icon">🍽️</span>
  </div>
</template>

<style scoped>
.placeholder {
  --from: var(--rating-none-deep);
  --to: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, var(--from) 0%, var(--to) 100%);
}

.placeholder--excellent {
  --from: var(--rating-excellent-deep);
  --to: var(--rating-excellent);
}
.placeholder--good {
  --from: var(--rating-good-deep);
  --to: var(--rating-good);
}
.placeholder--sometimes {
  --from: var(--rating-sometimes-deep);
  --to: var(--rating-sometimes);
}
.placeholder--bad {
  --from: var(--rating-bad-deep);
  --to: var(--rating-bad);
}

.placeholder__icon {
  font-size: 1.75em;
  opacity: 0.35;
  filter: grayscale(0.3);
}
</style>
