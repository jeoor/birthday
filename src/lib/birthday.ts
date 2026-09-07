import { differenceInMilliseconds, isValid, parse } from 'date-fns'
import birthdayConfig from '../../birthday.config.json'
import type { BirthdayConfig, BirthdaySnapshot, CountdownParts } from '../types/birthday'
import { getBenmingYearState } from './benming-year'
import { formatLocalDate } from './utils'

const PERSON = birthdayConfig.person
const [birthYear, birthMonth, birthDay] = PERSON.birthDate.split('-').map(Number)

export const BIRTHDAY = {
  year: birthYear,
  month: birthMonth,
  day: birthDay,
  name: PERSON.name,
} as const satisfies BirthdayConfig

export const createLocalBirthday = (year: number, config = BIRTHDAY): Date =>
  new Date(year, config.month - 1, config.day, 0, 0, 0, 0)

export function isBirthdayDate(date: Date, config = BIRTHDAY): boolean {
  return date.getMonth() === config.month - 1 && date.getDate() === config.day
}

export function calculateAge(date: Date, config = BIRTHDAY): number {
  const birthdayThisYear = createLocalBirthday(date.getFullYear(), config)
  const reachedBirthday = date.getTime() >= birthdayThisYear.getTime()
  return date.getFullYear() - config.year - (reachedBirthday ? 0 : 1)
}

export function getNextBirthday(date: Date, config = BIRTHDAY): Date {
  const thisYear = createLocalBirthday(date.getFullYear(), config)
  if (!isBirthdayDate(date, config) && date.getTime() < thisYear.getTime()) return thisYear
  return createLocalBirthday(date.getFullYear() + 1, config)
}

export function getAgePeriod(date: Date, config = BIRTHDAY): { start: Date; end: Date } {
  const birthdayThisYear = createLocalBirthday(date.getFullYear(), config)
  if (date.getTime() < birthdayThisYear.getTime()) {
    return {
      start: createLocalBirthday(date.getFullYear() - 1, config),
      end: birthdayThisYear,
    }
  }
  return {
    start: birthdayThisYear,
    end: createLocalBirthday(date.getFullYear() + 1, config),
  }
}

export function calculateAgeProgress(date: Date, config = BIRTHDAY): number {
  const { start, end } = getAgePeriod(date, config)
  const elapsed = differenceInMilliseconds(date, start)
  const duration = differenceInMilliseconds(end, start)
  return Math.min(100, Math.max(0, (elapsed / duration) * 100))
}

export function getCountdown(target: Date, now = new Date()): CountdownParts {
  const totalMilliseconds = Math.max(0, differenceInMilliseconds(target, now))
  const totalSeconds = Math.floor(totalMilliseconds / 1000)
  return {
    totalMilliseconds,
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  }
}

export function resolveNow(realNow = new Date(), search = window.location.search): {
  now: Date
  isSimulated: boolean
  simulatedDate: string | null
} {
  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    return { now: realNow, isSimulated: false, simulatedDate: null }
  }

  const value = new URLSearchParams(search).get('date')
  if (!value) return { now: realNow, isSimulated: false, simulatedDate: null }

  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  if (!isValid(parsed) || value !== formatLocalDate(parsed)) {
    return { now: realNow, isSimulated: false, simulatedDate: null }
  }

  parsed.setHours(realNow.getHours(), realNow.getMinutes(), realNow.getSeconds(), realNow.getMilliseconds())
  return { now: parsed, isSimulated: true, simulatedDate: value }
}

export function getBirthdaySnapshot(realNow = new Date(), search?: string): BirthdaySnapshot {
  const resolved = resolveNow(realNow, search)
  const age = calculateAge(resolved.now)
  const nextBirthday = getNextBirthday(resolved.now)
  const period = getAgePeriod(resolved.now)
  return {
    now: resolved.now,
    age,
    nextAge: age + 1,
    isBirthday: isBirthdayDate(resolved.now),
    nextBirthday,
    agePeriodStart: period.start,
    agePeriodEnd: period.end,
    ageProgress: calculateAgeProgress(resolved.now),
    isSimulated: resolved.isSimulated,
    simulatedDate: resolved.simulatedDate,
    benmingYear: getBenmingYearState(resolved.now),
  }
}

export function birthdayStorageKey(date: Date): string {
  return `kayro-birthday:${formatLocalDate(date)}`
}
