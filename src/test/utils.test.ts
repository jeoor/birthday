import { beforeEach, describe, expect, test, vi } from 'vitest'
import { clamp, formatLocalDate } from '../lib/utils'

describe('clamp', () => {
  test('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  test('returns min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })

  test('returns max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })

  test('returns min when value equals boundary', () => {
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })
})

describe('formatLocalDate', () => {
  test('formats a standard date', () => {
    expect(formatLocalDate(new Date(2026, 0, 29))).toBe('2026-01-29')
  })

  test('pads single-digit month and day', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  test('handles end of year', () => {
    expect(formatLocalDate(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})

describe('readBoolean', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
    })
  })

  test('returns fallback when key does not exist', async () => {
    const { readBoolean } = await import('../lib/utils')
    expect(readBoolean('__test_rb_missing', false)).toBe(false)
    expect(readBoolean('__test_rb_missing', true)).toBe(true)
  })

  test('returns true when stored value is "true"', async () => {
    const { readBoolean, writeStorage } = await import('../lib/utils')
    writeStorage('__test_rb_true', true)
    expect(readBoolean('__test_rb_true', false)).toBe(true)
  })

  test('returns false for non-"true" stored value', async () => {
    const { readBoolean, writeStorage } = await import('../lib/utils')
    writeStorage('__test_rb_false', false)
    expect(readBoolean('__test_rb_false', true)).toBe(false)
  })
})

describe('readNumber', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
    })
  })

  test('returns fallback when key does not exist', async () => {
    const { readNumber } = await import('../lib/utils')
    expect(readNumber('__test_rn_missing', 42)).toBe(42)
  })

  test('returns parsed number for valid stored value', async () => {
    const { readNumber, writeStorage } = await import('../lib/utils')
    writeStorage('__test_rn_valid', 3.14)
    expect(readNumber('__test_rn_valid', 0)).toBe(3.14)
  })

  test('returns fallback for non-numeric stored value', async () => {
    const { writeStorage, readNumber } = await import('../lib/utils')
    writeStorage('__test_rn_bad', 'hello')
    expect(readNumber('__test_rn_bad', 99)).toBe(99)
  })
})

describe('writeStorage', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
    })
  })

  test('writes and reads back values', async () => {
    const { writeStorage } = await import('../lib/utils')
    writeStorage('__test_ws_string', 'hello')
    expect(store.get('__test_ws_string')).toBe('hello')

    writeStorage('__test_ws_number', 42)
    expect(store.get('__test_ws_number')).toBe('42')

    writeStorage('__test_ws_bool', true)
    expect(store.get('__test_ws_bool')).toBe('true')
  })

  test('does not throw when localStorage.setItem fails', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('denied') },
      removeItem: () => {},
    })
    const { writeStorage } = await import('../lib/utils')
    expect(() => writeStorage('__test_ws_error', 'value')).not.toThrow()
  })
})
