import type { CatalogGame, Tag } from '../api/types'
import {
  ALL_PLAYER_COUNTS,
  ALL_TIME_BUCKETS,
  type FilterState,
  type TimeBucket,
} from './types'

const TIME_RANGES: Record<TimeBucket, { min: number; max: number }> = {
  'under-30': { min: 0, max: 29 },
  '30-60': { min: 30, max: 60 },
  '60-120': { min: 61, max: 120 },
  '120-plus': { min: 121, max: Number.POSITIVE_INFINITY },
}

export function createAllFilters(tags: Tag[]): FilterState {
  return {
    courseTab: 'all',
    vibeTagIds: tags.map((tag) => tag.id),
    timeBuckets: [...ALL_TIME_BUCKETS],
    playerCounts: [...ALL_PLAYER_COUNTS],
  }
}

export function matchesFilters(game: CatalogGame, filters: FilterState): boolean {
  const courseMatches = filters.courseTab === 'all' || game.course === filters.courseTab
  const vibeMatches =
    game.tags.length === 0 || game.tags.every((tag) => filters.vibeTagIds.includes(tag.id))
  const timeMatches = filters.timeBuckets.some((bucket) => {
    if (game.minPlayTimeMinutes === null || game.maxPlayTimeMinutes === null) return false
    const range = TIME_RANGES[bucket]
    return game.maxPlayTimeMinutes >= range.min && game.minPlayTimeMinutes <= range.max
  })
  const playerMatches = filters.playerCounts.some((count) => {
    if (game.minPlayers === null || game.maxPlayers === null) return false
    return count === 6 ? game.maxPlayers >= 6 : game.minPlayers <= count && game.maxPlayers >= count
  })

  return courseMatches && vibeMatches && timeMatches && playerMatches
}

export function toteMatchesFilters(toteGames: CatalogGame[], filters: FilterState): boolean {
  if (filters.courseTab !== 'all' && filters.courseTab !== 'appetizer') return false
  return toteGames.some((game) => matchesFilters(game, { ...filters, courseTab: 'all' }))
}
