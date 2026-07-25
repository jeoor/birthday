import { describe, expect, it } from 'vitest'
import { calculateAge, calculateAgeProgress, getBirthdaySnapshot, getCountdown, getNextBirthday } from '../lib/birthday'

describe('生日日期计算', () => {
  it('生日前仍是上一周岁', () => {
    expect(calculateAge(new Date(2026, 0, 28, 23, 59, 59))).toBe(18)
  })

  it('生日当天按本地日期增长年龄并进入生日模式', () => {
    const snapshot = getBirthdaySnapshot(new Date(2026, 0, 29, 12), '')
    expect(snapshot.age).toBe(19)
    expect(snapshot.isBirthday).toBe(true)
    expect(snapshot.nextAge).toBe(20)
    expect(snapshot.nextBirthday).toEqual(new Date(2027, 0, 29))
  })

  it('生日刚结束时下一生日为下一年', () => {
    expect(getNextBirthday(new Date(2026, 0, 30))).toEqual(new Date(2027, 0, 29))
  })

  it('跨年时仍指向即将到来的生日', () => {
    expect(getNextBirthday(new Date(2025, 11, 31, 23, 59))).toEqual(new Date(2026, 0, 29))
  })

  it('闰年年龄周期按实际毫秒计算', () => {
    const progress = calculateAgeProgress(new Date(2024, 6, 29))
    expect(progress).toBeGreaterThan(49)
    expect(progress).toBeLessThan(51)
  })

  it('倒计时正确拆分天时分秒', () => {
    const now = new Date(2025, 11, 31, 23, 59, 59)
    const target = new Date(2026, 0, 1, 1, 1, 1)
    expect(getCountdown(target, now)).toMatchObject({ days: 0, hours: 1, minutes: 1, seconds: 2 })
  })
})
