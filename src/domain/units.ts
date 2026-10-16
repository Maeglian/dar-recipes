import { normalizeKey } from './text'
import type { Quantity, UnitKey } from './types'

type FixedUnit = Exclude<UnitKey, 'custom'>

interface UnitDef {
  label: string
  /** Семейство единиц: внутри семейства количества складываются */
  family: 'mass' | 'volume' | 'pcs' | 'tsp' | 'tbsp' | 'cup'
  /** Множитель к базовой единице семейства (г, мл, шт, ложка, стакан) */
  factor: number
}

const UNITS: Record<FixedUnit, UnitDef> = {
  g: { label: 'г', family: 'mass', factor: 1 },
  kg: { label: 'кг', family: 'mass', factor: 1000 },
  ml: { label: 'мл', family: 'volume', factor: 1 },
  l: { label: 'л', family: 'volume', factor: 1000 },
  pcs: { label: 'шт', family: 'pcs', factor: 1 },
  tsp: { label: 'ч.л.', family: 'tsp', factor: 1 },
  tbsp: { label: 'ст.л.', family: 'tbsp', factor: 1 },
  cup: { label: 'стакан', family: 'cup', factor: 1 },
}

/** Порядок единиц в выпадающем списке */
export const UNIT_OPTIONS: { value: UnitKey; label: string }[] = [
  ...(Object.keys(UNITS) as FixedUnit[]).map((key) => ({ value: key, label: UNITS[key].label })),
  { value: 'custom', label: 'другое' },
]

export const TO_TASTE = 'по вкусу'

/**
 * Количество в базовой единице своего семейства.
 * family — ключ совместимости: количества с одинаковым family можно складывать.
 * Для своих единиц ключ включает нормализованное название единицы, для «по вкусу» — 'none'.
 */
export interface BaseQuantity {
  family: string
  value: number | null
  /** Исходное написание своей единицы, для отображения */
  customLabel: string | null
}

export function toBase(q: Quantity): BaseQuantity {
  if (q.amount === null || q.unit === null) {
    return { family: 'none', value: null, customLabel: null }
  }
  if (q.unit === 'custom') {
    const label = (q.customUnit ?? '').trim()
    return { family: `custom:${normalizeKey(label)}`, value: q.amount, customLabel: label }
  }
  const def = UNITS[q.unit]
  return { family: def.family, value: q.amount * def.factor, customLabel: null }
}

export function scale(amount: number, baseServings: number, servings: number): number {
  return (amount * servings) / baseServings
}

/** Округляет до ближайшего кратного step, но не меньше step: ненулевое количество не превращается в ноль. */
export function roundTo(value: number, step: number): number {
  // Эпсилон защищает от ошибок вида 0.49999… → 0
  return Math.max(step, Math.round(value / step + 1e-9) * step)
}

const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2, useGrouping: false })

function formatNumber(value: number): string {
  return numberFormat.format(value)
}

const QUARTERS: Record<number, string> = { 1: '¼', 2: '½', 3: '¾' }

function formatQuarters(value: number): string {
  const quarters = Math.round(value * 4)
  const whole = Math.floor(quarters / 4)
  const frac = QUARTERS[quarters % 4] ?? ''
  if (whole === 0) return frac
  return `${whole}${frac}`
}

function formatLarge(value: number, small: string, large: string): string {
  const rounded = roundTo(value, 1)
  if (rounded >= 1000) return `${formatNumber(Math.round(rounded / 10) / 100)} ${large}`
  return `${formatNumber(rounded)} ${small}`
}

/** Отображение количества, заданного в базовой единице семейства. */
export function formatBase(q: BaseQuantity): string {
  if (q.value === null) return TO_TASTE
  const v = q.value
  switch (q.family) {
    case 'mass':
      return formatLarge(v, 'г', 'кг')
    case 'volume':
      return formatLarge(v, 'мл', 'л')
    case 'pcs':
      return `${formatNumber(roundTo(v, 0.5))} шт`
    case 'tsp':
    case 'tbsp':
    case 'cup':
      return `${formatQuarters(roundTo(v, 0.25))} ${UNITS[q.family].label}`
    default:
      return `${formatNumber(roundTo(v, 0.01))} ${q.customLabel ?? ''}`.trim()
  }
}

/** Отображение количества ингредиента с учётом порций. */
export function formatQuantity(q: Quantity, baseServings = 1, servings = baseServings): string {
  const base = toBase(q)
  if (base.value === null) return TO_TASTE
  return formatBase({ ...base, value: scale(base.value, baseServings, servings) })
}

export function unitLabel(unit: UnitKey | null, customUnit: string | null): string {
  if (unit === null) return ''
  if (unit === 'custom') return customUnit ?? ''
  return UNITS[unit].label
}
