import { describe, expect, it } from 'vitest'
import {
  parseAmount,
  validateManualItem,
  validateRecipe,
  type IngredientDraft,
  type ManualItemDraft,
  type RecipeDraft,
} from './validation'

const row = (patch: Partial<IngredientDraft> = {}): IngredientDraft => ({
  id: 'i1',
  name: 'Мука',
  amount: '200',
  unit: 'g',
  customUnit: '',
  bought: false,
  ...patch,
})

const draft = (patch: Partial<RecipeDraft> = {}): RecipeDraft => ({
  title: 'Блины',
  baseServings: '2',
  description: '',
  ingredients: [row()],
  collectionIds: [],
  ...patch,
})

function errorsOf(d: RecipeDraft) {
  const result = validateRecipe(d)
  if (result.ok) throw new Error('ожидалась ошибка валидации')
  return result.errors
}

describe('валидация рецепта', () => {
  it('принимает корректный рецепт', () => {
    const result = validateRecipe(draft())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toMatchObject({ title: 'Блины', baseServings: 2 })
      expect(result.value.ingredients[0]).toMatchObject({ name: 'Мука', amount: 200, unit: 'g' })
    }
  })

  it('пустое название или одни пробелы — ошибка', () => {
    expect(errorsOf(draft({ title: '' })).title).toBeDefined()
    expect(errorsOf(draft({ title: '   ' })).title).toBeDefined()
  })

  it.each(['0', '-1', '1.5', '2,5', 'abc', ''])('базовые порции «%s» — ошибка', (value) => {
    expect(errorsOf(draft({ baseServings: value })).baseServings).toBeDefined()
  })

  it('рецепт без ингредиентов допустим', () => {
    expect(validateRecipe(draft({ ingredients: [] })).ok).toBe(true)
  })
})

describe('валидация ингредиента', () => {
  it('десятичная запятая: «1,5» л сохраняется как 1.5', () => {
    const result = validateRecipe(draft({ ingredients: [row({ amount: '1,5', unit: 'l' })] }))
    expect(result.ok && result.value.ingredients[0]!.amount).toBe(1.5)
  })

  it('без количества — «по вкусу», без единицы', () => {
    const result = validateRecipe(draft({ ingredients: [row({ name: 'Соль', amount: '', unit: 'tsp' })] }))
    expect(result.ok && result.value.ingredients[0]).toMatchObject({ amount: null, unit: null, customUnit: null })
  })

  it.each(['0', '-3', 'много', '1,2,3'])('количество «%s» — ошибка', (amount) => {
    expect(errorsOf(draft({ ingredients: [row({ amount })] })).ingredients.i1?.amount).toBeDefined()
  })

  it('пустое название при заданном количестве — ошибка', () => {
    expect(errorsOf(draft({ ingredients: [row({ name: ' ' })] })).ingredients.i1?.name).toBeDefined()
  })

  it('своя единица с названием сохраняется', () => {
    const result = validateRecipe(
      draft({ ingredients: [row({ name: 'Чеснок', amount: '2', unit: 'custom', customUnit: ' зубчик ' })] }),
    )
    expect(result.ok && result.value.ingredients[0]).toMatchObject({ unit: 'custom', customUnit: 'зубчик' })
  })

  it('пустое название своей единицы — ошибка', () => {
    const errors = errorsOf(draft({ ingredients: [row({ unit: 'custom', customUnit: '' })] }))
    expect(errors.ingredients.i1?.customUnit).toBeDefined()
  })

  it('полностью пустая строка ингредиента пропускается', () => {
    const result = validateRecipe(draft({ ingredients: [row(), row({ id: 'i2', name: '', amount: '' })] }))
    expect(result.ok && result.value.ingredients).toHaveLength(1)
  })

  it('сохраняет отметку «куплено»', () => {
    const result = validateRecipe(draft({ ingredients: [row({ bought: true })] }))
    expect(result.ok && result.value.ingredients[0]!.bought).toBe(true)
  })
})

describe('parseAmount', () => {
  it('понимает точку, запятую и дробь без целой части', () => {
    expect(parseAmount('1.5')).toBe(1.5)
    expect(parseAmount('1,5')).toBe(1.5)
    expect(parseAmount(',5')).toBe(0.5)
    expect(parseAmount(' 3 ')).toBe(3)
  })

  it('пустая строка — null', () => {
    expect(parseAmount('')).toBeNull()
  })
})

describe('валидация пункта, добавленного вручную', () => {
  const item = (patch: Partial<ManualItemDraft> = {}): ManualItemDraft => ({
    name: 'Хлеб',
    amount: '',
    unit: 'g',
    customUnit: '',
    ...patch,
  })

  it('без количества — без единицы', () => {
    expect(validateManualItem(item())).toEqual({
      ok: true,
      value: { name: 'Хлеб', amount: null, unit: null, customUnit: null },
    })
  })

  it('с количеством и единицей', () => {
    const result = validateManualItem(item({ name: 'молоко', amount: '500', unit: 'ml' }))
    expect(result.ok && result.value).toEqual({ name: 'молоко', amount: 500, unit: 'ml', customUnit: null })
  })

  it('пустое название и некорректное количество — ошибки', () => {
    const result = validateManualItem(item({ name: ' ', amount: '0' }))
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors).toMatchObject({ name: expect.any(String), amount: expect.any(String) })
  })
})
