/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const ZERO_COUNTDOWN = { totalMilliseconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-25T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('returns countdown to a future date', async () => {
    const { useCountdown } = await import('../hooks/useCountdown')
    const target = new Date('2027-01-29T00:00:00Z')

    const { result } = renderHook(() => useCountdown(target))
    expect(result.current.days).toBeGreaterThan(0)
    expect(result.current.hours).toBeGreaterThanOrEqual(0)
    expect(result.current.minutes).toBeGreaterThanOrEqual(0)
    expect(result.current.seconds).toBeGreaterThanOrEqual(0)
  })

  test('returns zero countdown for invalid Date', async () => {
    const { useCountdown } = await import('../hooks/useCountdown')

    const { result } = renderHook(() => useCountdown(new Date('invalid')))
    expect(result.current).toEqual(ZERO_COUNTDOWN)
  })

  test('updates every second', async () => {
    const { useCountdown } = await import('../hooks/useCountdown')
    const target = new Date('2026-07-26T00:00:00Z')

    const { result } = renderHook(() => useCountdown(target))
    const initialSeconds = result.current.seconds

    act(() => { vi.advanceTimersByTime(1_000) })
    expect(result.current.seconds).not.toBe(initialSeconds)
  })

  test('supports simulated time', async () => {
    const { useCountdown } = await import('../hooks/useCountdown')
    const target = new Date('2027-01-29T00:00:00Z')
    const simulated = new Date('2027-01-29T00:00:00Z')

    const { result } = renderHook(() => useCountdown(target, simulated))
    expect(result.current.days).toBe(0)
    expect(result.current.hours).toBe(0)
    expect(result.current.minutes).toBe(0)
    expect(result.current.seconds).toBe(0)
  })

  test('cleans up interval on unmount', async () => {
    const { useCountdown } = await import('../hooks/useCountdown')
    const target = new Date('2027-01-29T00:00:00Z')
    const spy = vi.spyOn(window, 'clearInterval')

    const { unmount } = renderHook(() => useCountdown(target))
    unmount()
    expect(spy).toHaveBeenCalled()
  })
})
