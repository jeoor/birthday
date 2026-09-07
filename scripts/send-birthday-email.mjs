// 生日祝福邮件发送脚本（Node 18+，零依赖，仅用 Node 内置模块）。
// 使用内置 node:net / node:tls 实现最小 SMTP 客户端（隐式 TLS，465 端口）。
// 由 .github/workflows/birthday-email.yml 每个北京时间 00:00 调用，
// 只有当天是生日（由 birthday.config.json 读取，按配置时区判定）时才发送。
// 邮件模板见 scripts/email-template.mjs。
//
// 公开默认值来自 birthday.config.json；以下环境变量可临时覆盖：
//   SMTP_HOST      SMTP 服务器
//   SMTP_PORT      SMTP 端口
//   SMTP_SECURE    是否隐式 TLS
//   SMTP_USER      SMTP 登录账号
//   SMTP_PASS      发信账号密码/应用授权密码
//   SENDER_EMAIL   发件地址
//   SENDER_NAME    发件人显示名称
//   TO_EMAIL       收件地址
//   BIRTH_YEAR     出生年份
//   BIRTH_MONTH    生日月份
//   BIRTH_DAY      生日日期
//   BIRTHDAY_FORCE 设为 true 时忽略日期检查直接发送（手动触发测试用）
//   CAKE_IMAGE_URL 蛋糕图片地址
//   SITE_URL       生日页面地址
//   SMTP_DEBUG     设为 1 时打印脱敏后的 SMTP 交互日志
//   DRY_RUN        设为 1 时只打印邮件 HTML 到 stdout，不发送（本地预览用）

import net from 'node:net'
import tls from 'node:tls'
import { pickBirthdayWish } from './birthday-wishes.mjs'
import { loadBirthdayConfig, readBirthDate } from './check-config.mjs'
import { buildEmailHtml, buildEmailPlain } from './email-template.mjs'

const env = process.env
const projectConfig = loadBirthdayConfig()
const emailConfig = projectConfig.automation.email
const birthday = readBirthDate(projectConfig.person.birthDate)
const config = {
  host: env.SMTP_HOST ?? emailConfig.smtp.host,
  port: Number(env.SMTP_PORT ?? emailConfig.smtp.port),
  secure:
    env.SMTP_SECURE === undefined
      ? emailConfig.smtp.secure
      : env.SMTP_SECURE !== 'false',
  user: env.SMTP_USER ?? emailConfig.smtp.user,
  pass: env.SMTP_PASS,
  from: env.SENDER_EMAIL ?? emailConfig.sender.email,
  fromName: env.SENDER_NAME ?? emailConfig.sender.name,
  to: env.TO_EMAIL ?? emailConfig.recipient,
  personName: projectConfig.person.name,
  birthYear: Number(env.BIRTH_YEAR ?? birthday.year),
  birthMonth: Number(env.BIRTH_MONTH ?? birthday.month),
  birthDay: Number(env.BIRTH_DAY ?? birthday.day),
  timeZone: projectConfig.automation.schedule.timezone,
  force: env.BIRTHDAY_FORCE === '1' || env.BIRTHDAY_FORCE === 'true',
  siteUrl: env.SITE_URL ?? emailConfig.siteUrl,
  cakeImageUrl:
    env.CAKE_IMAGE_URL ??
    new URL(emailConfig.cakeImagePath, env.SITE_URL ?? emailConfig.siteUrl).href,
  footerText: emailConfig.footerText,
  dryRun: env.DRY_RUN === '1',
  debug: env.SMTP_DEBUG === '1',
}

if (
  !config.dryRun &&
  (!config.host || !config.user || !config.pass || !config.to)
) {
  console.error('[birthday-email] 缺少必要的 SMTP 配置（SMTP_HOST / SMTP_USER / SMTP_PASS / TO_EMAIL）。')
  process.exit(1)
}

// 按统一配置中的时区判定“今天”与周岁。
const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: config.timeZone,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}).formatToParts(new Date())
const now = Object.fromEntries(parts.filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]))

console.log(
  `[birthday-email] 生日配置：${config.birthYear}-${config.birthMonth}-${config.birthDay}（${config.timeZone}）`,
)

if (!config.force && !config.dryRun && (now.month !== config.birthMonth || now.day !== config.birthDay)) {
      console.log(`[birthday-email] 今天（${now.year}-${now.month}-${now.day}，${config.timeZone}）不是生日，跳过发送。`)
  process.exit(0)
}

const age = now.year - config.birthYear

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`
}

function base64(value) {
  return Buffer.from(value, 'utf8').toString('base64')
}

/** base64 按 76 字符换行（RFC 5322 行长度限制内）。 */
function encodeBody(text) {
  return Buffer.from(text, 'utf8')
    .toString('base64')
    .replace(/(.{76})/g, '$1\r\n')
    .replace(/\r\n$/, '')
}

function buildMultipart(html, plain) {
  const boundary = `----=_hbd_${Math.random().toString(16).slice(2, 10)}`
  const parts = [
    `--${boundary}\r\n` +
      'Content-Type: text/plain; charset="UTF-8"\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      `${encodeBody(plain)}\r\n`,
    `--${boundary}\r\n` +
      'Content-Type: text/html; charset="UTF-8"\r\n' +
      'Content-Transfer-Encoding: base64\r\n' +
      '\r\n' +
      `${encodeBody(html)}\r\n`,
    `--${boundary}--\r\n`,
  ]
  return { boundary, body: parts.join('') }
}

/**
 * 最小 SMTP 行协议连接。
 * 关键点：缓冲区内没有等待者时缓存的字节不会被消费，
 * 多行回复（如 "250-xxx\r\n250 xxx"）连同同一数据包到达时不会丢失任何一行。
 */
function createConnection(host, port, secure) {
  const socket = secure
    ? tls.connect({ host, port, servername: host })
    : net.connect(port, host)
  socket.setTimeout(20_000, () => socket.destroy(new Error('SMTP 连接超时')))

  let buffer = ''
  const waiters = []
  socket.on('error', (error) => {
    for (const waiter of waiters.splice(0)) waiter.reject(error)
  })
  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8')
    let idx
    while ((idx = buffer.indexOf('\r\n')) !== -1 && waiters.length > 0) {
      const line = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const waiter = waiters.shift()
      waiter.resolve(line)
    }
  })

  return {
    socket,
    readLine() {
      return new Promise((resolve, reject) => {
        const idx = buffer.indexOf('\r\n')
        if (idx !== -1) {
          const line = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)
          resolve(line)
          return
        }
        waiters.push({ resolve, reject })
      })
    },
    send(line, { sensitive = false } = {}) {
      if (config.debug) {
        console.log('[smtp >]', sensitive ? '[REDACTED]' : line.slice(0, 120))
      }
      socket.write(line + '\r\n')
    },
    async readReply() {
      const lines = []
      let line = await this.readLine()
      lines.push(line)
      while (line.length >= 4 && line[3] === '-') {
        line = await this.readLine()
        lines.push(line)
      }
      if (config.debug) console.log('[smtp <]', lines.join(' | '))
      return lines
    },
    async expect(code) {
      const lines = await this.readReply()
      if (Number(lines.at(-1).slice(0, 3)) !== code) {
        throw new Error(`SMTP 期望 ${code}，实际收到：${lines.join('\n')}`)
      }
      return lines
    },
  }
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}

async function main() {
  // 祝福语录随机抽取一条（不重样）。
  const wish = pickBirthdayWish()
  console.log(`[birthday-email] 祝福语录：${wish}`)

  const html = buildEmailHtml({
    name: config.personName,
    age,
    birthMonth: config.birthMonth,
    birthDay: config.birthDay,
    cakeImageUrl: config.cakeImageUrl,
    siteUrl: config.siteUrl,
    footerText: config.footerText,
    wish,
  })
  const plain = buildEmailPlain({
    name: config.personName,
    age,
    birthMonth: config.birthMonth,
    birthDay: config.birthDay,
    siteUrl: config.siteUrl,
    wish,
  })

  if (config.dryRun) {
    console.log(html)
    return
  }

  const { body, boundary } = buildMultipart(html, plain)
  const conn = createConnection(config.host, config.port, config.secure)

  try {
    await withTimeout(conn.expect(220), 20_000, '等待服务器欢迎消息超时')

    conn.send(`EHLO ${config.host}`)
    await conn.expect(250)

    conn.send('AUTH LOGIN')
    await conn.expect(334)
    conn.send(base64(config.user), { sensitive: true })
    await conn.expect(334)
    conn.send(base64(config.pass), { sensitive: true })
    await conn.expect(235)

    conn.send(`MAIL FROM:<${config.from}>`)
    await conn.expect(250)
    conn.send(`RCPT TO:<${config.to}>`)
    await conn.expect(250)

    conn.send('DATA')
    await conn.expect(354)

    const headers = [
      `From: ${encodeHeader(config.fromName)} <${config.from}>`,
      `To: <${config.to}>`,
      `Subject: ${encodeHeader(`🎂 生日快乐，${config.personName}！今天 ${age} 岁`)}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ]
    conn.send(headers.join('\r\n') + '\r\n\r\n' + body + '.')
    await conn.expect(250)

    conn.send('QUIT')
    await conn.expect(221).catch(() => {})
    console.log('[birthday-email] 祝福邮件已发送。')
  } finally {
    conn.socket.end()
  }
}

try {
  await main()
} catch (error) {
  console.error(`[birthday-email] 发送失败：${error?.message ?? error}`)
  process.exit(1)
}
