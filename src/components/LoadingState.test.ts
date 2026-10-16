import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { dbDiagnostics } from '../data/diagnostics'
import LoadingState from './LoadingState.vue'

describe('LoadingState', () => {
  afterEach(() => vi.useRealTimers())

  it('сначала показывает «Загрузка…», через 5 секунд — диагностику с незавершённой транзакцией', async () => {
    vi.useFakeTimers()
    dbDiagnostics.activeTxs = [{ id: 7, mode: 'readwrite', stores: ['recipes'], startedAt: Date.now() }]
    const wrapper = mount(LoadingState)
    expect(wrapper.text()).toBe('Загрузка…')
    await vi.advanceTimersByTimeAsync(6000)
    expect(wrapper.find('[data-testid="slow-loading"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('#7 readwrite [recipes]')
    dbDiagnostics.activeTxs = []
  })
})
