import { compareRu, normalizeKey } from './text'
import type { Rating, Recipe } from './types'

export type RatingFilter = Rating | 'none' | null

/** Зарезервированный id встроенной коллекции «Новое» (рецепты без отметки «Приготовлено»). У настоящих коллекций id — UUID. */
export const NEW_COLLECTION_ID = 'new'
export const NEW_COLLECTION_NAME = 'Новое'

export function inCollection(recipe: Recipe, collectionId: string): boolean {
  return collectionId === NEW_COLLECTION_ID ? !recipe.cooked : recipe.collectionIds.includes(collectionId)
}

export interface CatalogFilter {
  search: string
  collectionId: string | null
  rating: RatingFilter
}

export const EMPTY_FILTER: CatalogFilter = { search: '', collectionId: null, rating: null }

export function isFilterActive(f: CatalogFilter): boolean {
  return f.search.trim() !== '' || f.collectionId !== null || f.rating !== null
}

/** Рецепты, подходящие под поиск и фильтры одновременно, по алфавиту. */
export function filterCatalog(recipes: Recipe[], f: CatalogFilter): Recipe[] {
  const query = normalizeKey(f.search)
  return recipes
    .filter((r) => query === '' || r.titleKey.includes(query))
    .filter((r) => f.collectionId === null || inCollection(r, f.collectionId))
    .filter((r) => {
      if (f.rating === null) return true
      if (f.rating === 'none') return r.rating === null
      return r.rating === f.rating
    })
    .sort((a, b) => compareRu(a.title, b.title))
}
