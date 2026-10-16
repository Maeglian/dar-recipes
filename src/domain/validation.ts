import type { Ingredient, UnitKey } from './types'

export const MAX_SERVINGS = 99

/** Состояние формы: всё, что вводится руками, хранится строками до валидации. */
export interface IngredientDraft {
  id: string
  name: string
  amount: string
  unit: UnitKey
  customUnit: string
  bought: boolean
}

export interface RecipeDraft {
  title: string
  baseServings: string
  description: string
  ingredients: IngredientDraft[]
  collectionIds: string[]
}

export interface IngredientErrors {
  name?: string
  amount?: string
  customUnit?: string
}

export interface RecipeErrors {
  title?: string
  baseServings?: string
  ingredients: Record<string, IngredientErrors>
}

export interface ValidRecipe {
  title: string
  baseServings: number
  description: string
  ingredients: Ingredient[]
  collectionIds: string[]
}

export type ValidationResult = { ok: true; value: ValidRecipe } | { ok: false; errors: RecipeErrors }

const AMOUNT_RE = /^(\d+([.,]\d*)?|[.,]\d+)$/

/** Разбирает количество с точкой или запятой. '' → null («по вкусу»), некорректное → NaN. */
export function parseAmount(input: string): number | null {
  const value = input.trim()
  if (value === '') return null
  if (!AMOUNT_RE.test(value)) return Number.NaN
  return Number(value.replace(',', '.'))
}

export function parseServings(input: string): number | null {
  const value = input.trim()
  if (!/^\d+$/.test(value)) return null
  const n = Number(value)
  return n >= 1 && n <= MAX_SERVINGS ? n : null
}

function isBlank(row: IngredientDraft): boolean {
  return row.name.trim() === '' && row.amount.trim() === ''
}

export function validateRecipe(draft: RecipeDraft): ValidationResult {
  const errors: RecipeErrors = { ingredients: {} }
  let hasErrors = false

  const title = draft.title.trim()
  if (title === '') {
    errors.title = 'Введите название'
    hasErrors = true
  }

  const baseServings = parseServings(draft.baseServings)
  if (baseServings === null) {
    errors.baseServings = `Целое число от 1 до ${MAX_SERVINGS}`
    hasErrors = true
  }

  const ingredients: Ingredient[] = []
  // Полностью пустые строки — это недозаполненная форма, а не ингредиенты: молча пропускаем
  for (const row of draft.ingredients.filter((r) => !isBlank(r))) {
    const rowErrors: IngredientErrors = {}
    const name = row.name.trim()
    if (name === '') rowErrors.name = 'Введите название'

    const amount = parseAmount(row.amount)
    if (amount !== null && !(amount > 0 && Number.isFinite(amount))) {
      rowErrors.amount = 'Положительное число'
    }

    const customUnit = row.customUnit.trim()
    if (amount !== null && row.unit === 'custom' && customUnit === '') {
      rowErrors.customUnit = 'Введите единицу'
    }

    if (Object.keys(rowErrors).length > 0) {
      errors.ingredients[row.id] = rowErrors
      hasErrors = true
      continue
    }

    const toTaste = amount === null
    ingredients.push({
      id: row.id,
      name,
      amount,
      unit: toTaste ? null : row.unit,
      customUnit: !toTaste && row.unit === 'custom' ? customUnit : null,
      bought: row.bought,
    })
  }

  if (hasErrors) return { ok: false, errors }
  return {
    ok: true,
    value: {
      title,
      baseServings: baseServings!,
      description: draft.description.replace(/\s+$/, ''),
      ingredients,
      collectionIds: [...draft.collectionIds],
    },
  }
}

export interface ManualItemDraft {
  name: string
  amount: string
  unit: UnitKey
  customUnit: string
}

export interface ValidManualItem {
  name: string
  amount: number | null
  unit: UnitKey | null
  customUnit: string | null
}

export type ManualItemResult = { ok: true; value: ValidManualItem } | { ok: false; errors: IngredientErrors }

/** Пункт списка покупок: название обязательно, количество и единица — нет. */
export function validateManualItem(draft: ManualItemDraft): ManualItemResult {
  const errors: IngredientErrors = {}
  const name = draft.name.trim()
  if (name === '') errors.name = 'Введите название'

  const amount = parseAmount(draft.amount)
  if (amount !== null && !(amount > 0 && Number.isFinite(amount))) errors.amount = 'Положительное число'

  const customUnit = draft.customUnit.trim()
  if (amount !== null && draft.unit === 'custom' && customUnit === '') errors.customUnit = 'Введите единицу'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  const toTaste = amount === null
  return {
    ok: true,
    value: {
      name,
      amount,
      unit: toTaste ? null : draft.unit,
      customUnit: !toTaste && draft.unit === 'custom' ? customUnit : null,
    },
  }
}
