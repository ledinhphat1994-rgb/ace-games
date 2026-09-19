/**
 * Digital Campus v2 — Canonical Study Day & Timezone Helper
 *
 * All streak, weekly leaderboard, and challenge boundaries MUST use these helpers.
 * School timezone defaults to Asia/Ho_Chi_Minh (UTC+7).
 */

export const SCHOOL_TIMEZONE = 'Asia/Ho_Chi_Minh'

/**
 * Returns formatted date YYYY-MM-DD for a given timestamp in the specified timezone.
 */
export function studyDate(timestamp: number, timezone: string = SCHOOL_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date(timestamp))
}

/**
 * Returns ISO week string "YYYY-Www" for a given timestamp in the specified timezone.
 * Week starts on Monday and ends on Sunday.
 */
export function studyWeek(timestamp: number, timezone: string = SCHOOL_TIMEZONE): string {
  // Extract year, month, day in target timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(new Date(timestamp))

  let year = 0
  let month = 0
  let day = 0

  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10)
    if (part.type === 'month') month = parseInt(part.value, 10)
    if (part.type === 'day') day = parseInt(part.value, 10)
  }

  // Calculate ISO week number using standard Thursday-based algorithm on local calendar date
  const target = new Date(Date.UTC(year, month - 1, day))
  const dayNr = (target.getUTCDay() + 6) % 7 // Monday = 0, Sunday = 6
  target.setUTCDate(target.getUTCDate() - dayNr + 3) // Target is nearest Thursday
  const firstThursday = target.getTime()
  target.setUTCMonth(0, 1)
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7))
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.getTime()) / (7 * 86400000))
  const weekYear = new Date(firstThursday).getUTCFullYear()

  return `${weekYear}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Calculates the day difference between two YYYY-MM-DD dates.
 * date2 - date1 in calendar days.
 * Returns 1 if date2 is the immediate next day of date1.
 */
export function dayDifference(date1: string, date2: string): number {
  const [y1, m1, d1] = date1.split('-').map(Number)
  const [y2, m2, d2] = date2.split('-').map(Number)
  const utc1 = Date.UTC(y1, m1 - 1, d1)
  const utc2 = Date.UTC(y2, m2 - 1, d2)
  return Math.round((utc2 - utc1) / 86400000)
}

/**
 * Checks if currDate is exactly the day after prevDate.
 */
export function isConsecutiveDay(prevDate: string, currDate: string): boolean {
  return dayDifference(prevDate, currDate) === 1
}

/**
 * Returns date range YYYY-MM-DD for a given week "YYYY-Www".
 */
export function getStudyWeekDateRange(weekStr: string): { startDate: string; endDate: string } {
  const [yearStr, weekPart] = weekStr.split('-W')
  const year = parseInt(yearStr, 10)
  const week = parseInt(weekPart, 10)

  // Jan 4th is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const day = (jan4.getUTCDay() + 6) % 7
  const mondayWeek1 = new Date(jan4.getTime() - day * 86400000)

  const mondayTarget = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000)
  const sundayTarget = new Date(mondayTarget.getTime() + 6 * 86400000)

  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

  return {
    startDate: fmt(mondayTarget),
    endDate: fmt(sundayTarget),
  }
}
