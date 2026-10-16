import { beforeEach, describe, expect, it } from 'vitest'
import { buildShoppingList } from '../domain/shopping-list'
import { makeIngredient, makeRecipe, resetDb } from '../test/factories'
import { db } from './db'
import { addManualItem, deleteBoughtManualItems, deleteManualItem, listManualItems } from './manualItemRepository'
import { setSourcesBought } from './shoppingRepository'

async function currentList() {
  return buildShoppingList(await db.recipes.toArray(), await listManualItems())
}

describe('список покупок: запись', () => {
  beforeEach(resetDb)

  it('отметка строки из двух рецептов и ручного пункта отмечает все источники', async () => {
    await db.recipes.bulkAdd([
      makeRecipe({ id: 'a', title: 'Блины', selected: true, ingredients: [makeIngredient({ id: 'a1', name: 'Мука' })] }),
      makeRecipe({ id: 'b', title: 'Пирог', selected: true, ingredients: [makeIngredient({ id: 'b1', name: 'мука' })] }),
    ])
    await addManualItem({ name: 'Мука', amount: 100, unit: 'g', customUnit: null })

    const [row] = await currentList()
    expect(row!.sources).toHaveLength(3)
    await setSourcesBought(row!.sources, true)

    expect((await db.recipes.get('a'))!.ingredients[0]!.bought).toBe(true)
    expect((await db.recipes.get('b'))!.ingredients[0]!.bought).toBe(true)
    expect((await listManualItems())[0]!.bought).toBe(true)

    const after = await currentList()
    expect(after.map((r) => [r.quantity, r.bought])).toEqual([['500 г', true]])

    await setSourcesBought(after[0]!.sources, false)
    expect((await currentList()).map((r) => r.bought)).toEqual([false])
  })

  it('не трогает другие ингредиенты тех же рецептов', async () => {
    await db.recipes.add(
      makeRecipe({
        id: 'a',
        selected: true,
        ingredients: [makeIngredient({ id: 'a1', name: 'Мука' }), makeIngredient({ id: 'a2', name: 'Сахар' })],
      }),
    )
    await setSourcesBought([{ kind: 'recipe', recipeId: 'a', ingredientId: 'a1' }], true)
    expect((await db.recipes.get('a'))!.ingredients.map((i) => i.bought)).toEqual([true, false])
  })

  it('удаление ручного пункта', async () => {
    const id = await addManualItem({ name: 'Хлеб', amount: null, unit: null, customUnit: null })
    await deleteManualItem(id)
    expect(await listManualItems()).toEqual([])
  })

  it('«Очистить купленное» удаляет купленные ручные пункты и не трогает ингредиенты рецептов', async () => {
    await db.recipes.add(
      makeRecipe({ id: 'a', selected: true, ingredients: [makeIngredient({ id: 'a1', name: 'Мука', bought: true })] }),
    )
    const bread = await addManualItem({ name: 'Хлеб', amount: null, unit: null, customUnit: null })
    await addManualItem({ name: 'Сыр', amount: null, unit: null, customUnit: null })
    await setSourcesBought([{ kind: 'manual', id: bread }], true)

    await deleteBoughtManualItems()

    expect((await listManualItems()).map((i) => i.name)).toEqual(['Сыр'])
    expect((await db.recipes.get('a'))!.ingredients[0]!.bought).toBe(true)
    const rows = await currentList()
    expect(rows.map((r) => `${r.bought ? '[x]' : '[ ]'} ${r.name}`)).toEqual(['[ ] Сыр', '[x] Мука'])
  })
})
