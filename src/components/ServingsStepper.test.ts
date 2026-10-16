import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ServingsStepper from './ServingsStepper.vue'

describe('ServingsStepper', () => {
  it('на 1 порции «−» недоступна и ничего не меняет', async () => {
    const wrapper = mount(ServingsStepper, { props: { modelValue: 1, base: 2 } })
    const minus = wrapper.find('[aria-label="Меньше порций"]')
    expect(minus.attributes('disabled')).toBeDefined()
    await minus.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('на 99 порциях «+» недоступна', () => {
    const wrapper = mount(ServingsStepper, { props: { modelValue: 99, base: 2 } })
    expect(wrapper.find('[aria-label="Больше порций"]').attributes('disabled')).toBeDefined()
  })

  it('«+» и «−» сообщают новое значение', async () => {
    const wrapper = mount(ServingsStepper, { props: { modelValue: 2, base: 2 } })
    await wrapper.find('[aria-label="Больше порций"]').trigger('click')
    await wrapper.find('[aria-label="Меньше порций"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[3], [1]])
  })

  it('показывает базовое число порций, если выбрано другое', () => {
    expect(mount(ServingsStepper, { props: { modelValue: 4, base: 2 } }).text()).toContain('в рецепте: 2')
    expect(mount(ServingsStepper, { props: { modelValue: 2, base: 2 } }).text()).not.toContain('в рецепте')
  })
})
