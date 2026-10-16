import { createRouter, createWebHashHistory } from 'vue-router'
import CatalogView from './views/CatalogView.vue'

// Hash-история: GitHub Pages не умеет отдавать index.html для произвольных путей
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'catalog', component: CatalogView },
    { path: '/recipes/new', name: 'recipe-new', component: () => import('./views/RecipeEditView.vue') },
    { path: '/recipes/:id', name: 'recipe', component: () => import('./views/RecipeView.vue'), props: true },
    {
      path: '/recipes/:id/edit',
      name: 'recipe-edit',
      component: () => import('./views/RecipeEditView.vue'),
      props: true,
    },
    { path: '/shopping', name: 'shopping', component: () => import('./views/ShoppingListView.vue') },
    { path: '/collections', name: 'collections', component: () => import('./views/CollectionsView.vue') },
    { path: '/data', name: 'data', component: () => import('./views/DataView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
