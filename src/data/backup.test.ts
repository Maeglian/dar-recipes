import { beforeEach, describe, expect, it } from 'vitest'
import { makeIngredient, makeRecipe, resetDb } from '../test/factories'
import { BackupFormatError, backupFileName, exportData, importData, parseBackup, type BackupData } from './backup'
import { db } from './db'

async function seed() {
  await db.collections.bulkAdd([
    { id: 'c1', name: 'Завтраки', nameKey: 'завтраки' },
    { id: 'c2', name: 'Выпечка', nameKey: 'выпечка' },
  ])
  await db.recipes.bulkAdd([
    makeRecipe({
      id: 'r1',
      title: 'Блины',
      description: 'Смешать.\nЖарить.',
      hasImage: true,
      baseServings: 2,
      servings: 5,
      rating: 'excellent',
      selected: true,
      cooked: true,
      collectionIds: ['c1'],
      ingredients: [
        makeIngredient({ id: 'i1', name: 'Мука', amount: 200, unit: 'g', bought: true }),
        makeIngredient({ id: 'i2', name: 'Укроп', amount: 1, unit: 'custom', customUnit: 'пучок' }),
        makeIngredient({ id: 'i3', name: 'Соль', amount: null, unit: null }),
      ],
      createdAt: 1,
      updatedAt: 2,
    }),
    makeRecipe({ id: 'r2', title: 'Пирог', collectionIds: ['c1', 'c2'] }),
  ])
  await db.manualItems.add({
    id: 'm1',
    name: 'Хлеб',
    amount: null,
    unit: null,
    customUnit: null,
    bought: true,
    createdAt: 3,
  })
  await db.images.add({ id: 'r1', blob: new Blob([new Uint8Array([0xff, 0xd8, 0, 1, 2, 250])], { type: 'image/jpeg' }) })
}

async function snapshot() {
  const images = await db.images.toArray()
  return {
    recipes: await db.recipes.orderBy('id').toArray(),
    collections: await db.collections.orderBy('id').toArray(),
    manualItems: await db.manualItems.toArray(),
    images: await Promise.all(
      images.map(async (i) => ({ id: i.id, type: i.blob.type, bytes: [...new Uint8Array(await i.blob.arrayBuffer())] })),
    ),
  }
}

describe('экспорт', () => {
  beforeEach(resetDb)

  it('содержит все рецепты, коллекции, ручные пункты и картинки', async () => {
    await seed()
    const file = await exportData(new Date('2026-10-16T12:00:00Z'))
    expect(file).toMatchObject({ app: 'recipes', version: 2, exportedAt: '2026-10-16T12:00:00.000Z' })
    expect(file.recipes.map((r) => r.id).sort()).toEqual(['r1', 'r2'])
    expect(file.collections).toHaveLength(2)
    expect(file.manualItems.map((m) => m.name)).toEqual(['Хлеб'])
    expect(file.images).toEqual([{ id: 'r1', type: 'image/jpeg', data: btoa(String.fromCharCode(0xff, 0xd8, 0, 1, 2, 250)) }])
  })

  it('имя файла с датой', () => {
    expect(backupFileName(new Date(2026, 9, 16))).toBe('recipes-backup-2026-10-16.json')
  })
})

describe('импорт', () => {
  beforeEach(resetDb)

  it('экспорт → импорт восстанавливает данные в точности', async () => {
    await seed()
    const before = await snapshot()
    const text = JSON.stringify(await exportData())

    await resetDb()
    await db.recipes.add(makeRecipe({ id: 'other', title: 'Лишний' }))
    await importData(parseBackup(text))

    expect(await snapshot()).toEqual(before)
  })

  it.each([
    ['не JSON', 'hello'],
    ['чужой JSON', JSON.stringify({ foo: 1 })],
    ['другая версия', JSON.stringify({ app: 'recipes', version: 99, recipes: [], collections: [], manualItems: [], images: [] })],
  ])('%s — ошибка формата, данные не меняются', async (_, text) => {
    await seed()
    const before = await snapshot()
    expect(() => parseBackup(text)).toThrow(BackupFormatError)
    expect(await snapshot()).toEqual(before)
  })

  it('повреждённый рецепт внутри файла — ошибка формата', async () => {
    await seed()
    const file = await exportData()
    ;(file.recipes[0] as unknown as Record<string, unknown>).baseServings = 0
    expect(() => parseBackup(JSON.stringify(file))).toThrow(/рецепт/)
  })

  it('повреждённая картинка — ошибка формата', async () => {
    await seed()
    const file = await exportData()
    file.images[0]!.data = '%%%не base64%%%'
    expect(() => parseBackup(JSON.stringify(file))).toThrow(BackupFormatError)
  })

  it('ошибка во время записи откатывает транзакцию, данные не меняются', async () => {
    await seed()
    const before = await snapshot()
    const broken: BackupData = {
      recipes: [makeRecipe({ id: 'dup' }), makeRecipe({ id: 'dup' })],
      collections: [],
      manualItems: [],
      images: [],
    }
    await expect(importData(broken)).rejects.toThrow()
    expect(await snapshot()).toEqual(before)
  })

  it('убирает ссылки на несуществующие коллекции и выводит hasImage из картинок', async () => {
    await seed()
    const file = await exportData()
    file.recipes.find((r) => r.id === 'r2')!.collectionIds.push('ghost')
    file.recipes.find((r) => r.id === 'r2')!.hasImage = true
    const data = parseBackup(JSON.stringify(file))
    const r2 = data.recipes.find((r) => r.id === 'r2')!
    expect(r2.collectionIds).toEqual(['c1', 'c2'])
    expect(r2.hasImage).toBe(false)
  })

  it('файл версии 1 без отметки «Приготовлено»: оценённые приготовлены, остальные — в «Новое»', async () => {
    await seed()
    const file = JSON.parse(JSON.stringify(await exportData())) as Record<string, unknown> & { recipes: Record<string, unknown>[] }
    file.version = 1
    for (const r of file.recipes) delete r.cooked
    const data = parseBackup(JSON.stringify(file))
    const cooked = Object.fromEntries(data.recipes.map((r) => [r.id, r.cooked]))
    expect(cooked).toEqual({ r1: true, r2: false })
  })

  it('файл версии 2 без поля cooked — ошибка формата', async () => {
    await seed()
    const file = JSON.parse(JSON.stringify(await exportData())) as { recipes: Record<string, unknown>[] }
    delete file.recipes[0]!.cooked
    expect(() => parseBackup(JSON.stringify(file))).toThrow(BackupFormatError)
  })
})
