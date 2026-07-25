import { useEffect, useState } from 'react'
import { getBirthdaySnapshot } from '../lib/birthday'
import type { BirthdaySnapshot } from '../types/birthday'

export function useBirthday(): BirthdaySnapshot {
  const [snapshot, setSnapshot] = useState(() => getBirthdaySnapshot())

  useEffect(() => {
    const refresh = () => setSnapshot(getBirthdaySnapshot())
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    window.addEventListener('popstate', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('popstate', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  return snapshot
}
