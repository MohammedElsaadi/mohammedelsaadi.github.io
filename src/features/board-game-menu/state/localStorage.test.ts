import { afterEach, describe, expect, it, vi } from 'vitest'
import { readStoredValue, removeStoredValue, writeStoredValue } from './localStorage'

afterEach(() => vi.unstubAllGlobals())

describe('versioned local draft storage', () => {
  it('round-trips and removes a picker draft', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    })
    const draft = { gameNightDate: '2026-09-04', selectedCrateGameIds: ['game-1'], selectedToteGameIds: ['tote-game-1'] }
    writeStoredValue('board-game-menu:draft:v1', draft)
    expect(readStoredValue('board-game-menu:draft:v1')).toEqual(draft)
    removeStoredValue('board-game-menu:draft:v1')
    expect(readStoredValue('board-game-menu:draft:v1')).toBeNull()
  })
})
