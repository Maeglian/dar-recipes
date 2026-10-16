import { describe, expect, it } from 'vitest'
import type { Quantity, UnitKey } from './types'
import { formatBase, formatQuantity, roundTo, scale, toBase } from './units'

const q = (amount: number | null, unit: UnitKey | null, customUnit: string | null = null): Quantity => ({
  amount,
  unit,
  customUnit,
})

describe('пересчёт количеств', () => {
  it('увеличение порций: 200 г на 2 порции → 400 г на 4', () => {
    expect(formatQuantity(q(200, 'g'), 2, 4)).toBe('400 г')
  })

  it('возврат к исходным порциям не накапливает ошибок округления', () => {
    const amount = 200
    // Пересчёт всегда идёт от исходного количества, а не от предыдущего результата
    expect(formatQuantity(q(amount, 'g'), 2, 3)).toBe('300 г')
    expect(formatQuantity(q(amount, 'g'), 2, 2)).toBe('200 г')
    expect(formatQuantity(q(1, 'tbsp'), 3, 2)).toBe('¾ ст.л.')
    expect(formatQuantity(q(1, 'tbsp'), 3, 3)).toBe('1 ст.л.')
  })

  it('ингредиент без количества остаётся «по вкусу»', () => {
    expect(formatQuantity(q(null, null), 2, 6)).toBe('по вкусу')
  })

  it('scale считает от базовых порций', () => {
    expect(scale(3, 2, 3)).toBe(4.5)
  })
})

describe('масса и объём', () => {
  it('граммы округляются до целого: 200 г с 3 на 2 порции → 133 г', () => {
    expect(formatQuantity(q(200, 'g'), 3, 2)).toBe('133 г')
  })

  it('от 1000 г переходят в килограммы: 800 г с 2 на 3 → 1,2 кг', () => {
    expect(formatQuantity(q(800, 'g'), 2, 3)).toBe('1,2 кг')
  })

  it('килограммы с двумя знаками без лишних нулей', () => {
    expect(formatQuantity(q(1250, 'g'))).toBe('1,25 кг')
    expect(formatQuantity(q(1000, 'g'))).toBe('1 кг')
    expect(formatQuantity(q(999.6, 'g'))).toBe('1 кг')
  })

  it('исходное количество в литрах: 1,5 л с 2 на 1 порцию → 750 мл', () => {
    expect(formatQuantity(q(1.5, 'l'), 2, 1)).toBe('750 мл')
  })

  it('литры без пересчёта', () => {
    expect(formatQuantity(q(1.5, 'l'))).toBe('1,5 л')
  })

  it('очень малое количество не округляется до нуля: 1 г с 4 на 1 → 1 г', () => {
    expect(formatQuantity(q(1, 'g'), 4, 1)).toBe('1 г')
  })
})

describe('штуки', () => {
  it('3 шт с 2 на 3 порции → 4,5 шт', () => {
    expect(formatQuantity(q(3, 'pcs'), 2, 3)).toBe('4,5 шт')
  })

  it('2 шт с 3 на 2 порции → 1,5 шт', () => {
    expect(formatQuantity(q(2, 'pcs'), 3, 2)).toBe('1,5 шт')
  })

  it('не меньше половины', () => {
    expect(formatQuantity(q(1, 'pcs'), 10, 1)).toBe('0,5 шт')
  })
})

describe('ложки и стаканы', () => {
  it('1 ст.л. с 2 на 3 порции → 1½ ст.л.', () => {
    expect(formatQuantity(q(1, 'tbsp'), 2, 3)).toBe('1½ ст.л.')
  })

  it('1 ч.л. с 4 на 3 порции → ¾ ч.л.', () => {
    expect(formatQuantity(q(1, 'tsp'), 4, 3)).toBe('¾ ч.л.')
  })

  it('не меньше четверти', () => {
    expect(formatQuantity(q(1, 'tsp'), 8, 1)).toBe('¼ ч.л.')
  })

  it('стакан с четвертью', () => {
    expect(formatQuantity(q(2.25, 'cup'))).toBe('2¼ стакан')
  })
})

describe('свои единицы', () => {
  it('1 пучок с 3 на 2 порции → 0,67 пучок', () => {
    expect(formatQuantity(q(1, 'custom', 'пучок'), 3, 2)).toBe('0,67 пучок')
  })

  it('отображается в исходном написании', () => {
    expect(formatQuantity(q(2, 'custom', 'зубчик'))).toBe('2 зубчик')
  })
})

describe('toBase', () => {
  it('сводит кг к граммам, а л к миллилитрам', () => {
    expect(toBase(q(1.4, 'kg'))).toMatchObject({ family: 'mass', value: 1400 })
    expect(toBase(q(0.5, 'l'))).toMatchObject({ family: 'volume', value: 500 })
  })

  it('ложки разных размеров — разные семейства', () => {
    expect(toBase(q(1, 'tsp')).family).not.toBe(toBase(q(1, 'tbsp')).family)
  })

  it('свои единицы совместимы по нормализованному названию', () => {
    expect(toBase(q(1, 'custom', ' Пучок')).family).toBe(toBase(q(1, 'custom', 'пучок')).family)
    expect(toBase(q(1, 'custom', 'пучок')).family).not.toBe(toBase(q(1, 'custom', 'зубчик')).family)
  })

  it('без количества — семейство none', () => {
    expect(toBase(q(null, null))).toEqual({ family: 'none', value: null, customLabel: null })
  })

  it('formatBase для суммы в граммах', () => {
    expect(formatBase({ family: 'mass', value: 1400, customLabel: null })).toBe('1,4 кг')
  })
})

describe('roundTo', () => {
  it('устойчив к ошибкам плавающей точки', () => {
    expect(roundTo(0.1 + 0.2, 0.1)).toBeCloseTo(0.3)
    expect(roundTo(2.4999999999, 0.5)).toBe(2.5)
  })
})
