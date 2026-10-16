import { describe, expect, it } from 'vitest'
import { fitSize } from './image'

describe('fitSize', () => {
  it('большая фотография 4000×3000 → 1200×900', () => {
    expect(fitSize(4000, 3000)).toEqual({ width: 1200, height: 900 })
  })

  it('вертикальная фотография ограничивается по высоте', () => {
    expect(fitSize(3000, 4000)).toEqual({ width: 900, height: 1200 })
  })

  it('маленькая картинка не увеличивается', () => {
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('ровно 1200 не меняется', () => {
    expect(fitSize(1200, 1200)).toEqual({ width: 1200, height: 1200 })
  })
})
