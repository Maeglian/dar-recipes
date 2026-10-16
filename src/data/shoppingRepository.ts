import type { ShoppingSource } from '../domain/shopping-list'
import { db } from './db'

/**
 * Отметка строки списка покупок: ставит одно значение «куплено» всем её источникам —
 * ингредиентам разных рецептов и ручным пунктам — в одной транзакции.
 */
export async function setSourcesBought(sources: ShoppingSource[], value: boolean): Promise<void> {
  const byRecipe = new Map<string, Set<string>>()
  const manualIds: string[] = []
  for (const s of sources) {
    if (s.kind === 'manual') {
      manualIds.push(s.id)
    } else {
      const set = byRecipe.get(s.recipeId) ?? new Set<string>()
      set.add(s.ingredientId)
      byRecipe.set(s.recipeId, set)
    }
  }

  await db.transaction('rw', db.recipes, db.manualItems, async () => {
    for (const [recipeId, ids] of byRecipe) {
      await db.recipes
        .where('id')
        .equals(recipeId)
        .modify((recipe) => {
          recipe.ingredients = recipe.ingredients.map((i) => (ids.has(i.id) ? { ...i, bought: value } : i))
        })
    }
    if (manualIds.length > 0) {
      await db.manualItems.where('id').anyOf(manualIds).modify({ bought: value })
    }
  })
}
