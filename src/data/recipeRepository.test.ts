import { beforeEach, describe, expect, it } from 'vitest'
import type { ValidRecipe } from '../domain/validation'
import { makeIngredient, resetDb } from '../test/factories'
import { db } from './db'
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  resetBought,
  setBought,
  setCooked,
  setRating,
  setServings,
  updateRecipe,
} from './recipeRepository'

const value = (patch: Partial<ValidRecipe> = {}): ValidRecipe => ({
  title: 'Блины',
  baseServings: 2,
  description: 'Смешать.\nЖарить.',
  ingredients: [makeIngredient({ id: 'flour', name: 'Мука' })],
  collectionIds: [],
  ...patch,
})

describe('recipeRepository', () => {
  beforeEach(resetDb)

  it('создаёт рецепт с выбранными порциями, равными базовым', async () => {
    const id = await createRecipe(value({ baseServings: 3 }))
    const recipe = await getRecipe(id)
    expect(recipe).toMatchObject({ title: 'Блины', titleKey: 'блины', baseServings: 3, servings: 3 })
    expect(recipe).toMatchObject({ rating: null, selected: false, hasImage: false })
  })

  it('добавление ингредиента сохраняет отметки у существующих', async () => {
    const id = await createRecipe(value())
    await db.recipes.update(id, { ingredients: [makeIngredient({ id: 'flour', name: 'Мука', bought: true })] })

    // Форма могла быть открыта до отметки: в ней bought=false, но база важнее
    await updateRecipe(
      id,
      value({
        ingredients: [
          makeIngredient({ id: 'flour', name: 'Мука', bought: false }),
          makeIngredient({ id: 'sugar', name: 'Сахар', bought: false }),
        ],
      }),
    )

    const recipe = await getRecipe(id)
    expect(recipe?.ingredients.map((i) => [i.name, i.bought])).toEqual([
      ['Мука', true],
      ['Сахар', false],
    ])
  })

  it('редактирование не меняет выбранные порции, оценку и выбор в покупки', async () => {
    const id = await createRecipe(value())
    await db.recipes.update(id, { servings: 5, rating: 'good', selected: true })
    await updateRecipe(id, value({ title: 'Тонкие блины', baseServings: 4 }))
    expect(await getRecipe(id)).toMatchObject({
      title: 'Тонкие блины',
      baseServings: 4,
      servings: 5,
      rating: 'good',
      selected: true,
    })
  })

  it('сохраняет новый порядок ингредиентов', async () => {
    const eggs = makeIngredient({ id: 'eggs', name: 'Яйца' })
    const flour = makeIngredient({ id: 'flour', name: 'Мука' })
    const id = await createRecipe(value({ ingredients: [flour, eggs] }))
    await updateRecipe(id, value({ ingredients: [eggs, flour] }))
    expect((await getRecipe(id))?.ingredients.map((i) => i.id)).toEqual(['eggs', 'flour'])
  })

  it('удаляет рецепт вместе с картинкой', async () => {
    const id = await createRecipe(value())
    await db.images.put({ id, blob: new Blob(['x']) })
    await deleteRecipe(id)
    expect(await getRecipe(id)).toBeUndefined()
    expect(await db.images.get(id)).toBeUndefined()
  })

  it('setServings ограничивает значение диапазоном 1–99', async () => {
    const id = await createRecipe(value())
    await setServings(id, 0)
    expect((await getRecipe(id))?.servings).toBe(1)
    await setServings(id, 150)
    expect((await getRecipe(id))?.servings).toBe(99)
  })

  describe('отметки «куплено»', () => {
    const twoIngredients = () =>
      value({
        ingredients: [makeIngredient({ id: 'flour', name: 'Мука' }), makeIngredient({ id: 'eggs', name: 'Яйца' })],
      })

    const boughtOf = async (id: string) => (await getRecipe(id))!.ingredients.map((i) => i.bought)

    it('setBought отмечает и снимает отметку только у указанных ингредиентов', async () => {
      const id = await createRecipe(twoIngredients())
      await setBought(id, ['flour'], true)
      expect(await boughtOf(id)).toEqual([true, false])
      await setBought(id, ['flour'], false)
      expect(await boughtOf(id)).toEqual([false, false])
    })

    it('resetBought снимает все отметки рецепта и не трогает другие рецепты', async () => {
      const a = await createRecipe(twoIngredients())
      const b = await createRecipe(twoIngredients())
      await setBought(a, ['flour', 'eggs'], true)
      await setBought(b, ['flour'], true)
      await resetBought(a)
      expect(await boughtOf(a)).toEqual([false, false])
      expect(await boughtOf(b)).toEqual([true, false])
    })

    it('смена порций не меняет отметки', async () => {
      const id = await createRecipe(twoIngredients())
      await setBought(id, ['flour'], true)
      await setServings(id, 6)
      expect(await boughtOf(id)).toEqual([true, false])
    })
  })
})

describe('«Приготовлено»', () => {
  beforeEach(resetDb)

  it('новый рецепт создаётся неприготовленным', async () => {
    const id = await createRecipe(value())
    expect((await getRecipe(id))?.cooked).toBe(false)
  })

  it('setCooked отмечает и снимает отметку', async () => {
    const id = await createRecipe(value())
    await setCooked(id, true)
    expect((await getRecipe(id))?.cooked).toBe(true)
    await setCooked(id, false)
    expect((await getRecipe(id))?.cooked).toBe(false)
  })

  it('оценка отмечает рецепт приготовленным, а снятие оценки отметку не снимает', async () => {
    const id = await createRecipe(value())
    await setRating(id, 'good')
    expect(await getRecipe(id)).toMatchObject({ rating: 'good', cooked: true })
    await setRating(id, null)
    expect(await getRecipe(id)).toMatchObject({ rating: null, cooked: true })
  })

  it('редактирование не меняет отметку', async () => {
    const id = await createRecipe(value())
    await setCooked(id, true)
    await updateRecipe(id, value({ title: 'Другое' }))
    expect((await getRecipe(id))?.cooked).toBe(true)
  })
})
