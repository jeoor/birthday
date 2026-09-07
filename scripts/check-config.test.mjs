import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import {
  checkWorkflowSchedule,
  parseBirthdayConfig,
} from './check-config.mjs'
import { buildEmailHtml, buildEmailPlain } from './email-template.mjs'

const configSource = readFileSync(
  new URL('../birthday.config.json', import.meta.url),
  'utf8',
)
const workflowSource = readFileSync(
  new URL('../.github/workflows/birthday-email.yml', import.meta.url),
  'utf8',
)

describe('birthday configuration', () => {
  test('matches the GitHub Actions schedule', () => {
    const config = parseBirthdayConfig(configSource)
    expect(checkWorkflowSchedule(config, workflowSource).matched).toBe(true)
  })

  test('detects a mismatched cron expression', () => {
    const config = parseBirthdayConfig(configSource)
    const mismatchedWorkflow = workflowSource.replace(
      "cron: '0 0 29 1 *'",
      "cron: '0 0 28 1 *'",
    )
    expect(checkWorkflowSchedule(config, mismatchedWorkflow).matched).toBe(
      false,
    )
  })

  test('rejects invalid dates and committed SMTP passwords', () => {
    const invalidDate = JSON.parse(configSource)
    invalidDate.person.birthDate = '2007-02-30'
    expect(() => parseBirthdayConfig(JSON.stringify(invalidDate))).toThrow(
      '不是有效日期',
    )

    const leakedPassword = JSON.parse(configSource)
    leakedPassword.automation.email.smtp.password = 'not-a-real-password'
    expect(() => parseBirthdayConfig(JSON.stringify(leakedPassword))).toThrow(
      'SMTP 密码不能写入配置文件',
    )
  })
})

describe('email template', () => {
  const input = {
    name: '测试名字',
    age: 20,
    birthMonth: 5,
    birthDay: 6,
    cakeImageUrl: 'https://example.com/cake.webp',
    siteUrl: 'https://example.com/',
    footerText: '测试落款',
    wish: '测试祝福',
  }

  test('uses configured identity and date in both formats', () => {
    const html = buildEmailHtml(input)
    const plain = buildEmailPlain(input)

    expect(html).toContain('5 月 6 日')
    expect(html).toContain('生日快乐，测试名字。')
    expect(html).toContain('测试落款')
    expect(plain).toContain('生日快乐，测试名字！')
    expect(plain).toContain('5 月 6 日')
  })
})
