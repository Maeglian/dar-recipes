import { computed } from 'vue'
import { db } from '../data/db'
import type { Recipe } from '../domain/types'
import { useLiveQuery } from './useLiveQuery'

export function useRecipe(id: () => string) {
  const { data, loading } = useLiveQuery<Recipe | undefined>(() => db.recipes.get(id()), undefined, id)
  const notFound = computed(() => !loading.value && !data.value)
  return { recipe: data, loading, notFound }
}

export function useRecipeImage(id: () => string) {
  const { data } = useLiveQuery<Blob | undefined>(async () => (await db.images.get(id()))?.blob, undefined, id)
  return data
}
