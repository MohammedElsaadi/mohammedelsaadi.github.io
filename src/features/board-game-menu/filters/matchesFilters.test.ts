import { describe, expect, it } from 'vitest'
import type { CatalogGame, Tag } from '../api/types'
import { createDefaultFilters, matchesFilters } from './matchesFilters'

const tags: Tag[] = [
  { id: 'chill', slug: 'chill', name: 'Chill' },
  { id: 'thinky', slug: 'thinky', name: 'Thinky' },
]
const game: CatalogGame = {
  id: 'demo', slug: 'demo', name: 'Demo', itemType: 'game', containerId: 'crate', containerSlug: 'main-crate',
  selectable: true, alwaysPacked: false, allowOverflow: true, widthMm: 100, heightMm: 30, depthMm: 100,
  weightGrams: null, minPlayers: 2, maxPlayers: 4, minPlayTimeMinutes: 35, maxPlayTimeMinutes: 55,
  complexity: 2, course: 'main', coverUrl: null, sideUrl: null, coverRotationDegrees: 0, status: 'active', sortOrder: 0, tags,
}

describe('matchesFilters', () => {
  it('shows every game when optional filters are off', () => {
    const filters = createDefaultFilters()
    expect(filters.vibeTagIds).toEqual([])
    expect(filters.timeBuckets).toEqual([])
    expect(filters.maxPlayerCounts).toEqual([])
    expect(matchesFilters(game, filters)).toBe(true)
  })

  it('hides games outside the selected course tab', () => {
    const filters = createDefaultFilters()
    filters.courseTab = 'dessert'
    expect(matchesFilters(game, filters)).toBe(false)
  })

  it('shows games having any selected vibe', () => {
    const filters = createDefaultFilters()
    filters.vibeTagIds = ['chill']
    expect(matchesFilters(game, filters)).toBe(true)
    filters.vibeTagIds = ['competitive']
    expect(matchesFilters(game, filters)).toBe(false)
    filters.vibeTagIds = ['competitive', 'thinky']
    expect(matchesFilters(game, filters)).toBe(true)
  })

  it('applies time filters only when at least one is selected', () => {
    const filters = createDefaultFilters()
    filters.timeBuckets = ['30-60']
    expect(matchesFilters(game, filters)).toBe(true)
    filters.timeBuckets = ['under-30']
    expect(matchesFilters(game, filters)).toBe(false)
  })

  it('filters by the published maximum player count', () => {
    const filters = createDefaultFilters()
    filters.maxPlayerCounts = [4]
    expect(matchesFilters(game, filters)).toBe(true)
    filters.maxPlayerCounts = [3]
    expect(matchesFilters(game, filters)).toBe(false)
    filters.maxPlayerCounts = [6]
    expect(matchesFilters({ ...game, maxPlayers: 7 }, filters)).toBe(true)
  })
})
