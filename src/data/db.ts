import Dexie, { type EntityTable } from 'dexie'
import type { Collection, ManualItem, Recipe, RecipeImage } from '../domain/types'
import { installDiagnostics, recordOpenError } from './diagnostics'

export const DB_NAME = 'dar-recipes'

export class RecipesDb extends Dexie {
  recipes!: EntityTable<Recipe, 'id'>
  images!: EntityTable<RecipeImage, 'id'>
  collections!: EntityTable<Collection, 'id'>
  manualItems!: EntityTable<ManualItem, 'id'>

  constructor(name = DB_NAME) {
    super(name)
    // Булевы поля (selected, bought) и rating не индексируются: фильтруем в памяти
    this.version(1).stores({
      recipes: 'id, titleKey, *collectionIds',
      images: 'id',
      collections: 'id, &nameKey',
      manualItems: 'id, createdAt',
    })
    // v2: отметка «Приготовлено». Индексы не меняются. Оценённые рецепты уже готовили,
    // остальные попадают в «Новое»
    this.version(2)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('recipes')
          .toCollection()
          .modify((recipe: Partial<Recipe>) => {
            recipe.cooked ??= recipe.rating != null
          }),
      )
  }
}

export const db = new RecipesDb()
installDiagnostics(db)
db.open().catch(recordOpenError)

export function newId(): string {
  return crypto.randomUUID()
}
