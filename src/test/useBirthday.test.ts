/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mockSnapshot = {
  now: new Date('2026-07-25T12:00:00Z'),
  age: 19,
  nextAge: 20,
  isBirthday: false,
  nextBirthday: new Date('2027-01-29T00:00:00Z'),
  agePeriodStart: new Date('2026-01-29T00:00:00Z'),
  agePeriodEnd: new Date('2027-01-29T00:00:00Z'),
  ageProgress: 48,
  isSimulated: false,
  simulatedDate: null,
  benmingYear: { isBenmingYear: false, zodiac: 'dog', supportStatus: 'supported' },
}

vi.mock('../lib/birthday', () => ({
  getBirthdaySnapshot: vi.fn(() => mockSnapshot),
}))

describe('useBirthday', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')
    vi.spyOn(document, 'addEventListener')
    vi.spyOn(document, 'removeEventListener')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('returns initial snapshot immediately', async () => {
    const { getBirthdaySnapshot } = await import('../lib/birthday')
    const { useBirthday } = await import('../hooks/useBirthday')

    const { result } = renderHook(() => useBirthday())
    expect(result.current).toEqual(mockSnapshot)
    expect(getBirthdaySnapshot).toHaveBeenCalledTimes(1)
  })

  test('refreshes on 30-second interval', async () => {
    const { getBirthdaySnapshot } = await import('../lib/birthday')
    const { useBirthday } = await import('../hooks/useBirthday')

    renderHook(() => useBirthday())
    expect(getBirthdaySnapshot).toHaveBeenCalledTimes(1)

    act(() => { vi.advanceTimersByTime(30_000) })
    expect(getBirthdaySnapshot).toHaveBeenCalledTimes(2)

    act(() => { vi.advanceTimersByTime(30_000) })
    expect(getBirthdaySnapshot).toHaveBeenCalledTimes(3)
  })

  test('registers focus and visibility listeners', async () => {
    const { useBirthday } = await import('../hooks/useBirthday')

    renderHook(() => useBirthday())
    expect(window.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
    expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })

  test('cleans up on unmount', async () => {
    const { useBirthday } = await import('../hooks/useBirthday')

    const { unmount } = renderHook(() => useBirthday())
    unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
    expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})
