import type { Course } from '../api/types'

export type TimeBucket = 'under-30' | '30-60' | '60-120' | '120-plus'
export type MaxPlayerBucket = 2 | 3 | 4 | 5 | 6
export type CourseTab = 'all' | Course

export interface FilterState {
  courseTab: CourseTab
  vibeTagIds: string[]
  timeBuckets: TimeBucket[]
  maxPlayerCounts: MaxPlayerBucket[]
}

export const ALL_TIME_BUCKETS: TimeBucket[] = ['under-30', '30-60', '60-120', '120-plus']
export const ALL_MAX_PLAYER_COUNTS: MaxPlayerBucket[] = [2, 3, 4, 5, 6]
