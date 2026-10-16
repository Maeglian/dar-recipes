<script setup lang="ts">
import { useRouter, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(defineProps<{ fallback?: RouteLocationRaw }>(), { fallback: () => ({ name: 'catalog' }) })
const router = useRouter()

function back() {
  // vue-router кладёт в history.state адрес предыдущей записи; null — экран открыт напрямую (ссылка, запуск PWA)
  if (window.history.state?.back) router.back()
  else void router.replace(props.fallback)
}
</script>

<template>
  <button type="button" class="btn back-button" @click="back">
    <span aria-hidden="true">←</span>
    Назад
  </button>
</template>

<style scoped>
.back-button {
  margin-bottom: var(--space-3);
  padding: 0 var(--space-3);
  border-color: transparent;
  background: transparent;
}
</style>
