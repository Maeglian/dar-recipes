import Dexie from 'dexie'
import { normalizeKey } from '../domain/text'
import type { Collection } from '../domain/types'
import { db, newId } from './db'

export class CollectionNameError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CollectionNameError'
  }
}

export function listCollections(): Promise<Collection[]> {
  return db.collections.toArray()
}

function checkName(name: string): { name: string; nameKey: string } {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (trimmed === '') throw new CollectionNameError('Введите название')
  return { name: trimmed, nameKey: normalizeKey(trimmed) }
}

function isDuplicate(err: unknown): boolean {
  if (err instanceof Dexie.ConstraintError || (err as { name?: string })?.name === 'ConstraintError') return true
  // update() оборачивает нарушение уникального индекса в ModifyError
  if (err instanceof Dexie.ModifyError) return err.failures.some(isDuplicate)
  return false
}

const DUPLICATE = 'Коллекция с таким названием уже есть'

export async function createCollection(name: string): Promise<Collection> {
  const collection: Collection = { id: newId(), ...checkName(name) }
  try {
    await db.collections.add(collection)
  } catch (err) {
    if (isDuplicate(err)) throw new CollectionNameError(DUPLICATE)
    throw err
  }
  return collection
}

export async function renameCollection(id: string, name: string): Promise<void> {
  const value = checkName(name)
  try {
    await db.collections.update(id, value)
  } catch (err) {
    if (isDuplicate(err)) throw new CollectionNameError(DUPLICATE)
    throw err
  }
}

/** Удаляет коллекцию и убирает её из всех рецептов; сами рецепты остаются. */
export async function deleteCollection(id: string): Promise<void> {
  await db.transaction('rw', db.collections, db.recipes, async () => {
    await db.recipes
      .where('collectionIds')
      .equals(id)
      .modify((recipe) => {
        recipe.collectionIds = recipe.collectionIds.filter((c) => c !== id)
      })
    await db.collections.delete(id)
  })
}
