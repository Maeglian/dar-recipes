import { describe, expect, it } from 'vitest'
import { normalizeKey } from './text'

describe('normalizeKey', () => {
  it('приводит к нижнему регистру', () => {
    expect(normalizeKey('Мука')).toBe('мука')
    expect(normalizeKey('МОЛОКО')).toBe('молоко')
  })

  it('убирает пробелы по краям', () => {
    expect(normalizeKey('  мука \t')).toBe('мука')
  })

  it('схлопывает повторные пробелы', () => {
    expect(normalizeKey('мука   пшеничная')).toBe('мука пшеничная')
  })

  it('совпадает для одинаковых названий в разном написании', () => {
    expect(normalizeKey(' Мука  Пшеничная')).toBe(normalizeKey('мука пшеничная'))
  })
})
