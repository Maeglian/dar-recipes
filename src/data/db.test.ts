import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { resetDb, makeRecipe } from '../test/factories'

describe('схема базы', () => {
  beforeEach(resetDb)

  it('открывается с четырьмя таблицами', async () => {
    await db.open()
    expect(db.tables.map((t) => t.name).sort()).toEqual(['collections', 'images', 'manualItems', 'recipes'])
  })

  it('сохраняет рецепт и находит его по коллекции', async () => {
    await db.recipes.add(makeRecipe({ id: 'r1', collectionIds: ['c1', 'c2'] }))
    const found = await db.recipes.where('collectionIds').equals('c2').toArray()
    expect(found.map((r) => r.id)).toEqual(['r1'])
  })

  it('не допускает двух коллекций с одинаковым nameKey', async () => {
    await db.collections.add({ id: 'c1', name: 'Завтраки', nameKey: 'завтраки' })
    await expect(db.collections.add({ id: 'c2', name: 'завтраки', nameKey: 'завтраки' })).rejects.toThrow()
  })

  it('хранит картинку как Blob', async () => {
    await db.images.add({ id: 'r1', blob: new Blob(['x'], { type: 'image/jpeg' }) })
    const img = await db.images.get('r1')
    expect(img?.blob.size).toBe(1)
  })
})
