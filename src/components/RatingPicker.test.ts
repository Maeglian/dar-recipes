import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RatingPicker from './RatingPicker.vue'

const button = (w: ReturnType<typeof mount>, label: string) => w.findAll('button').find((b) => b.text() === label)!

describe('RatingPicker', () => {
  it('выбор оценки', async () => {
    const wrapper = mount(RatingPicker, { props: { modelValue: null } })
    await button(wrapper, 'Хорошо').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['good']])
  })

  it('нажатая оценка сразу закрашивается своим цветом, не дожидаясь нового значения', async () => {
    const wrapper = mount(RatingPicker, { props: { modelValue: null } })
    await button(wrapper, 'Отлично').trigger('click')
    expect(button(wrapper, 'Отлично').classes()).toEqual(expect.arrayContaining(['rating-excellent', 'is-current']))
    expect(button(wrapper, 'Хорошо').classes()).not.toContain('rating-good')
  })

  it('невыбранные оценки не закрашены', () => {
    const wrapper = mount(RatingPicker, { props: { modelValue: 'bad' } })
    expect(wrapper.findAll('button').filter((b) => b.classes().some((c) => /^rating-(excellent|good|sometimes|bad)$/.test(c)))).toHaveLength(1)
  })

  it('повторное нажатие на текущую оценку снимает её', async () => {
    const wrapper = mount(RatingPicker, { props: { modelValue: 'good' } })
    await wrapper.find('[aria-pressed="true"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
    expect(wrapper.find('[aria-pressed="true"]').exists()).toBe(false)
  })

  it('новое значение снаружи обновляет выбор', async () => {
    const wrapper = mount(RatingPicker, { props: { modelValue: 'good' } })
    await wrapper.setProps({ modelValue: 'sometimes' })
    expect(wrapper.find('[aria-pressed="true"]').text()).toBe('Иногда можно попробовать')
  })
})
