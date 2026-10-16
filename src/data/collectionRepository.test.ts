import { beforeEach, describe, expect, it } from 'vitest'
import { makeRecipe, resetDb } from '../test/factories'
import {
  CollectionNameError,
  createCollection,
  deleteCollection,
  listCollections,
  renameCollection,
} from './collectionRepository'
import { db } from './db'

describe('collectionRepository', () => {
  beforeEach(resetDb)

  it('создаёт коллекцию', async () => {
    const c = await createCollection('  Завтраки ')
    expect(c).toMatchObject({ name: 'Завтраки', nameKey: 'завтраки' })
    expect(await listCollections()).toHaveLength(1)
  })

  it('пустое название — ошибка', async () => {
    await expect(createCollection('  ')).rejects.toBeInstanceOf(CollectionNameError)
  })

  it('повтор названия без учёта регистра и пробелов — ошибка при создании', async () => {
    await createCollection('Завтраки')
    await expect(createCollection(' завтраки')).rejects.toThrow('уже есть')
    expect(await listCollections()).toHaveLength(1)
  })

  it('повтор названия — ошибка при переименовании', async () => {
    await createCollection('Завтраки')
    const other = await createCollection('Выпечка')
    await expect(renameCollection(other.id, 'ЗАВТРАКИ')).rejects.toBeInstanceOf(CollectionNameError)
    expect((await db.collections.get(other.id))?.name).toBe('Выпечка')
  })

  it('переименование сохраняет состав коллекции', async () => {
    const c = await createCollection('Завтраки')
    await db.recipes.add(makeRecipe({ id: 'r1', collectionIds: [c.id] }))
    await renameCollection(c.id, 'Утро')
    expect((await db.collections.get(c.id))?.name).toBe('Утро')
    expect((await db.recipes.where('collectionIds').equals(c.id).toArray()).map((r) => r.id)).toEqual(['r1'])
  })

  it('удаление коллекции убирает её из рецептов, но не удаляет рецепты', async () => {
    const baking = await createCollection('Выпечка')
    const quick = await createCollection('Быстрое')
    await db.recipes.bulkAdd([
      makeRecipe({ id: 'r1', collectionIds: [baking.id, quick.id] }),
      makeRecipe({ id: 'r2', collectionIds: [baking.id] }),
    ])
    await deleteCollection(baking.id)

    expect(await db.collections.get(baking.id)).toBeUndefined()
    expect(await db.recipes.count()).toBe(2)
    expect((await db.recipes.get('r1'))?.collectionIds).toEqual([quick.id])
    expect((await db.recipes.get('r2'))?.collectionIds).toEqual([])
  })
})
