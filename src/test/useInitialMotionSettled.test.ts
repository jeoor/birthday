/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  MOBILE_INITIAL_MOTION_SETTLE_MS,
  useInitialMotionSettled,
} from '../hooks/useInitialMotionSettled'

function mockViewport(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches })))
}

describe('useInitialMotionSettled', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('allows desktop content to reveal immediately', () => {
    mockViewport(false)

    const { result } = renderHook(() => useInitialMotionSettled())

    expect(result.current).toBe(true)
  })

  test('keeps mobile content covered until its entrance motion has settled', () => {
    vi.useFakeTimers()
    mockViewport(true)

    const { result } = renderHook(() => useInitialMotionSettled())
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(MOBILE_INITIAL_MOTION_SETTLE_MS - 1)
    })
    expect(result.current).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe(true)
  })

  test('clears the mobile timer when unmounted', () => {
    vi.useFakeTimers()
    mockViewport(true)

    const { unmount } = renderHook(() => useInitialMotionSettled())
    expect(vi.getTimerCount()).toBe(1)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
