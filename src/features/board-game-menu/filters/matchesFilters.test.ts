import { describe, expect, it } from 'vitest'
import type { CatalogGame, Tag } from '../api/types'
import { createAllFilters, matchesFilters, toteMatchesFilters } from './matchesFilters'

const tags: Tag[] = [
  { id: 'chill', slug: 'chill', name: 'Chill' },
  { id: 'thinky', slug: 'thinky', name: 'Thinky' },
]
const game: CatalogGame = {
  id: 'demo', slug: 'demo', name: 'Demo', itemType: 'game', containerId: 'crate', containerSlug: 'main-crate',
  selectable: true, alwaysPacked: false, allowOverflow: true, widthMm: 100, heightMm: 30, depthMm: 100,
  weightGrams: null, minPlayers: 2, maxPlayers: 4, minPlayTimeMinutes: 35, maxPlayTimeMinutes: 55,
  complexity: 2, course: 'main', coverUrl: null, status: 'active', sortOrder: 0, tags,
}

describe('matchesFilters', () => {
  it('matches when all filters are enabled', () => {
    expect(matchesFilters(game, createAllFilters(tags))).toBe(true)
  })

  it('fades a disabled course', () => {
    const filters = createAllFilters(tags)
    filters.courses = filters.courses.filter((course) => course !== 'main')
    expect(matchesFilters(game, filters)).toBe(false)
  })

  it('uses OR matching within the vibe group', () => {
    const filters = createAllFilters(tags)
    filters.vibeTagIds = ['chill']
    expect(matchesFilters(game, filters)).toBe(true)
    filters.vibeTagIds = []
    expect(matchesFilters(game, filters)).toBe(false)
  })

  it('matches a tote when at least one content item matches', () => {
    const filters = createAllFilters(tags)
    const nonmatch = { ...game, id: 'other', course: 'dessert' as const }
    expect(toteMatchesFilters([nonmatch, game], filters)).toBe(true)
  })
})
