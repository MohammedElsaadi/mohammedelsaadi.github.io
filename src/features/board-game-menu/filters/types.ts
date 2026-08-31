import type { Course } from '../api/types'

export type TimeBucket = 'under-30' | '30-60' | '60-120' | '120-plus'
export type PlayerBucket = 2 | 3 | 4 | 5 | 6

export interface FilterState {
  courses: Course[]
  vibeTagIds: string[]
  timeBuckets: TimeBucket[]
  playerCounts: PlayerBucket[]
}

export const ALL_COURSES: Course[] = ['appetizer', 'main', 'dessert']
export const ALL_TIME_BUCKETS: TimeBucket[] = ['under-30', '30-60', '60-120', '120-plus']
export const ALL_PLAYER_COUNTS: PlayerBucket[] = [2, 3, 4, 5, 6]
