import { normalizeKey } from '../domain/text'
import type { Collection, Ingredient, ManualItem, Rating, Recipe, RecipeImage, UnitKey } from '../domain/types'
import { MAX_SERVINGS } from '../domain/validation'
import { db } from './db'

export const BACKUP_APP = 'recipes'
export const BACKUP_VERSION = 2
/** Версии файла, которые умеет читать импорт. В v1 ещё не было отметки «Приготовлено». */
const SUPPORTED_VERSIONS = new Set([1, 2])

interface BackupImage {
  id: string
  type: string
  data: string
}

export interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  recipes: Recipe[]
  collections: Collection[]
  manualItems: ManualItem[]
  images: BackupImage[]
}

export interface BackupData {
  recipes: Recipe[]
  collections: Collection[]
  manualItems: ManualItem[]
  images: RecipeImage[]
}

export class BackupFormatError extends Error {
  constructor(detail: string) {
    super(`Файл не похож на резервную копию приложения: ${detail}`)
    this.name = 'BackupFormatError'
  }
}

// ---------- Экспорт ----------

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(data: string): Uint8Array {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function exportData(now = new Date()): Promise<BackupFile> {
  return db.transaction('r', db.recipes, db.collections, db.manualItems, db.images, async () => {
    const [recipes, collections, manualItems, images] = await Promise.all([
      db.recipes.toArray(),
      db.collections.toArray(),
      db.manualItems.toArray(),
      db.images.toArray(),
    ])
    const encoded: BackupImage[] = []
    for (const image of images) {
      encoded.push({
        id: image.id,
        type: image.blob.type || 'image/jpeg',
        data: bytesToBase64(new Uint8Array(await image.blob.arrayBuffer())),
      })
    }
    return {
      app: BACKUP_APP,
      version: BACKUP_VERSION,
      exportedAt: now.toISOString(),
      recipes,
      collections,
      manualItems,
      images: encoded,
    }
  })
}

export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `recipes-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

// ---------- Проверка файла ----------

const UNITS = new Set<UnitKey>(['g', 'kg', 'ml', 'l', 'pcs', 'tsp', 'tbsp', 'cup', 'custom'])
const RATINGS = new Set<Rating>(['excellent', 'good', 'sometimes', 'bad'])

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(o: Obj, key: string, where: string, { nonEmpty = false } = {}): string {
  const v = o[key]
  if (typeof v !== 'string' || (nonEmpty && v.trim() === '')) throw new BackupFormatError(`${where}: поле ${key}`)
  return v
}

function bool(o: Obj, key: string, where: string): boolean {
  const v = o[key]
  if (typeof v !== 'boolean') throw new BackupFormatError(`${where}: поле ${key}`)
  return v
}

function num(o: Obj, key: string, where: string): number {
  const v = o[key]
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new BackupFormatError(`${where}: поле ${key}`)
  return v
}

function servings(o: Obj, key: string, where: string): number {
  const v = num(o, key, where)
  if (!Number.isInteger(v) || v < 1 || v > MAX_SERVINGS) throw new BackupFormatError(`${where}: поле ${key}`)
  return v
}

function arr(o: Obj, key: string, where: string): unknown[] {
  const v = o[key]
  if (!Array.isArray(v)) throw new BackupFormatError(`${where}: поле ${key}`)
  return v
}

/** Количество, единица и своя единица — согласованно, как их сохраняет форма. */
function quantity(o: Obj, where: string): Pick<Ingredient, 'amount' | 'unit' | 'customUnit'> {
  const amount = o.amount
  if (amount === null) {
    if (o.unit !== null || o.customUnit !== null) throw new BackupFormatError(`${where}: единица без количества`)
    return { amount: null, unit: null, customUnit: null }
  }
  if (typeof amount !== 'number' || !(amount > 0) || !Number.isFinite(amount)) {
    throw new BackupFormatError(`${where}: поле amount`)
  }
  const unit = o.unit as UnitKey
  if (!UNITS.has(unit)) throw new BackupFormatError(`${where}: поле unit`)
  if (unit === 'custom') {
    const customUnit = str(o, 'customUnit', where, { nonEmpty: true })
    return { amount, unit, customUnit }
  }
  if (o.customUnit !== null) throw new BackupFormatError(`${where}: поле customUnit`)
  return { amount, unit, customUnit: null }
}

function uniqueIds(items: { id: string }[], what: string) {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) throw new BackupFormatError(`${what}: повторяющийся id ${item.id}`)
    seen.add(item.id)
  }
}

function parseCollection(raw: unknown, n: number): Collection {
  const where = `коллекция ${n + 1}`
  if (!isObj(raw)) throw new BackupFormatError(where)
  const name = str(raw, 'name', where, { nonEmpty: true }).trim()
  return { id: str(raw, 'id', where, { nonEmpty: true }), name, nameKey: normalizeKey(name) }
}

function parseIngredient(raw: unknown, where: string): Ingredient {
  if (!isObj(raw)) throw new BackupFormatError(where)
  return {
    id: str(raw, 'id', where, { nonEmpty: true }),
    name: str(raw, 'name', where, { nonEmpty: true }).trim(),
    ...quantity(raw, where),
    bought: bool(raw, 'bought', where),
  }
}

function parseRecipe(
  raw: unknown,
  n: number,
  version: number,
  collectionIds: Set<string>,
  imageIds: Set<string>,
): Recipe {
  const where = `рецепт ${n + 1}`
  if (!isObj(raw)) throw new BackupFormatError(where)
  const id = str(raw, 'id', where, { nonEmpty: true })
  const title = str(raw, 'title', where, { nonEmpty: true }).trim()
  const rating = raw.rating
  if (rating !== null && !RATINGS.has(rating as Rating)) throw new BackupFormatError(`${where}: поле rating`)
  const collections = arr(raw, 'collectionIds', where)
  if (!collections.every((c) => typeof c === 'string')) throw new BackupFormatError(`${where}: поле collectionIds`)
  const ingredients = arr(raw, 'ingredients', where).map((i, k) => parseIngredient(i, `${where}, ингредиент ${k + 1}`))
  uniqueIds(ingredients, `${where}, ингредиенты`)

  return {
    id,
    title,
    titleKey: normalizeKey(title),
    description: str(raw, 'description', where),
    // Флаг картинки выводится из самих картинок файла, чтобы они не разошлись
    hasImage: imageIds.has(id),
    baseServings: servings(raw, 'baseServings', where),
    servings: servings(raw, 'servings', where),
    rating: rating as Rating | null,
    // Ссылки на несуществующие коллекции безвредны, но не нужны
    collectionIds: [...new Set(collections as string[])].filter((c) => collectionIds.has(c)),
    selected: bool(raw, 'selected', where),
    // В файлах v1 отметки не было: оценённые рецепты считаются приготовленными, остальные попадают в «Новое»
    cooked: version >= 2 ? bool(raw, 'cooked', where) : rating !== null,
    ingredients,
    createdAt: num(raw, 'createdAt', where),
    updatedAt: num(raw, 'updatedAt', where),
  }
}

function parseManualItem(raw: unknown, n: number): ManualItem {
  const where = `пункт списка покупок ${n + 1}`
  if (!isObj(raw)) throw new BackupFormatError(where)
  return {
    id: str(raw, 'id', where, { nonEmpty: true }),
    name: str(raw, 'name', where, { nonEmpty: true }).trim(),
    ...quantity(raw, where),
    bought: bool(raw, 'bought', where),
    createdAt: num(raw, 'createdAt', where),
  }
}

function parseImage(raw: unknown, n: number, recipeIds: Set<string>): RecipeImage {
  const where = `картинка ${n + 1}`
  if (!isObj(raw)) throw new BackupFormatError(where)
  const id = str(raw, 'id', where, { nonEmpty: true })
  if (!recipeIds.has(id)) throw new BackupFormatError(`${where}: нет рецепта ${id}`)
  const type = str(raw, 'type', where)
  if (!type.startsWith('image/')) throw new BackupFormatError(`${where}: поле type`)
  let bytes: Uint8Array
  try {
    bytes = base64ToBytes(str(raw, 'data', where))
  } catch {
    throw new BackupFormatError(`${where}: повреждённые данные`)
  }
  return { id, blob: new Blob([bytes as BlobPart], { type }) }
}

/** Полностью разбирает и проверяет файл экспорта. Ничего не пишет в базу. */
export function parseBackup(text: string): BackupData {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new BackupFormatError('это не JSON')
  }
  if (!isObj(json) || json.app !== BACKUP_APP) throw new BackupFormatError('нет отметки приложения')
  const version = json.version
  if (typeof version !== 'number' || !SUPPORTED_VERSIONS.has(version)) {
    throw new BackupFormatError(`неподдерживаемая версия ${String(version)}`)
  }

  const collections = arr(json, 'collections', 'файл').map(parseCollection)
  uniqueIds(collections, 'коллекции')
  const nameKeys = new Set<string>()
  for (const c of collections) {
    if (nameKeys.has(c.nameKey)) throw new BackupFormatError(`две коллекции «${c.name}»`)
    nameKeys.add(c.nameKey)
  }

  const rawRecipes = arr(json, 'recipes', 'файл')
  const rawImages = arr(json, 'images', 'файл')
  const recipeIds = new Set(rawRecipes.map((r) => (isObj(r) ? r.id : null)).filter((id) => typeof id === 'string'))
  const images = rawImages.map((raw, n) => parseImage(raw, n, recipeIds as Set<string>))
  uniqueIds(images, 'картинки')

  const collectionIds = new Set(collections.map((c) => c.id))
  const imageIds = new Set(images.map((i) => i.id))
  const recipes = rawRecipes.map((raw, n) => parseRecipe(raw, n, version, collectionIds, imageIds))
  uniqueIds(recipes, 'рецепты')

  const manualItems = arr(json, 'manualItems', 'файл').map(parseManualItem)
  uniqueIds(manualItems, 'список покупок')

  return { recipes, collections, manualItems, images }
}

// ---------- Импорт ----------

/** Заменяет все данные приложения содержимым резервной копии в одной транзакции. */
export async function importData(data: BackupData): Promise<void> {
  await db.transaction('rw', db.recipes, db.collections, db.manualItems, db.images, async () => {
    await Promise.all([db.recipes.clear(), db.collections.clear(), db.manualItems.clear(), db.images.clear()])
    await db.collections.bulkAdd(data.collections)
    await db.recipes.bulkAdd(data.recipes)
    await db.manualItems.bulkAdd(data.manualItems)
    await db.images.bulkAdd(data.images)
  })
}
