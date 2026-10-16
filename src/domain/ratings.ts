import type { Rating } from './types'

export const RATINGS: { value: Rating; label: string }[] = [
  { value: 'excellent', label: 'Отлично' },
  { value: 'good', label: 'Хорошо' },
  { value: 'sometimes', label: 'Иногда можно попробовать' },
  { value: 'bad', label: 'Плохо' },
]

const LABELS = Object.fromEntries(RATINGS.map((r) => [r.value, r.label])) as Record<Rating, string>

export function ratingLabel(rating: Rating): string {
  return LABELS[rating]
}

/** CSS-класс фона по оценке (цвета в tokens.css); без оценки — обычный фон. */
export function ratingClass(rating: Rating | null): string | null {
  return rating ? `rating-${rating}` : null
}
