import { beforeEach, describe, expect, it } from 'vitest'
import { makeRecipe, resetDb } from '../test/factories'
import { db } from './db'
import { getImage, setImage } from './imageRepository'

describe('imageRepository', () => {
  beforeEach(async () => {
    await resetDb()
    await db.recipes.add(makeRecipe({ id: 'r1' }))
  })

  it('сохраняет картинку и выставляет hasImage', async () => {
    await setImage('r1', new Blob(['abc'], { type: 'image/jpeg' }))
    expect((await getImage('r1'))?.size).toBe(3)
    expect((await db.recipes.get('r1'))?.hasImage).toBe(true)
  })

  it('удаляет картинку и снимает hasImage', async () => {
    await setImage('r1', new Blob(['abc']))
    await setImage('r1', null)
    expect(await getImage('r1')).toBeUndefined()
    expect((await db.recipes.get('r1'))?.hasImage).toBe(false)
  })
})
