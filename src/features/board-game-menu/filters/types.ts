import type { Course } from '../api/types'

export type TimeBucket = 'under-30' | '30-60' | '60-120' | '120-plus'
export type PlayerBucket = 2 | 3 | 4 | 5 | 6
export type CourseTab = 'all' | Course

export interface FilterState {
  courseTab: CourseTab
  vibeTagIds: string[]
  timeBuckets: TimeBucket[]
  playerCounts: PlayerBucket[]
}

export const ALL_TIME_BUCKETS: TimeBucket[] = ['under-30', '30-60', '60-120', '120-plus']
export const ALL_PLAYER_COUNTS: PlayerBucket[] = [2, 3, 4, 5, 6]
