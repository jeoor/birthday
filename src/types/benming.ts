export type ZodiacKey =
  | 'rat'
  | 'ox'
  | 'tiger'
  | 'rabbit'
  | 'dragon'
  | 'snake'
  | 'horse'
  | 'goat'
  | 'monkey'
  | 'rooster'
  | 'dog'
  | 'pig'

export interface ZodiacIdentity {
  key: ZodiacKey
  label: string
  earthlyBranch: string
}

export type BenmingSupportStatus =
  | 'complete'
  | 'next-range-unavailable'
  | 'unsupported'
  | 'invalid-birth-date'

export interface BenmingYearState {
  zodiac: ZodiacKey | null
  zodiacLabel: string | null
  earthlyBranch: string | null
  isBenmingYear: boolean
  startDate: Date | null
  endDate: Date | null
  progress: number
  nextStartDate: Date | null
  nextEndDate: Date | null
  supportStatus: BenmingSupportStatus
}
