import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { makeTestRouter } from '../test/router'
import BackButton from './BackButton.vue'

describe('BackButton', () => {
  it('без предыдущей записи в истории ведёт в каталог', async () => {
    const router = await makeTestRouter('/recipes/r1')
    const replace = vi.spyOn(router, 'replace')
    const wrapper = mount(BackButton, { global: { plugins: [router] } })
    await wrapper.trigger('click')
    expect(replace).toHaveBeenCalledWith({ name: 'catalog' })
  })

  it('при наличии предыдущей записи возвращает назад', async () => {
    const router = await makeTestRouter('/recipes/r1')
    const back = vi.spyOn(router, 'back').mockImplementation(() => {})
    vi.spyOn(window.history, 'state', 'get').mockReturnValue({ back: '/?rating=good' })
    const wrapper = mount(BackButton, { global: { plugins: [router] } })
    await wrapper.trigger('click')
    expect(back).toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
