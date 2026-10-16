import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { db } from '../data/db'
import { makeRecipe, resetDb } from '../test/factories'
import { useLiveQuery } from './useLiveQuery'

function waitFor(check: () => boolean, timeout = 1000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (check()) return resolve()
      if (Date.now() - start > timeout) return reject(new Error('timeout'))
      setTimeout(tick, 5)
    }
    tick()
  })
}

describe('useLiveQuery', () => {
  let scope = effectScope()
  beforeEach(async () => {
    scope = effectScope()
    await resetDb()
  })
  afterEach(() => scope.stop())

  it('обновляет результат после записи в базу', async () => {
    const { data, loading } = scope.run(() => useLiveQuery(() => db.recipes.count(), -1))!
    await waitFor(() => !loading.value)
    expect(data.value).toBe(0)

    await db.recipes.add(makeRecipe())
    await waitFor(() => data.value === 1)
    expect(data.value).toBe(1)
  })

  it('пересоздаёт запрос при изменении зависимостей', async () => {
    await db.recipes.bulkAdd([makeRecipe({ id: 'a', title: 'А' }), makeRecipe({ id: 'b', title: 'Б' })])
    const id = ref('a')
    const { data } = scope.run(() => useLiveQuery(() => db.recipes.get(id.value), undefined, id))!
    await waitFor(() => data.value?.id === 'a')

    id.value = 'b'
    await nextTick()
    await waitFor(() => data.value?.id === 'b')
    expect(data.value?.title).toBe('Б')
  })

  it('отписывается при остановке scope', async () => {
    const local = effectScope()
    const { data, loading } = local.run(() => useLiveQuery(() => db.recipes.count(), -1))!
    await waitFor(() => !loading.value)
    local.stop()

    await db.recipes.add(makeRecipe())
    await new Promise((r) => setTimeout(r, 50))
    expect(data.value).toBe(0)
  })
})
