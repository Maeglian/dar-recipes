<script setup lang="ts">
const items = [
  { to: '/', label: 'Рецепты', icon: '📖', exact: true },
  { to: '/shopping', label: 'Покупки', icon: '🛒', exact: false },
  { to: '/collections', label: 'Коллекции', icon: '🏷️', exact: false },
  { to: '/data', label: 'Данные', icon: '💾', exact: false },
]
</script>

<template>
  <nav class="bottom-nav" aria-label="Основная навигация">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :exact-active-class="item.exact ? 'is-active' : ''"
      :active-class="item.exact ? '' : 'is-active'"
    >
      <span class="bottom-nav__icon" aria-hidden="true">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(var(--nav-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  z-index: 10;
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-decoration: none;
}

.bottom-nav__icon {
  font-size: 20px;
  line-height: 1;
}

.bottom-nav__item.is-active {
  color: var(--color-accent);
  font-weight: 600;
}
</style>
