import { compareRu, normalizeKey } from './text'
import type { ManualItem, Recipe } from './types'
import { formatBase, scale, toBase } from './units'

export type ShoppingSource = { kind: 'recipe'; recipeId: string; ingredientId: string } | { kind: 'manual'; id: string }

export interface ShoppingRow {
  /** Стабильный ключ строки: имя, семейство единиц и отметка */
  key: string
  name: string
  /** Отформатированная сумма, «по вкусу» или пустая строка для ручного пункта без количества */
  quantity: string
  bought: boolean
  sources: ShoppingSource[]
  /** Откуда строка: названия рецептов по алфавиту и «вручную» в конце */
  sourceLabel: string
}

export const MANUAL_LABEL = 'вручную'

interface Entry {
  name: string
  family: string
  value: number | null
  customLabel: string | null
  bought: boolean
  source: ShoppingSource
  recipeTitle: string | null
}

function collectEntries(recipes: Recipe[], manualItems: ManualItem[]): Entry[] {
  const entries: Entry[] = []
  const selected = recipes.filter((r) => r.selected).sort((a, b) => compareRu(a.title, b.title))
  for (const recipe of selected) {
    for (const ingredient of recipe.ingredients) {
      const base = toBase(ingredient)
      entries.push({
        name: ingredient.name,
        family: base.family,
        value: base.value === null ? null : scale(base.value, recipe.baseServings, recipe.servings),
        customLabel: base.customLabel,
        bought: ingredient.bought,
        source: { kind: 'recipe', recipeId: recipe.id, ingredientId: ingredient.id },
        recipeTitle: recipe.title,
      })
    }
  }
  const manual = [...manualItems].sort((a, b) => a.createdAt - b.createdAt)
  for (const item of manual) {
    const base = toBase(item)
    entries.push({
      name: item.name,
      family: base.family,
      value: base.value,
      customLabel: base.customLabel,
      bought: item.bought,
      source: { kind: 'manual', id: item.id },
      recipeTitle: null,
    })
  }
  return entries
}

function sourceLabel(group: Entry[]): string {
  const titles = [...new Set(group.flatMap((e) => (e.recipeTitle === null ? [] : [e.recipeTitle])))].sort(compareRu)
  if (group.some((e) => e.source.kind === 'manual')) titles.push(MANUAL_LABEL)
  return titles.join(', ')
}

/**
 * Список покупок: ингредиенты выбранных рецептов (с учётом их порций) и пункты, добавленные вручную.
 * Одинаковые по названию пункты с совместимыми единицами складываются; купленные и некупленные
 * собираются в разные строки. Сначала некупленные, затем купленные, внутри — по алфавиту.
 */
export function buildShoppingList(recipes: Recipe[], manualItems: ManualItem[]): ShoppingRow[] {
  const groups = new Map<string, Entry[]>()
  for (const entry of collectEntries(recipes, manualItems)) {
    const key = `${normalizeKey(entry.name)}|${entry.family}|${entry.bought ? 1 : 0}`
    const group = groups.get(key)
    if (group) group.push(entry)
    else groups.set(key, [entry])
  }

  const rows: ShoppingRow[] = []
  for (const [key, group] of groups) {
    const first = group[0]!
    const value = first.value === null ? null : group.reduce((sum, e) => sum + (e.value ?? 0), 0)
    // «по вкусу» — свойство ингредиента рецепта; ручной пункт без количества — это просто «Хлеб»
    const onlyManual = group.every((e) => e.source.kind === 'manual')
    rows.push({
      key,
      name: first.name,
      quantity:
        value === null && onlyManual ? '' : formatBase({ family: first.family, value, customLabel: first.customLabel }),
      bought: first.bought,
      sources: group.map((e) => e.source),
      sourceLabel: sourceLabel(group),
    })
  }

  return rows.sort((a, b) => {
    if (a.bought !== b.bought) return a.bought ? 1 : -1
    return compareRu(a.name, b.name) || a.key.localeCompare(b.key)
  })
}
