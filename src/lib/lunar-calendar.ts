import { formatLocalDate } from './utils'

const LUNAR_INFO = '04bd8,04ae0,0a570,054d5,0d260,0d950,16554,056a0,09ad0,055d2,04ae0,0a5b6,0a4d0,0d250,1d255,0b540,0d6a0,0ada2,095b0,14977,04970,0a4b0,0b4b5,06a50,06d40,1ab54,02b60,09570,052f2,04970,06566,0d4a0,0ea50,06e95,05ad0,02b60,186e3,092e0,1c8d7,0c950,0d4a0,1d8a6,0b550,056a0,1a5b4,025d0,092d0,0d2b2,0a950,0b557,06ca0,0b550,15355,04da0,0a5d0,14573,052d0,0a9a8,0e950,06aa0,0aea6,0ab50,04b60,0aae4,0a570,05260,0f263,0d950,05b57,056a0,096d0,04dd5,04ad0,0a4d0,0d4d4,0d250,0d558,0b540,0b5a0,195a6,095b0,049b0,0a974,0a4b0,0b27a,06a50,06d40,0af46,0ab60,09570,04af5,04970,064b0,074a3,0ea50,06b58,055c0,0ab60,096d5,092e0,0c960,0d954,0d4a0,0da50,07552,056a0,0abb7,025d0,092d0,0cab5,0a950,0b4a0,0baa4,0ad50,055d9,04ba0,0a5b0,15176,052b0,0a930,07954,06aa0,0ad50,05b52,04b60,0a6e6,0a4e0,0d260,0ea65,0d530,05aa0,076a3,096d0,04bd7,04ad0,0a4d0,1d0b6,0d250,0d520,0dd45,0b5a0,056d0,055b2,049b0,0a577,0a4b0,0aa50,1b255,06d20,0ada0,14b63,09370,049f8,04970,064b0,168a6,0ea50,06b20,1a6c4,0aae0,0a2e0,0d2e3,0c960,0d557,0d4a0,0da50,05d55,056a0,0a6d0,055d4,052d0,0a9b8,0a950,0b4a0,0b6a6,0ad50,055a0,0aba4,0a5b0,052b0,0b273,06930,07337,06aa0,0ad50,14b55,04b60,0a570,054e4,0d160,0e968,0d520,0daa0,16aa6,056d0,04ae0,0a9d4,0a2d0,0d150,0f252,0d520'
  .split(',')
  .map((hex) => Number.parseInt(hex, 16))

export const MIN_YEAR = 1900
export const MAX_YEAR = 2100

const LUNAR_EPOCH_UTC = Date.UTC(MIN_YEAR, 0, 31)
const DAY_IN_MS = 24 * 60 * 60 * 1_000
const FIRST_BOUNDARY_YEAR = 1999

if (LUNAR_INFO.length !== MAX_YEAR - MIN_YEAR + 1) {
  throw new Error('农历年份编码表范围与 MIN_YEAR/MAX_YEAR 不一致。')
}

function getLunarYearDays(year: number): number | null {
  const info = LUNAR_INFO[year - MIN_YEAR]
  if (info === undefined) return null

  let days = 12 * 29
  for (let mask = 0x8000; mask >= 0x10; mask >>= 1) {
    if ((info & mask) !== 0) days += 1
  }

  const leapMonth = info & 0x0f
  if (leapMonth !== 0) {
    days += (info & 0x10000) !== 0 ? 30 : 29
  }

  return days
}

function calculateSpringFestivalDate(year: number): Date | null {
  if (year < MIN_YEAR || year > MAX_YEAR) return null

  let offsetDays = 0
  for (let currentYear = MIN_YEAR; currentYear < year; currentYear += 1) {
    const yearDays = getLunarYearDays(currentYear)
    if (yearDays === null) return null
    offsetDays += yearDays
  }

  const utcDate = new Date(LUNAR_EPOCH_UTC + offsetDays * DAY_IN_MS)
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    0,
    0,
    0,
    0,
  )
}

export function parseLocalDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return new Date(Number.NaN)
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  const isExact = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return isExact ? date : new Date(Number.NaN)
}

export const LUNAR_NEW_YEAR_DATES: Readonly<Record<number, string>> = Object.freeze(
  Object.fromEntries(
    Array.from({ length: MAX_YEAR - FIRST_BOUNDARY_YEAR + 1 }, (_, index) => {
      const year = FIRST_BOUNDARY_YEAR + index
      const date = calculateSpringFestivalDate(year)
      if (date === null) throw new Error(`无法计算 ${year} 年春节日期。`)
      return [year, formatLocalDate(date)]
    }),
  ),
)

export const LUNAR_CALENDAR_SUPPORT = {
  start: new Date(2000, 0, 1, 0, 0, 0, 0),
  end: new Date(2100, 11, 31, 23, 59, 59, 999),
} as const

export function getLunarYearBoundary(year: number): Date | null {
  const value = LUNAR_NEW_YEAR_DATES[year]
  return value ? parseLocalDate(value) : null
}

export function resolveSpringFestivalDate(now: Date): Date | null {
  if (!Number.isFinite(now.getTime())) return null

  const year = now.getFullYear()
  const springFestival = getLunarYearBoundary(year)
  if (springFestival === null) return null

  const today = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0, 0)
  if (today.getTime() <= springFestival.getTime()) return springFestival

  return getLunarYearBoundary(year + 1)
}

export function getLunarYear(date: Date): number | null {
  if (!isWithinLunarCalendarSupport(date)) return null

  const year = date.getFullYear()
  const boundary = getLunarYearBoundary(year)
  if (boundary === null) return null

  return date.getTime() >= boundary.getTime() ? year : year - 1
}

export function isWithinLunarCalendarSupport(date: Date): boolean {
  const time = date.getTime()
  return time >= LUNAR_CALENDAR_SUPPORT.start.getTime() && time <= LUNAR_CALENDAR_SUPPORT.end.getTime()
}
