import { normalizeKey } from '../domain/text'
import type { Rating, Recipe } from '../domain/types'
import { MAX_SERVINGS, type ValidRecipe } from '../domain/validation'
import { db, newId } from './db'

export function getRecipe(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

export function listRecipes(): Promise<Recipe[]> {
  return db.recipes.toArray()
}

export async function createRecipe(value: ValidRecipe): Promise<string> {
  const now = Date.now()
  const recipe: Recipe = {
    ...value,
    id: newId(),
    titleKey: normalizeKey(value.title),
    hasImage: false,
    servings: value.baseServings,
    rating: null,
    selected: false,
    cooked: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.recipes.add(recipe)
  return recipe.id
}

/**
 * Сохраняет отредактированный рецепт. Выбранные порции, оценка и выбор в покупки не меняются.
 * Отметки «куплено» берутся из базы по id ингредиента: их могли поменять, пока открыта форма.
 */
export async function updateRecipe(id: string, value: ValidRecipe): Promise<void> {
  await db.transaction('rw', db.recipes, async () => {
    const current = await db.recipes.get(id)
    if (!current) throw new Error(`Рецепт ${id} не найден`)
    const bought = new Map(current.ingredients.map((i) => [i.id, i.bought]))
    await db.recipes.put({
      ...current,
      title: value.title,
      titleKey: normalizeKey(value.title),
      description: value.description,
      baseServings: value.baseServings,
      collectionIds: value.collectionIds,
      ingredients: value.ingredients.map((i) => ({ ...i, bought: bought.get(i.id) ?? false })),
      updatedAt: Date.now(),
    })
  })
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.transaction('rw', db.recipes, db.images, async () => {
    await db.recipes.delete(id)
    await db.images.delete(id)
  })
}

export async function setServings(id: string, servings: number): Promise<void> {
  const clamped = Math.min(MAX_SERVINGS, Math.max(1, Math.round(servings)))
  await db.recipes.update(id, { servings: clamped })
}

/** Отмечает или снимает отметку «куплено» у указанных ингредиентов рецепта. */
export async function setBought(recipeId: string, ingredientIds: string[], value: boolean): Promise<void> {
  const ids = new Set(ingredientIds)
  await db.recipes
    .where('id')
    .equals(recipeId)
    .modify((recipe) => {
      recipe.ingredients = recipe.ingredients.map((i) => (ids.has(i.id) ? { ...i, bought: value } : i))
    })
}

/** Снимает отметки «куплено» со всех ингредиентов рецепта. */
export async function resetBought(recipeId: string): Promise<void> {
  await db.recipes
    .where('id')
    .equals(recipeId)
    .modify((recipe) => {
      recipe.ingredients = recipe.ingredients.map((i) => ({ ...i, bought: false }))
    })
}

/** Ставит оценку. Оценка означает, что рецепт готовили, поэтому непустая оценка отмечает его приготовленным. */
export async function setRating(id: string, rating: Rating | null): Promise<void> {
  await db.recipes.update(id, rating ? { rating, cooked: true } : { rating })
}

export async function setCooked(id: string, cooked: boolean): Promise<void> {
  await db.recipes.update(id, { cooked })
}

/** Включает рецепт в список покупок или исключает из него. Отметки «куплено» не меняются. */
export async function setSelected(id: string, selected: boolean): Promise<void> {
  await db.recipes.update(id, { selected })
}
