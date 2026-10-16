import { db } from './db'

export async function getImage(recipeId: string): Promise<Blob | undefined> {
  return (await db.images.get(recipeId))?.blob
}

/** Сохраняет картинку рецепта (или удаляет при null) и обновляет флаг hasImage. */
export async function setImage(recipeId: string, blob: Blob | null): Promise<void> {
  await db.transaction('rw', db.recipes, db.images, async () => {
    if (blob) {
      await db.images.put({ id: recipeId, blob })
    } else {
      await db.images.delete(recipeId)
    }
    await db.recipes.update(recipeId, { hasImage: blob !== null })
  })
}
