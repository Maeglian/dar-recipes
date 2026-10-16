import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../data/db'
import { makeIngredient, makeRecipe, resetDb } from '../test/factories'
import { makeTestRouter } from '../test/router'
import RecipeView from './RecipeView.vue'

async function mountRecipe(bought: boolean[]) {
  await db.recipes.add(
    makeRecipe({
      id: 'r1',
      title: 'Блины',
      ingredients: bought.map((b, n) => makeIngredient({ id: `i${n}`, name: `Продукт ${n}`, bought: b })),
    }),
  )
  const router = await makeTestRouter('/recipes/r1')
  const wrapper = mount(RecipeView, { props: { id: 'r1' }, global: { plugins: [router] } })
  await vi.waitFor(() => expect(wrapper.find('h1').exists()).toBe(true))
  return wrapper
}

const resetButton = (w: Awaited<ReturnType<typeof mountRecipe>>) =>
  w.findAll('button').find((b) => b.text() === 'Сбросить отметки')!

describe('RecipeView: отметки', () => {
  beforeEach(resetDb)

  it('«Сбросить отметки» недоступна, если ничего не отмечено', async () => {
    const wrapper = await mountRecipe([false, false])
    expect(resetButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('отметка ингредиента сохраняется и включает «Сбросить отметки»', async () => {
    const wrapper = await mountRecipe([false, false])
    await wrapper.find('[aria-label="Куплено: Продукт 0"]').setValue(true)
    await vi.waitFor(async () => expect((await db.recipes.get('r1'))!.ingredients[0]!.bought).toBe(true))
    await vi.waitFor(() => expect(resetButton(wrapper).attributes('disabled')).toBeUndefined())
    expect(wrapper.find('.ingredient-row').classes()).toContain('is-bought')
  })

  it('«Сбросить отметки» снимает все отметки', async () => {
    const wrapper = await mountRecipe([true, false, true])
    await resetButton(wrapper).trigger('click')
    await flushPromises()
    await vi.waitFor(async () =>
      expect((await db.recipes.get('r1'))!.ingredients.every((i) => !i.bought)).toBe(true),
    )
  })
})

describe('RecipeView: оценка', () => {
  beforeEach(resetDb)

  it.each([
    ['excellent', 'rating-excellent', 'Отлично'],
    ['good', 'rating-good', 'Хорошо'],
    ['sometimes', 'rating-sometimes', 'Иногда можно попробовать'],
    ['bad', 'rating-bad', 'Плохо'],
  ] as const)('оценка %s — класс %s и подпись «%s»', async (rating, cls, label) => {
    await db.recipes.add(makeRecipe({ id: 'r1', rating }))
    const router = await makeTestRouter('/recipes/r1')
    const wrapper = mount(RecipeView, { props: { id: 'r1' }, global: { plugins: [router] } })
    await vi.waitFor(() => expect(wrapper.find('h1').exists()).toBe(true))
    expect(wrapper.find('[data-testid="recipe-header"]').classes()).toContain(cls)
    expect(wrapper.find('[data-testid="rating-label"]').text()).toBe(label)
  })

  it('без оценки — обычный фон и без подписи', async () => {
    await db.recipes.add(makeRecipe({ id: 'r1', rating: null }))
    const router = await makeTestRouter('/recipes/r1')
    const wrapper = mount(RecipeView, { props: { id: 'r1' }, global: { plugins: [router] } })
    await vi.waitFor(() => expect(wrapper.find('h1').exists()).toBe(true))
    expect(wrapper.find('[data-testid="recipe-header"]').classes().some((c) => c.startsWith('rating-'))).toBe(false)
    expect(wrapper.find('[data-testid="rating-label"]').exists()).toBe(false)
  })

  it('выбор оценки сохраняется', async () => {
    await db.recipes.add(makeRecipe({ id: 'r1' }))
    const router = await makeTestRouter('/recipes/r1')
    const wrapper = mount(RecipeView, { props: { id: 'r1' }, global: { plugins: [router] } })
    await vi.waitFor(() => expect(wrapper.find('h1').exists()).toBe(true))
    await wrapper.findAll('button').find((b) => b.text() === 'Отлично')!.trigger('click')
    await vi.waitFor(async () => expect((await db.recipes.get('r1'))?.rating).toBe('excellent'))
  })
})

describe('RecipeView: «Приготовлено»', () => {
  beforeEach(resetDb)

  async function mountWith(cooked: boolean) {
    await db.recipes.add(makeRecipe({ id: 'r1', cooked }))
    const router = await makeTestRouter('/recipes/r1')
    const wrapper = mount(RecipeView, { props: { id: 'r1' }, global: { plugins: [router] } })
    await vi.waitFor(() => expect(wrapper.find('h1').exists()).toBe(true))
    return wrapper
  }

  it('неприготовленный рецепт показывает плашку «Новое», отметка её убирает', async () => {
    const wrapper = await mountWith(false)
    expect(wrapper.find('[data-testid="new-badge"]').exists()).toBe(true)
    await wrapper.find('[data-testid="cooked"]').setValue(true)
    await vi.waitFor(async () => expect((await db.recipes.get('r1'))?.cooked).toBe(true))
    await vi.waitFor(() => expect(wrapper.find('[data-testid="new-badge"]').exists()).toBe(false))
  })

  it('снятие отметки возвращает плашку «Новое»', async () => {
    const wrapper = await mountWith(true)
    expect(wrapper.find('[data-testid="new-badge"]').exists()).toBe(false)
    await wrapper.find('[data-testid="cooked"]').setValue(false)
    await vi.waitFor(() => expect(wrapper.find('[data-testid="new-badge"]').exists()).toBe(true))
  })
})
