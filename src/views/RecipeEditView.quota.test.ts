import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { makeTestRouter } from '../test/router'

vi.mock('../data/recipeRepository', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../data/recipeRepository')>()),
  createRecipe: vi.fn(() => Promise.reject(Object.assign(new Error('quota'), { name: 'QuotaExceededError' }))),
}))

describe('RecipeEditView: нехватка места', () => {
  it('показывает понятное сообщение при QuotaExceededError', async () => {
    const { default: RecipeEditView } = await import('./RecipeEditView.vue')
    const router = await makeTestRouter('/recipes/new')
    const wrapper = mount(RecipeEditView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.find('#title').setValue('Блины')
    await wrapper.find('form').trigger('submit')
    await vi.waitFor(() => expect(wrapper.text()).toContain('закончилось место'))
    expect(router.currentRoute.value.name).toBe('recipe-new')
  })
})
