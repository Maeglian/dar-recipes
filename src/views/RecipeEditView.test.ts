import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { RouterView } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../data/db'
import { makeIngredient, makeRecipe, resetDb } from '../test/factories'
import { makeTestRouter } from '../test/router'
import RecipeEditView from './RecipeEditView.vue'

async function mountForm(id?: string) {
  const router = await makeTestRouter(id ? `/recipes/${id}/edit` : '/recipes/new')
  const wrapper = mount(RecipeEditView, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('RecipeEditView', () => {
  beforeEach(resetDb)

  it('не сохраняет рецепт с пустым названием и показывает ошибку у поля', async () => {
    const { wrapper } = await mountForm()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('#title').classes()).toContain('has-error')
    expect(wrapper.text()).toContain('Введите название')
    expect(await db.recipes.count()).toBe(0)
  })

  it('показывает ошибку у некорректного количества', async () => {
    const { wrapper } = await mountForm()
    await wrapper.find('#title').setValue('Блины')
    await wrapper.find('[aria-label="Название ингредиента"]').setValue('Мука')
    await wrapper.find('[aria-label="Количество"]').setValue('0')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[aria-label="Количество"]').classes()).toContain('has-error')
    expect(await db.recipes.count()).toBe(0)
  })

  it('создаёт рецепт и переходит на его экран', async () => {
    const { wrapper, router } = await mountForm()
    await wrapper.find('#title').setValue('Блины')
    await wrapper.find('[aria-label="Название ингредиента"]').setValue('Мука')
    await wrapper.find('[aria-label="Количество"]').setValue('200')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('recipe'))
    const [recipe] = await db.recipes.toArray()
    expect(recipe).toMatchObject({ title: 'Блины', baseServings: 2 })
    expect(recipe!.ingredients[0]).toMatchObject({ name: 'Мука', amount: 200, unit: 'g' })
    expect(router.currentRoute.value.params.id).toBe(recipe!.id)
  })

  it('загружает существующий рецепт с десятичной запятой', async () => {
    await db.recipes.add(
      makeRecipe({ id: 'r1', title: 'Блины', ingredients: [makeIngredient({ name: 'Молоко', amount: 1.5, unit: 'l' })] }),
    )
    const { wrapper } = await mountForm('r1')
    expect((wrapper.find('#title').element as HTMLInputElement).value).toBe('Блины')
    expect((wrapper.find('[aria-label="Количество"]').element as HTMLInputElement).value).toBe('1,5')
  })

  it('кнопки «вверх» и «вниз» меняют порядок ингредиентов', async () => {
    await db.recipes.add(
      makeRecipe({
        id: 'r1',
        ingredients: [makeIngredient({ id: 'a', name: 'Мука' }), makeIngredient({ id: 'b', name: 'Яйца' })],
      }),
    )
    const { wrapper } = await mountForm('r1')
    await wrapper.find('[data-testid="ingredient-1"] [aria-label="Выше"]').trigger('click')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(async () =>
      expect((await db.recipes.get('r1'))!.ingredients.map((i) => i.name)).toEqual(['Яйца', 'Мука']),
    )
    expect((await db.recipes.get('r1'))!.ingredients.map((i) => i.name)).toEqual(['Яйца', 'Мука'])
  })

  describe('несохранённые изменения', () => {
    // Хук onBeforeRouteLeave работает только у компонента, отрисованного через RouterView
    async function mountRoute(path = '/recipes/new') {
      const router = await makeTestRouter(path)
      const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [router] } })
      await vi.waitFor(() => expect(wrapper.find('#title').exists()).toBe(true))
      return { wrapper, router }
    }

    afterEach(() => vi.unstubAllGlobals())

    it('уход с изменённой формы спрашивает подтверждение и при отказе остаётся на месте', async () => {
      const confirm = vi.fn(() => false)
      vi.stubGlobal('confirm', confirm)
      const { wrapper, router } = await mountRoute()
      await wrapper.find('#title').setValue('Блины')
      await router.push('/shopping')
      expect(confirm).toHaveBeenCalled()
      expect(router.currentRoute.value.name).toBe('recipe-new')
    })

    it('при согласии уходит без сохранения', async () => {
      vi.stubGlobal('confirm', vi.fn(() => true))
      const { wrapper, router } = await mountRoute()
      await wrapper.find('#title').setValue('Блины')
      await router.push('/shopping')
      expect(router.currentRoute.value.name).toBe('shopping')
      expect(await db.recipes.count()).toBe(0)
    })

    it('уход с нетронутой формы не спрашивает подтверждение', async () => {
      const confirm = vi.fn(() => false)
      vi.stubGlobal('confirm', confirm)
      const { router } = await mountRoute()
      await router.push('/shopping')
      expect(confirm).not.toHaveBeenCalled()
      expect(router.currentRoute.value.name).toBe('shopping')
    })

    it('после сохранения подтверждение не спрашивается', async () => {
      const confirm = vi.fn(() => false)
      vi.stubGlobal('confirm', confirm)
      const { wrapper, router } = await mountRoute()
      await wrapper.find('#title').setValue('Блины')
      await wrapper.find('form').trigger('submit')
      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('recipe'))
      expect(confirm).not.toHaveBeenCalled()
    })

    it('кнопки «Назад» и «Сохранить» есть в верхней панели', async () => {
      const { wrapper } = await mountForm()
      expect(wrapper.find('.form-topbar button[type="submit"][form="recipe-form"]').exists()).toBe(true)
      expect(wrapper.find('.form-topbar').text()).toContain('Назад')
    })
  })
})
