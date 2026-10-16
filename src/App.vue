<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <RouterView :key="$route.fullPath" />
  <BottomNav />
</template>
