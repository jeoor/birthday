import { differenceInMilliseconds, subDays } from 'date-fns'
import birthdayConfig from '../../birthday.config.json'
import type { BenmingYearState, ZodiacIdentity } from '../types/benming'
import {
  getLunarYear,
  getLunarYearBoundary,
  isWithinLunarCalendarSupport,
  parseLocalDate,
} from './lunar-calendar'
import { clamp } from './utils'

const PERSON = birthdayConfig.person
const ZODIAC_CYCLE: readonly ZodiacIdentity[] = [
  { key: 'rat', label: '鼠', earthlyBranch: '子' },
  { key: 'ox', label: '牛', earthlyBranch: '丑' },
  { key: 'tiger', label: '虎', earthlyBranch: '寅' },
  { key: 'rabbit', label: '兔', earthlyBranch: '卯' },
  { key: 'dragon', label: '龙', earthlyBranch: '辰' },
  { key: 'snake', label: '蛇', earthlyBranch: '巳' },
  { key: 'horse', label: '马', earthlyBranch: '午' },
  { key: 'goat', label: '羊', earthlyBranch: '未' },
  { key: 'monkey', label: '猴', earthlyBranch: '申' },
  { key: 'rooster', label: '鸡', earthlyBranch: '酉' },
  { key: 'dog', label: '狗', earthlyBranch: '戌' },
  { key: 'pig', label: '猪', earthlyBranch: '亥' },
]

const CYCLE_BASE_YEAR = 2008
const FIRST_SEARCH_YEAR = 1999
const LAST_COMPLETE_LUNAR_YEAR = 2099

interface ZodiacYearInterval {
  startDate: Date
  endDate: Date
  nextBoundary: Date
}

function getZodiacForLunarYear(lunarYear: number): ZodiacIdentity {
  const index = ((lunarYear - CYCLE_BASE_YEAR) % ZODIAC_CYCLE.length + ZODIAC_CYCLE.length)
    % ZODIAC_CYCLE.length
  return ZODIAC_CYCLE[index]
}

function getZodiacYearInterval(lunarYear: number): ZodiacYearInterval | null {
  const startDate = getLunarYearBoundary(lunarYear)
  const nextBoundary = getLunarYearBoundary(lunarYear + 1)
  if (!startDate || !nextBoundary) return null
  return { startDate, endDate: subDays(nextBoundary, 1), nextBoundary }
}

function findNextMatchingYear(date: Date, zodiac: ZodiacIdentity): ZodiacYearInterval | null {
  for (let lunarYear = FIRST_SEARCH_YEAR; lunarYear <= LAST_COMPLETE_LUNAR_YEAR; lunarYear += 1) {
    const interval = getZodiacYearInterval(lunarYear)
    if (
      interval
      && interval.startDate.getTime() > date.getTime()
      && getZodiacForLunarYear(lunarYear).key === zodiac.key
    ) {
      return interval
    }
  }
  return null
}

export function getZodiacForDate(date: Date): ZodiacIdentity | null {
  const lunarYear = getLunarYear(date)
  return lunarYear === null ? null : getZodiacForLunarYear(lunarYear)
}

export function getBenmingYearState(
  date: Date,
  birthDate: string = PERSON.birthDate,
): BenmingYearState {
  const birthZodiac = getZodiacForDate(parseLocalDate(birthDate))
  if (!birthZodiac) {
    return {
      zodiac: null,
      zodiacLabel: null,
      earthlyBranch: null,
      isBenmingYear: false,
      startDate: null,
      endDate: null,
      progress: 0,
      nextStartDate: null,
      nextEndDate: null,
      supportStatus: 'invalid-birth-date',
    }
  }

  if (!isWithinLunarCalendarSupport(date)) {
    return {
      zodiac: birthZodiac.key,
      zodiacLabel: birthZodiac.label,
      earthlyBranch: birthZodiac.earthlyBranch,
      isBenmingYear: false,
      startDate: null,
      endDate: null,
      progress: 0,
      nextStartDate: null,
      nextEndDate: null,
      supportStatus: 'unsupported',
    }
  }

  const currentLunarYear = getLunarYear(date)
  const currentZodiac = getZodiacForDate(date)
  const currentInterval = currentLunarYear === null ? null : getZodiacYearInterval(currentLunarYear)
  const isBenmingYear = currentZodiac?.key === birthZodiac.key && currentInterval !== null
  const next = findNextMatchingYear(date, birthZodiac)
  const elapsed = isBenmingYear && currentInterval
    ? differenceInMilliseconds(date, currentInterval.startDate)
    : 0
  const duration = isBenmingYear && currentInterval
    ? differenceInMilliseconds(currentInterval.nextBoundary, currentInterval.startDate)
    : 1

  return {
    zodiac: birthZodiac.key,
    zodiacLabel: birthZodiac.label,
    earthlyBranch: birthZodiac.earthlyBranch,
    isBenmingYear,
    startDate: isBenmingYear ? currentInterval.startDate : null,
    endDate: isBenmingYear ? currentInterval.endDate : null,
    progress: isBenmingYear ? clamp(elapsed / duration, 0, 1) : 0,
    nextStartDate: next?.startDate ?? null,
    nextEndDate: next?.endDate ?? null,
    supportStatus: next ? 'complete' : 'next-range-unavailable',
  }
}
