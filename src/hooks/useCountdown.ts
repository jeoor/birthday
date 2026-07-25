import { useEffect, useState } from 'react'
import { getCountdown } from '../lib/birthday'
import type { CountdownParts } from '../types/birthday'

const ZERO_COUNTDOWN: CountdownParts = {
  totalMilliseconds: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
}

export function useCountdown(target: Date, simulatedNow?: Date): CountdownParts {
  const targetTime = target.getTime()
  const isValidTarget = Number.isFinite(targetTime)
  const simulatedTime = simulatedNow?.getTime()
  const [countdown, setCountdown] = useState(() =>
    isValidTarget ? getCountdown(target, simulatedNow ?? new Date()) : ZERO_COUNTDOWN,
  )

  useEffect(() => {
    if (!isValidTarget) return
    const realAnchor = Date.now()
    const getNow = () =>
      simulatedTime === undefined ? new Date() : new Date(simulatedTime + Date.now() - realAnchor)
    const update = () => setCountdown(getCountdown(new Date(targetTime), getNow()))
    update()
    const timer = window.setInterval(update, 1_000)
    return () => window.clearInterval(timer)
  }, [isValidTarget, simulatedTime, targetTime])

  return countdown
}
