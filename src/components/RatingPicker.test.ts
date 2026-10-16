import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RatingPicker from './RatingPicker.vue'

describe('RatingPicker', () => {
  it('выбор оценки', async () => {
    const wrapper = mount(RatingPicker, { props: { modelValue: null } })
    await wrapper.findAll('button').find((b) => b.text() === 'Хорошо')!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['good']])
  })

  it('повторное нажатие на текущую оценку снимает её', async () => {
    const wrapper = mount(RatingPicker, { props: { modelValue: 'good' } })
    await wrapper.find('[aria-pressed="true"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})
