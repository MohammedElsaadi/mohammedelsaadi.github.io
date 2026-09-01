import type { Dispatch, SetStateAction } from 'react'
import type { Tag } from '../api/types'
import { createDefaultFilters } from '../filters/matchesFilters'
import { ALL_MAX_PLAYER_COUNTS, type CourseTab, type FilterState, type MaxPlayerBucket, type TimeBucket } from '../filters/types'

interface FilterBarProps {
  filters: FilterState
  setFilters: Dispatch<SetStateAction<FilterState>>
  tags: Tag[]
}

const courseTabs: { value: CourseTab; label: string }[] = [
  { value: 'all', label: 'All Games' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'main', label: 'Main Course' },
  { value: 'dessert', label: 'Dessert' },
]
const timeLabels: Record<TimeBucket, string> = {
  'under-30': '< 30m',
  '30-60': '30–60m',
  '60-120': '60–120m',
  '120-plus': '2h+',
}

function toggleValue<T>(values: T[], value: T) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]
}

export function PrimaryFilterBar({ filters, setFilters }: FilterBarProps) {
  return (
    <section className="bgm-filters" aria-label="Board-game course filters">
      <div className="bgm-filters__heading">
        <h2>What would you like to play?</h2>
      </div>
      <div className="bgm-course-tabs" role="tablist" aria-label="Game courses">
        {courseTabs.map((tab) => (
          <button
            key={tab.value}
            id={`bgm-course-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={filters.courseTab === tab.value}
            aria-controls="bgm-secondary-filters"
            onClick={() => setFilters((current) => ({ ...current, courseTab: tab.value }))}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <button type="button" className="bgm-text-button bgm-filters__reset" aria-label="Reset filters" onClick={() => setFilters(createDefaultFilters())}>
        <span>Reset</span>
        <span>filters</span>
      </button>
    </section>
  )
}

export function SecondaryFilterBar({ filters, setFilters, tags }: FilterBarProps) {
  return (
    <section className="bgm-filter-groups" aria-label="Vibe, time and player filters">
      <div
        id="bgm-secondary-filters"
        className="bgm-filter-groups__inner"
        role="tabpanel"
        aria-labelledby={`bgm-course-tab-${filters.courseTab}`}
      >
        <fieldset>
          <legend>Vibe</legend>
          <div className="bgm-chip-row">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="bgm-chip"
                aria-pressed={filters.vibeTagIds.includes(tag.id)}
                onClick={() => setFilters((current) => ({ ...current, vibeTagIds: toggleValue(current.vibeTagIds, tag.id) }))}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Time</legend>
          <div className="bgm-chip-row">
            {(Object.keys(timeLabels) as TimeBucket[]).map((bucket) => (
              <button
                key={bucket}
                type="button"
                className="bgm-chip"
                aria-pressed={filters.timeBuckets.includes(bucket)}
                onClick={() => setFilters((current) => ({ ...current, timeBuckets: toggleValue(current.timeBuckets, bucket) }))}
              >
                {timeLabels[bucket]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Max players</legend>
          <div className="bgm-chip-row">
            {ALL_MAX_PLAYER_COUNTS.map((count: MaxPlayerBucket) => (
              <button
                key={count}
                type="button"
                className="bgm-chip"
                aria-pressed={filters.maxPlayerCounts.includes(count)}
                onClick={() => setFilters((current) => ({ ...current, maxPlayerCounts: toggleValue(current.maxPlayerCounts, count) }))}
              >
                {count === 6 ? '6+' : count}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  )
}
