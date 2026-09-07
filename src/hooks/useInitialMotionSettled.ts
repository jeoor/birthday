import { useEffect, useState } from 'react'

const MOBILE_VIEWPORT_QUERY = '(max-width: 700px)'

/**
 * 生日页最晚的首屏入场动画在挂载约 680ms 后结束。
 * 移动端至少覆盖到这一时刻，避免加载遮罩淡出时露出仍在上移的内容。
 */
export const MOBILE_INITIAL_MOTION_SETTLE_MS = 720

function startsInMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.(MOBILE_VIEWPORT_QUERY).matches ?? window.innerWidth <= 700
}

export function useInitialMotionSettled(): boolean {
  const [settled, setSettled] = useState(() => !startsInMobileViewport())

  useEffect(() => {
    if (settled) return

    const timer = window.setTimeout(
      () => setSettled(true),
      MOBILE_INITIAL_MOTION_SETTLE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [settled])

  return settled
}
