/** Ключ для сравнения названий: без регистра, пробелов по краям и повторных пробелов. */
export function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru')
}

export function compareRu(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { sensitivity: 'base' })
}
