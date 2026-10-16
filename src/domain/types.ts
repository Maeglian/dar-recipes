export type UnitKey = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'tsp' | 'tbsp' | 'cup' | 'custom'

export type Rating = 'excellent' | 'good' | 'sometimes' | 'bad'

/** Количество и единица. amount === null означает «по вкусу», тогда unit и customUnit тоже null. */
export interface Quantity {
  amount: number | null
  unit: UnitKey | null
  customUnit: string | null
}

export interface Ingredient extends Quantity {
  id: string
  name: string
  bought: boolean
}

export interface Recipe {
  id: string
  title: string
  /** normalizeKey(title) — для поиска и сортировки */
  titleKey: string
  description: string
  hasImage: boolean
  baseServings: number
  servings: number
  rating: Rating | null
  collectionIds: string[]
  selected: boolean
  /** Отметка «Приготовлено»; рецепты без неё составляют встроенную коллекцию «Новое» */
  cooked: boolean
  ingredients: Ingredient[]
  createdAt: number
  updatedAt: number
}

export interface Collection {
  id: string
  name: string
  /** normalizeKey(name) — уникален */
  nameKey: string
}

export interface ManualItem extends Quantity {
  id: string
  name: string
  bought: boolean
  createdAt: number
}

export interface RecipeImage {
  /** Совпадает с id рецепта */
  id: string
  blob: Blob
}
