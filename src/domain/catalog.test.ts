import { describe, expect, it } from 'vitest'
import { makeRecipe } from '../test/factories'
import { EMPTY_FILTER, NEW_COLLECTION_ID, filterCatalog, isFilterActive } from './catalog'

const recipes = [
  makeRecipe({ title: 'Сырники', collectionIds: ['breakfast'], rating: 'excellent', cooked: true }),
  makeRecipe({ title: 'Блины', collectionIds: ['breakfast', 'quick'], rating: 'good', cooked: true }),
  makeRecipe({ title: 'Блинный торт', collectionIds: ['baking'], rating: 'excellent', cooked: true }),
  makeRecipe({ title: 'Овсянка', collectionIds: ['breakfast'], rating: null }),
  makeRecipe({ title: 'Блины с икрой', collectionIds: [], rating: null }),
]

const titles = (list: typeof recipes) => list.map((r) => r.title)

describe('filterCatalog', () => {
  it('без фильтров — все рецепты по алфавиту', () => {
    expect(titles(filterCatalog(recipes, EMPTY_FILTER))).toEqual([
      'Блинный торт',
      'Блины',
      'Блины с икрой',
      'Овсянка',
      'Сырники',
    ])
  })

  it('поиск по вхождению без учёта регистра', () => {
    expect(titles(filterCatalog(recipes, { ...EMPTY_FILTER, search: 'БЛИН' }))).toEqual([
      'Блинный торт',
      'Блины',
      'Блины с икрой',
    ])
    expect(titles(filterCatalog(recipes, { ...EMPTY_FILTER, search: ' ник ' }))).toEqual(['Сырники'])
  })

  it('коллекция и оценка вместе', () => {
    const result = filterCatalog(recipes, { ...EMPTY_FILTER, collectionId: 'breakfast', rating: 'excellent' })
    expect(titles(result)).toEqual(['Сырники'])
  })

  it('фильтр «без оценки»', () => {
    expect(titles(filterCatalog(recipes, { ...EMPTY_FILTER, rating: 'none' }))).toEqual(['Блины с икрой', 'Овсянка'])
  })

  it('поиск, коллекция и оценка одновременно', () => {
    const result = filterCatalog(recipes, { search: 'блин', collectionId: 'breakfast', rating: 'good' })
    expect(titles(result)).toEqual(['Блины'])
  })

  it('«Новое» — рецепты без отметки «Приготовлено»', () => {
    expect(titles(filterCatalog(recipes, { ...EMPTY_FILTER, collectionId: NEW_COLLECTION_ID }))).toEqual([
      'Блины с икрой',
      'Овсянка',
    ])
  })

  it('«Новое» вместе с поиском и оценкой', () => {
    const f = { search: 'блин', collectionId: NEW_COLLECTION_ID, rating: 'none' as const }
    expect(titles(filterCatalog(recipes, f))).toEqual(['Блины с икрой'])
    expect(filterCatalog(recipes, { ...f, rating: 'good' })).toEqual([])
  })

  it('ничего не найдено', () => {
    expect(filterCatalog(recipes, { ...EMPTY_FILTER, collectionId: 'baking', rating: 'bad' })).toEqual([])
  })

  it('isFilterActive', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false)
    expect(isFilterActive({ ...EMPTY_FILTER, search: '  ' })).toBe(false)
    expect(isFilterActive({ ...EMPTY_FILTER, rating: 'none' })).toBe(true)
  })
})
