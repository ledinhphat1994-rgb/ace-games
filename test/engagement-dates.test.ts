import { describe, expect, it } from 'vitest'
import {
  dayDifference,
  getStudyWeekDateRange,
  isConsecutiveDay,
  studyDate,
  studyWeek,
} from '../shared/study-date'

describe('Study Date & Timezone Conventions (Asia/Ho_Chi_Minh)', () => {
  it('correctly maps timestamps across midnight boundary in UTC+7', () => {
    // 2026-09-19 23:59:59 in Asia/Ho_Chi_Minh is 2026-09-19 16:59:59 UTC
    const beforeMidnightUtc = Date.UTC(2026, 8, 19, 16, 59, 59)
    // 2026-09-20 00:00:01 in Asia/Ho_Chi_Minh is 2026-09-19 17:00:01 UTC
    const afterMidnightUtc = Date.UTC(2026, 8, 19, 17, 0, 1)

    expect(studyDate(beforeMidnightUtc)).toBe('2026-09-19')
    expect(studyDate(afterMidnightUtc)).toBe('2026-09-20')
  })

  it('correctly identifies consecutive days', () => {
    expect(isConsecutiveDay('2026-09-19', '2026-09-20')).toBe(true)
    expect(isConsecutiveDay('2026-09-19', '2026-09-21')).toBe(false)
    expect(isConsecutiveDay('2026-09-19', '2026-09-19')).toBe(false)
    expect(isConsecutiveDay('2026-09-20', '2026-09-19')).toBe(false)
  })

  it('handles month boundary consecutive days (February to March in non-leap and leap year)', () => {
    expect(isConsecutiveDay('2026-02-28', '2026-03-01')).toBe(true)
    expect(dayDifference('2026-02-28', '2026-03-01')).toBe(1)

    // Leap year 2028
    expect(isConsecutiveDay('2028-02-28', '2028-02-29')).toBe(true)
    expect(isConsecutiveDay('2028-02-29', '2028-03-01')).toBe(true)
  })

  it('handles year boundary (Dec 31 to Jan 1)', () => {
    const dec31 = Date.UTC(2026, 11, 31, 16, 59, 59) // 23:59:59 VN
    const jan1 = Date.UTC(2026, 11, 31, 17, 0, 0) // 00:00:00 VN

    expect(studyDate(dec31)).toBe('2026-12-31')
    expect(studyDate(jan1)).toBe('2027-01-01')
    expect(isConsecutiveDay(studyDate(dec31), studyDate(jan1))).toBe(true)
  })

  it('correctly computes ISO studyWeek across Sunday/Monday boundary', () => {
    // 2026-09-20 is Sunday
    // 2026-09-21 is Monday
    const sunEvening = Date.UTC(2026, 8, 20, 16, 59, 59) // 23:59:59 VN
    const monMorning = Date.UTC(2026, 8, 20, 17, 0, 1) // 00:00:01 VN (Sept 21)

    const sunWeek = studyWeek(sunEvening)
    const monWeek = studyWeek(monMorning)

    expect(sunWeek).toBe('2026-W38')
    expect(monWeek).toBe('2026-W39')
  })

  it('returns exact Monday to Sunday date range for a week', () => {
    const range = getStudyWeekDateRange('2026-W38')
    expect(range.startDate).toBe('2026-09-14') // Monday
    expect(range.endDate).toBe('2026-09-20') // Sunday
  })
})
