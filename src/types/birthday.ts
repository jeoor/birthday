import type { BenmingYearState } from './benming'

export interface BirthdayConfig {
  year: number
  month: number
  day: number
  name: string
}

export interface BirthdaySnapshot {
  now: Date
  age: number
  nextAge: number
  isBirthday: boolean
  nextBirthday: Date
  agePeriodStart: Date
  agePeriodEnd: Date
  ageProgress: number
  isSimulated: boolean
  simulatedDate: string | null
  benmingYear: BenmingYearState
}

export interface CountdownParts {
  totalMilliseconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export type CandleState =
  | 'unlit'
  | 'lighting'
  | 'lit'
  | 'wavering'
  | 'extinguishing'
  | 'extinguished'

export type MicrophoneStatus =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'denied'
  | 'unsupported'
  | 'error'
