import { db } from '../data/db'
import { normalizeKey } from '../domain/text'
import type { Ingredient, Recipe } from '../domain/types'

export async function resetDb(): Promise<void> {
  await db.delete()
  await db.open()
}

let seq = 0

export function makeIngredient(patch: Partial<Ingredient> = {}): Ingredient {
  seq += 1
  return {
    id: `i${seq}`,
    name: 'Мука',
    amount: 200,
    unit: 'g',
    customUnit: null,
    bought: false,
    ...patch,
  }
}

export function makeRecipe(patch: Partial<Recipe> = {}): Recipe {
  seq += 1
  const title = patch.title ?? `Рецепт ${seq}`
  return {
    id: `r${seq}`,
    title,
    titleKey: normalizeKey(title),
    description: '',
    hasImage: false,
    baseServings: 2,
    servings: 2,
    rating: null,
    collectionIds: [],
    selected: false,
    cooked: false,
    ingredients: [],
    createdAt: 0,
    updatedAt: 0,
    ...patch,
  }
}
