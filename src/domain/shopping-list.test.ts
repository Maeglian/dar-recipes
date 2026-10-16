import { describe, expect, it } from 'vitest'
import { makeIngredient, makeRecipe } from '../test/factories'
import { buildShoppingList } from './shopping-list'
import type { Ingredient, ManualItem } from './types'

const ing = (name: string, amount: number | null, unit: Ingredient['unit'], patch: Partial<Ingredient> = {}) =>
  makeIngredient({ name, amount, unit, customUnit: null, ...patch })

let manualSeq = 0
const manual = (name: string, amount: number | null = null, unit: ManualItem['unit'] = null, patch: Partial<ManualItem> = {}): ManualItem => ({
  id: `m${++manualSeq}`,
  name,
  amount,
  unit,
  customUnit: null,
  bought: false,
  createdAt: manualSeq,
  ...patch,
})

const view = (rows: ReturnType<typeof buildShoppingList>) => rows.map((r) => `${r.name} — ${r.quantity}`)

describe('состав списка покупок', () => {
  it('берёт только выбранные рецепты, с учётом их порций', () => {
    const rows = buildShoppingList(
      [
        makeRecipe({ title: 'Блины', selected: true, baseServings: 2, servings: 4, ingredients: [ing('Мука', 200, 'g')] }),
        makeRecipe({ title: 'Пирог', selected: false, ingredients: [ing('Сахар', 100, 'g')] }),
      ],
      [],
    )
    expect(view(rows)).toEqual(['Мука — 400 г'])
  })

  it('пустой, если ничего не выбрано и нет ручных пунктов', () => {
    expect(buildShoppingList([makeRecipe({ ingredients: [ing('Мука', 1, 'g')] })], [])).toEqual([])
  })
})

describe('сложение одинаковых продуктов', () => {
  it('граммы и килограммы: 400 г + 1 кг → 1,4 кг', () => {
    const rows = buildShoppingList(
      [
        makeRecipe({ title: 'Блины', selected: true, ingredients: [ing('Мука', 400, 'g')] }),
        makeRecipe({ title: 'Пирог', selected: true, ingredients: [ing('мука', 1, 'kg')] }),
      ],
      [],
    )
    expect(view(rows)).toEqual(['Мука — 1,4 кг'])
  })

  it('несовместимые единицы — отдельные строки', () => {
    const rows = buildShoppingList(
      [makeRecipe({ selected: true, ingredients: [ing('Яблоки', 3, 'pcs'), ing('Яблоки', 500, 'g')] })],
      [],
    )
    expect(view(rows).sort()).toEqual(['Яблоки — 3 шт', 'Яблоки — 500 г'])
  })

  it('разные названия не складываются', () => {
    const rows = buildShoppingList(
      [makeRecipe({ selected: true, ingredients: [ing('Мука', 200, 'g'), ing('Мука пшеничная', 300, 'g')] })],
      [],
    )
    expect(rows).toHaveLength(2)
  })

  it('«по вкусу» из двух рецептов — одна строка', () => {
    const rows = buildShoppingList(
      [
        makeRecipe({ title: 'А', selected: true, ingredients: [ing('Соль', null, null)] }),
        makeRecipe({ title: 'Б', selected: true, ingredients: [ing(' соль ', null, null)] }),
      ],
      [],
    )
    expect(view(rows)).toEqual(['Соль — по вкусу'])
  })

  it('ложки разного размера не складываются, одинаковые — складываются', () => {
    const rows = buildShoppingList(
      [makeRecipe({ selected: true, ingredients: [ing('Сахар', 1, 'tbsp'), ing('Сахар', 0.5, 'tbsp'), ing('Сахар', 1, 'tsp')] })],
      [],
    )
    expect(view(rows).sort()).toEqual(['Сахар — 1 ч.л.', 'Сахар — 1½ ст.л.'])
  })

  it('свои единицы складываются по названию единицы', () => {
    const rows = buildShoppingList(
      [
        makeRecipe({
          selected: true,
          ingredients: [
            ing('Укроп', 1, 'custom', { customUnit: 'пучок' }),
            ing('Укроп', 2, 'custom', { customUnit: 'Пучок' }),
            ing('Укроп', 1, 'custom', { customUnit: 'ветка' }),
          ],
        }),
      ],
      [],
    )
    expect(view(rows).sort()).toEqual(['Укроп — 1 ветка', 'Укроп — 3 пучок'])
  })

  it('сумма округляется один раз: 2 × 1/3 шт → 1 шт', () => {
    // каждая по отдельности округлилась бы до 0,5 шт, сумма 2/3 → 0,5; проверяем, что суммируются исходные значения
    const rows = buildShoppingList(
      [
        makeRecipe({ title: 'А', selected: true, baseServings: 3, servings: 1, ingredients: [ing('Яйца', 1, 'pcs')] }),
        makeRecipe({ title: 'Б', selected: true, baseServings: 3, servings: 2, ingredients: [ing('Яйца', 1, 'pcs')] }),
      ],
      [],
    )
    expect(view(rows)).toEqual(['Яйца — 1 шт'])
  })
})

describe('источники', () => {
  it('строка из двух рецептов показывает оба названия по алфавиту', () => {
    const rows = buildShoppingList(
      [
        makeRecipe({ title: 'Пирог', selected: true, ingredients: [ing('Мука', 300, 'g')] }),
        makeRecipe({ title: 'Блины', selected: true, ingredients: [ing('Мука', 200, 'g')] }),
      ],
      [],
    )
    expect(rows[0]!.sourceLabel).toBe('Блины, Пирог')
    expect(rows[0]!.sources).toHaveLength(2)
  })

  it('отображаемое название — из первого источника', () => {
    const rows = buildShoppingList(
      [makeRecipe({ title: 'Блины', selected: true, ingredients: [ing('Молоко', 1, 'l')] })],
      [manual('молоко', 500, 'ml')],
    )
    expect(view(rows)).toEqual(['Молоко — 1,5 л'])
    expect(rows[0]!.sourceLabel).toBe('Блины, вручную')
  })
})

describe('отметки', () => {
  it('частично купленный продукт — две строки: некупленная и купленная', () => {
    const rows = buildShoppingList(
      [
        makeRecipe({ title: 'Блины', selected: true, ingredients: [ing('Мука', 200, 'g', { bought: true })] }),
        makeRecipe({ title: 'Пирог', selected: true, ingredients: [ing('Мука', 300, 'g')] }),
      ],
      [],
    )
    expect(rows.map((r) => [r.name, r.quantity, r.bought, r.sourceLabel])).toEqual([
      ['Мука', '300 г', false, 'Пирог'],
      ['Мука', '200 г', true, 'Блины'],
    ])
  })

  it('некупленные сверху по алфавиту, купленные снизу по алфавиту', () => {
    const rows = buildShoppingList(
      [
        makeRecipe({
          selected: true,
          ingredients: [
            ing('Яйца', 2, 'pcs', { bought: true }),
            ing('Молоко', 1, 'l'),
            ing('Сахар', 50, 'g', { bought: true }),
            ing('Яблоки', 3, 'pcs'),
          ],
        }),
      ],
      [manual('Хлеб'), manual('Банан', null, null, { bought: true })],
    )
    expect(rows.map((r) => `${r.bought ? '[x]' : '[ ]'} ${r.name}`)).toEqual([
      '[ ] Молоко',
      '[ ] Хлеб',
      '[ ] Яблоки',
      '[x] Банан',
      '[x] Сахар',
      '[x] Яйца',
    ])
  })
})

describe('пункты, добавленные вручную', () => {
  it('пункт без количества', () => {
    const rows = buildShoppingList([], [manual('Хлеб')])
    expect(rows.map((r) => [r.name, r.quantity, r.sourceLabel])).toEqual([['Хлеб', '', 'вручную']])
  })

  it('ручной пункт без количества вместе с «по вкусу» из рецепта — «по вкусу»', () => {
    const rows = buildShoppingList(
      [makeRecipe({ title: 'Суп', selected: true, ingredients: [ing('Соль', null, null)] })],
      [manual('соль')],
    )
    expect(rows.map((r) => [r.name, r.quantity, r.sourceLabel])).toEqual([['Соль', 'по вкусу', 'Суп, вручную']])
  })
})
