import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const CONFIG_PATH = new URL('../birthday.config.json', import.meta.url)
const WORKFLOW_PATH = new URL(
  '../.github/workflows/birthday-email.yml',
  import.meta.url,
)

function requireObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} 必须是对象`)
  }
  return value
}

function requireString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${path} 必须是非空字符串`)
  }
  return value
}

function requireEmail(value, path) {
  const email = requireString(value, path)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${path} 不是有效邮箱地址：${email}`)
  }
}

function requireHttpUrl(value, path) {
  const rawUrl = requireString(value, path)
  let url
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error(`${path} 不是有效 URL：${rawUrl}`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${path} 必须使用 http 或 https：${rawUrl}`)
  }
}

export function readBirthDate(value) {
  const rawDate = requireString(value, 'person.birthDate')
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate)
  if (!match) {
    throw new Error('person.birthDate 必须使用 YYYY-MM-DD 格式')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`person.birthDate 不是有效日期：${rawDate}`)
  }

  return { value: rawDate, year, month, day }
}

function readScheduleTime(value) {
  const rawTime = requireString(value, 'automation.schedule.time')
  const match = /^(\d{2}):(\d{2})$/.exec(rawTime)
  if (!match) {
    throw new Error('automation.schedule.time 必须使用 HH:mm 格式')
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) {
    throw new Error(`automation.schedule.time 不是有效时间：${rawTime}`)
  }

  return { value: rawTime, hour, minute }
}

function requireTimezone(value) {
  const timezone = requireString(value, 'automation.schedule.timezone')
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
  } catch {
    throw new Error(
      `automation.schedule.timezone 不是有效 IANA 时区：${timezone}`,
    )
  }
}

export function parseBirthdayConfig(source) {
  let config
  try {
    config = JSON.parse(source)
  } catch (error) {
    throw new Error(
      `birthday.config.json 不是有效 JSON：${error instanceof Error ? error.message : error}`,
    )
  }

  requireObject(config, '配置')
  const person = requireObject(config.person, 'person')
  requireString(person.name, 'person.name')
  readBirthDate(person.birthDate)

  const automation = requireObject(config.automation, 'automation')
  const schedule = requireObject(automation.schedule, 'automation.schedule')
  readScheduleTime(schedule.time)
  requireTimezone(schedule.timezone)

  const email = requireObject(automation.email, 'automation.email')
  const smtp = requireObject(email.smtp, 'automation.email.smtp')
  requireString(smtp.host, 'automation.email.smtp.host')
  if (!Number.isInteger(smtp.port) || smtp.port < 1 || smtp.port > 65535) {
    throw new Error('automation.email.smtp.port 必须是 1—65535 的整数')
  }
  if (typeof smtp.secure !== 'boolean') {
    throw new Error('automation.email.smtp.secure 必须是布尔值')
  }
  requireEmail(smtp.user, 'automation.email.smtp.user')

  const sender = requireObject(email.sender, 'automation.email.sender')
  requireEmail(sender.email, 'automation.email.sender.email')
  requireString(sender.name, 'automation.email.sender.name')
  requireEmail(email.recipient, 'automation.email.recipient')
  requireHttpUrl(email.siteUrl, 'automation.email.siteUrl')
  const cakeImagePath = requireString(
    email.cakeImagePath,
    'automation.email.cakeImagePath',
  )
  if (!cakeImagePath.startsWith('/')) {
    throw new Error('automation.email.cakeImagePath 必须是以 / 开头的站内路径')
  }
  requireHttpUrl(
    new URL(cakeImagePath, email.siteUrl).href,
    'automation.email.cakeImagePath',
  )
  requireString(email.footerText, 'automation.email.footerText')

  if ('password' in smtp || 'pass' in smtp) {
    throw new Error('SMTP 密码不能写入配置文件，请使用 GitHub Secret SMTP_PASS')
  }

  return config
}

export function loadBirthdayConfig() {
  return parseBirthdayConfig(readFileSync(CONFIG_PATH, 'utf8'))
}

function readSingleWorkflowField(source, pattern, label) {
  const values = [...source.matchAll(pattern)].map((match) =>
    match[1].trim().replace(/\s+/g, ' '),
  )
  if (values.length !== 1) {
    throw new Error(
      `birthday-email.yml 应恰好包含一个 ${label}，实际找到 ${values.length} 个`,
    )
  }
  return values[0]
}

export function readWorkflowSchedule(source) {
  return {
    cron: readSingleWorkflowField(
      source,
      /^\s*-\s*cron:\s*['"]([^'"]+)['"]\s*$/gm,
      'schedule.cron',
    ),
    timezone: readSingleWorkflowField(
      source,
      /^\s*timezone:\s*['"]([^'"]+)['"]\s*$/gm,
      'schedule.timezone',
    ),
  }
}

export function checkWorkflowSchedule(config, workflowSource) {
  const birthday = readBirthDate(config.person.birthDate)
  const schedule = config.automation.schedule
  const time = readScheduleTime(schedule.time)
  const actual = readWorkflowSchedule(workflowSource)
  const expected = {
    cron: `${time.minute} ${time.hour} ${birthday.day} ${birthday.month} *`,
    timezone: schedule.timezone,
  }

  return {
    birthday,
    time,
    actual,
    expected,
    matched:
      actual.cron === expected.cron && actual.timezone === expected.timezone,
  }
}

export function runConfigCheck() {
  const config = loadBirthdayConfig()
  const cakeImagePath = new URL(
    `../public${config.automation.email.cakeImagePath}`,
    import.meta.url,
  )
  if (!existsSync(cakeImagePath)) {
    throw new Error(
      `邮件蛋糕图片不存在：public${config.automation.email.cakeImagePath}`,
    )
  }
  const result = checkWorkflowSchedule(
    config,
    readFileSync(WORKFLOW_PATH, 'utf8'),
  )

  console.log('✓ birthday.config.json 配置有效')
  if (!result.matched) {
    console.error('✗ GitHub Actions 定时配置不一致')
    console.error(
      `  workflow 实际值: cron "${result.actual.cron}", timezone "${result.actual.timezone}"`,
    )
    console.error(
      `  workflow 期望值: cron "${result.expected.cron}", timezone "${result.expected.timezone}"`,
    )
    process.exitCode = 1
    return
  }

  console.log(
    `✓ Actions 定时一致：${result.birthday.value} ${result.time.value}（${result.actual.timezone}）`,
  )
}

const entryPath = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (import.meta.url === entryPath) {
  try {
    runConfigCheck()
  } catch (error) {
    console.error(
      `✗ 配置检查失败：${error instanceof Error ? error.message : error}`,
    )
    process.exitCode = 1
  }
}
