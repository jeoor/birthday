import type { BenmingYearState } from '../types/benming'

interface BenmingStatusProps {
  state: BenmingYearState
}

export function BenmingStatus({ state }: BenmingStatusProps) {
  if (!state.isBenmingYear || !state.earthlyBranch || !state.zodiacLabel) return null

  return (
    <p className="benming-status" aria-label={`当前处于生肖${state.zodiacLabel}的本命年`}>
      本命年 · {state.earthlyBranch}
    </p>
  )
}
