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
  complexity: 2, course: 'main', coverUrl: null, coverRotationDegrees: 0, status: 'active', sortOrder: 0, tags,
}

describe('matchesFilters', () => {
  it('matches when all filters are enabled', () => {
    expect(matchesFilters(game, createAllFilters(tags))).toBe(true)
  })

  it('fades games outside the selected course tab', () => {
    const filters = createAllFilters(tags)
    filters.courseTab = 'dessert'
    expect(matchesFilters(game, filters)).toBe(false)
  })

  it('fades a game when any one of its vibe tags is disabled', () => {
    const filters = createAllFilters(tags)
    filters.vibeTagIds = ['chill']
    expect(matchesFilters(game, filters)).toBe(false)
    filters.vibeTagIds = ['chill', 'thinky']
    expect(matchesFilters(game, filters)).toBe(true)
    filters.vibeTagIds = []
    expect(matchesFilters(game, filters)).toBe(false)
  })

  it('matches a tote when at least one content item matches', () => {
    const filters = createAllFilters(tags)
    const nonmatch = { ...game, id: 'other', course: 'dessert' as const }
    expect(toteMatchesFilters([nonmatch, game], filters)).toBe(true)
  })

  it('categorizes the tote bundle as an appetizer regardless of its contents courses', () => {
    const filters = createAllFilters(tags)
    filters.courseTab = 'appetizer'
    expect(toteMatchesFilters([game], filters)).toBe(true)
    filters.courseTab = 'main'
    expect(toteMatchesFilters([game], filters)).toBe(false)
    filters.courseTab = 'dessert'
    expect(toteMatchesFilters([game], filters)).toBe(false)
  })
})
