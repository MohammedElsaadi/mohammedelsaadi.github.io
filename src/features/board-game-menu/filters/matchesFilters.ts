import type { CatalogGame } from '../api/types'
import { type FilterState, type TimeBucket } from './types'

const TIME_RANGES: Record<TimeBucket, { min: number; max: number }> = {
  'under-30': { min: 0, max: 29 },
  '30-60': { min: 30, max: 60 },
  '60-120': { min: 61, max: 120 },
  '120-plus': { min: 121, max: Number.POSITIVE_INFINITY },
}

export function createDefaultFilters(): FilterState {
  return {
    courseTab: 'all',
    vibeTagIds: [],
    timeBuckets: [],
    maxPlayerCounts: [],
  }
}

export function matchesFilters(game: CatalogGame, filters: FilterState): boolean {
  const courseMatches = filters.courseTab === 'all' || game.course === filters.courseTab
  const vibeMatches = filters.vibeTagIds.length === 0 || filters.vibeTagIds.some(
    (tagId) => game.tags.some((tag) => tag.id === tagId),
  )
  const timeMatches = filters.timeBuckets.length === 0 || filters.timeBuckets.some((bucket) => {
    if (game.minPlayTimeMinutes === null || game.maxPlayTimeMinutes === null) return false
    const range = TIME_RANGES[bucket]
    return game.maxPlayTimeMinutes >= range.min && game.minPlayTimeMinutes <= range.max
  })
  const maxPlayersMatch = filters.maxPlayerCounts.length === 0 || filters.maxPlayerCounts.some((count) => {
    if (game.maxPlayers === null) return false
    return count === 6 ? game.maxPlayers >= 6 : game.maxPlayers === count
  })

  return courseMatches && vibeMatches && timeMatches && maxPlayersMatch
}
