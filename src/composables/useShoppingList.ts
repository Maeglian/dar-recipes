import { computed } from 'vue'
import { db } from '../data/db'
import { buildShoppingList } from '../domain/shopping-list'
import { compareRu } from '../domain/text'
import type { ManualItem, Recipe } from '../domain/types'
import { useLiveQuery } from './useLiveQuery'

export function useShoppingList() {
  const { data, loading } = useLiveQuery<{ recipes: Recipe[]; manualItems: ManualItem[] }>(
    async () => ({ recipes: await db.recipes.toArray(), manualItems: await db.manualItems.toArray() }),
    { recipes: [], manualItems: [] },
  )

  const rows = computed(() => buildShoppingList(data.value.recipes, data.value.manualItems))
  const selectedRecipes = computed(() =>
    data.value.recipes.filter((r) => r.selected).sort((a, b) => compareRu(a.title, b.title)),
  )
  const hasBoughtManual = computed(() => data.value.manualItems.some((i) => i.bought))

  return { rows, selectedRecipes, hasBoughtManual, loading }
}
