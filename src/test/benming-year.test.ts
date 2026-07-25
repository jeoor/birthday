import { describe, expect, it } from 'vitest'
import { getBenmingYearState, getZodiacForDate } from '../lib/benming-year'
import { getBirthdaySnapshot } from '../lib/birthday'

describe('本命年与生肖边界', () => {
  it('按农历正月初一边界将 2007-01-29 识别为生肖狗、地支戌', () => {
    const zodiac = getZodiacForDate(new Date(2007, 0, 29, 12))
    expect(zodiac).toMatchObject({ key: 'dog', label: '狗', earthlyBranch: '戌' })
  })

  it('不会按公历出生年份直接识别为猪', () => {
    expect(getZodiacForDate(new Date(2007, 0, 29))?.key).toBe('dog')
    expect(getZodiacForDate(new Date(2007, 1, 18))?.key).toBe('pig')
  })

  it('2030 狗年开始前一天仍是普通年份', () => {
    const state = getBenmingYearState(new Date(2030, 1, 2, 23, 59, 59))
    expect(state.isBenmingYear).toBe(false)
    expect(state.nextStartDate).toEqual(new Date(2030, 1, 3))
    expect(state.nextEndDate).toEqual(new Date(2031, 0, 22))
  })

  it('2030 狗年开始当天进入本命年', () => {
    const state = getBenmingYearState(new Date(2030, 1, 3))
    expect(state.isBenmingYear).toBe(true)
    expect(state.startDate).toEqual(new Date(2030, 1, 3))
    expect(state.endDate).toEqual(new Date(2031, 0, 22))
  })

  it('狗年结束当天仍处于本命年', () => {
    expect(getBenmingYearState(new Date(2031, 0, 22, 23, 59, 59)).isBenmingYear).toBe(true)
  })

  it('下一个农历新年当天退出本命年', () => {
    expect(getBenmingYearState(new Date(2031, 0, 23)).isBenmingYear).toBe(false)
  })

  it('普通年份返回下一次本命年而不启用状态', () => {
    const state = getBenmingYearState(new Date(2026, 6, 21))
    expect(state.isBenmingYear).toBe(false)
    expect(state.nextStartDate).toEqual(new Date(2030, 1, 3))
  })

  it('生日当天可与本命年重合', () => {
    const snapshot = getBirthdaySnapshot(new Date(2042, 0, 29, 12), '')
    expect(snapshot.isBirthday).toBe(true)
    expect(snapshot.benmingYear.isBenmingYear).toBe(true)
  })

  it('生日当天不必然是本命年', () => {
    const snapshot = getBirthdaySnapshot(new Date(2030, 0, 29, 12), '')
    expect(snapshot.isBirthday).toBe(true)
    expect(snapshot.benmingYear.isBenmingYear).toBe(false)
  })

  it('开发日期模拟与生日状态使用同一个有效日期', () => {
    const snapshot = getBirthdaySnapshot(new Date(2026, 6, 21, 12), '?date=2030-02-03')
    expect(snapshot.isSimulated).toBe(true)
    expect(snapshot.now.getFullYear()).toBe(2030)
    expect(snapshot.benmingYear.isBenmingYear).toBe(true)
  })

  it('当前本命年中返回下一次完整本命年范围', () => {
    const state = getBenmingYearState(new Date(2030, 5, 1))
    expect(state.nextStartDate).toEqual(new Date(2042, 0, 22))
    expect(state.nextEndDate).toEqual(new Date(2043, 1, 9))
  })

  it('超出本地边界表范围时显式安全降级', () => {
    const state = getBenmingYearState(new Date(2150, 0, 1))
    expect(state.isBenmingYear).toBe(false)
    expect(state.supportStatus).toBe('unsupported')
    expect(state.startDate).toBeNull()
  })

  it('无效出生日期和无效当前日期不会抛出异常', () => {
    expect(getBenmingYearState(new Date(2030, 1, 3), 'invalid').supportStatus)
      .toBe('invalid-birth-date')
    expect(getBenmingYearState(new Date(Number.NaN)).supportStatus).toBe('unsupported')
  })

  it('本命年进度始终保持在 0 到 1', () => {
    const dates = [
      new Date(2030, 1, 3),
      new Date(2030, 6, 1),
      new Date(2031, 0, 22, 23, 59, 59),
    ]
    dates.forEach((date) => {
      const progress = getBenmingYearState(date).progress
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(1)
    })
  })
})
