import { describe, expect, it } from 'vitest'
import { formatDateOnly, isValidDateOnly, menuTitle, todayDateOnly } from './dates'

describe('date-only utilities', () => {
  it('validates canonical dates', () => {
    expect(isValidDateOnly('2026-09-04')).toBe(true)
    expect(isValidDateOnly('2026-02-30')).toBe(false)
  })

  it('formats without UTC conversion', () => {
    expect(formatDateOnly('2026-09-04')).toBe('09/04/2026')
    expect(menuTitle('2026-09-04')).toBe('Board Game Menu - 09/04/2026')
  })

  it('uses local calendar fields for today', () => {
    expect(todayDateOnly(new Date(2026, 8, 4, 23, 30))).toBe('2026-09-04')
  })
})
