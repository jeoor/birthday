export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function readBoolean(key: string, fallback = false): boolean {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value === 'true'
  } catch {
    return fallback
  }
}

export function readNumber(key: string, fallback: number): number {
  try {
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    const value = Number(stored)
    return Number.isFinite(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeStorage(key: string, value: string | number | boolean): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    if (import.meta.env.DEV) console.warn('localStorage write failed', { key })
  }
}
