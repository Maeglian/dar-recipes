import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { RecipesDb } from './db'

describe('миграция базы', () => {
  it('v1 → v2: оценённые рецепты приготовлены, остальные — в «Новое», прочие поля сохраняются', async () => {
    const name = 'migration-test'
    const v1 = new Dexie(name)
    v1.version(1).stores({
      recipes: 'id, titleKey, *collectionIds',
      images: 'id',
      collections: 'id, &nameKey',
      manualItems: 'id, createdAt',
    })
    await v1.table('recipes').bulkAdd([
      { id: 'r1', title: 'Блины', titleKey: 'блины', rating: 'good', collectionIds: [] },
      { id: 'r2', title: 'Пирог', titleKey: 'пирог', rating: null, collectionIds: [] },
    ])
    v1.close()

    const v2 = new RecipesDb(name)
    const recipe = await v2.recipes.get('r1')
    expect(recipe).toMatchObject({ id: 'r1', title: 'Блины', rating: 'good', cooked: true })
    expect((await v2.recipes.get('r2'))?.cooked).toBe(false)
    expect(v2.verno).toBe(2)
    await v2.delete()
  })
})
