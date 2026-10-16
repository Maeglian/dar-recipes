import type { ManualItem } from '../domain/types'
import type { ValidManualItem } from '../domain/validation'
import { db, newId } from './db'

export function listManualItems(): Promise<ManualItem[]> {
  return db.manualItems.toArray()
}

export async function addManualItem(value: ValidManualItem): Promise<string> {
  const item: ManualItem = { ...value, id: newId(), bought: false, createdAt: Date.now() }
  await db.manualItems.add(item)
  return item.id
}

export async function deleteManualItem(id: string): Promise<void> {
  await db.manualItems.delete(id)
}

/** «Очистить купленное»: удаляет купленные ручные пункты. Ингредиенты рецептов не трогает. */
export async function deleteBoughtManualItems(): Promise<void> {
  await db.manualItems.filter((item) => item.bought).delete()
}
