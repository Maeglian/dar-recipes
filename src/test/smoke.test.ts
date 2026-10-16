import { describe, expect, it } from 'vitest'

describe('окружение тестов', () => {
  it('предоставляет IndexedDB', () => {
    expect(globalThis.indexedDB).toBeDefined()
  })
})
