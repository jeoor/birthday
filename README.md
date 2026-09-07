# Kayro's Birthday

[![CI](https://github.com/jeoor/birthday/actions/workflows/ci.yml/badge.svg)](https://github.com/jeoor/birthday/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-d6b574.svg)](LICENSE)

我自己的私人时间档案。普通日期以编辑式排版记录真实周岁、下一次生日倒计时和当前年龄周期；每年本地时间 1 月 29 日自动切换为包含极简蛋糕、蜡烛、音乐、DOM 纸片动画与可选吹气检测的生日模式。

## 视觉系统

- 近黑色纯色背景、暖白文字和单一暖金强调色；
- 使用开放式栅格、细分隔线和留白建立层级，不使用玻璃拟态卡片；
- 普通模式以超大生日倒计时为第一视觉焦点，当前年龄退为低对比背景水印；
- 生日模式沿用同一排版，只增加真实质感的双状态蛋糕、烛光、音乐与克制的仪式动作；
- 蛋糕使用同一母图衍生的点燃／熄灭 WebP；燃烧状态另有按像素对齐的火焰／烛光／烟缕叠加动画，庆祝纸片通过 DOM 三波节奏动画与暖色余晖渲染；

## 技术栈

- React 18 + TypeScript（严格模式）
- Vite 5
- Tailwind CSS 3 + 原生 CSS
- Motion（原 Framer Motion）
- Lucide React
- date-fns
- WebP 双状态蛋糕、按像素对齐的蜡烛火焰叠加动画、Motion DOM 纸片动画（三波节奏 + 暖色余晖）
- 字体：Newsreader Variable（仅 latin 子集）+ 思源宋体 Noto Serif SC（中文衬线）+ HarmonyOS_Regular（中文正文，B 站 CDN）+ JetBrains Mono（等宽）；加载门控防字体交换跳变
- Vitest 69 项单元测试（日期、农历、Hooks、组件、配置与邮件模板）+ ESLint 零警告

项目不依赖后端、jQuery 或 UI 框架。蛋糕资源为本项目生成并内置的本地素材。

## 环境要求

- Node.js 18.18+（推荐 Node.js 20 LTS）
- pnpm 9+
- 现代浏览器（Chrome、Edge、Firefox、Safari 的近期版本）

## 安装与运行

```bash
pnpm install
pnpm dev
```

Vite 会输出本地访问地址，通常为 `http://localhost:5173`。

## 构建、检查与预览

```bash
pnpm lint
pnpm test
pnpm build
pnpm preview
```

生产文件输出到 `dist/`。`vite.config.ts` 使用相对资源路径，可部署在域名根目录或子路径。

## 测试生日模式

开发服务器中可以使用日期参数：

```text
http://localhost:5173/?date=2026-01-29
```

模拟只在 `import.meta.env.DEV` 为真时生效，页面顶部会显示醒目标识。生产构建始终使用浏览器真实本地日期；测试参数不会改变生产逻辑。

## 修改个人信息

在项目根目录的 `birthday.config.json` 中修改集中配置：

```json
{
  "person": {
    "name": "敖苛",
    "birthDate": "2007-01-29"
  }
}
```

同一文件还集中保存邮件定时、SMTP 公开参数、收发件人和站点 URL；密码不在其中。修改后运行 `pnpm cfg` 检查。日期使用浏览器本地时区；实际周岁通过生日是否已到达判断，不是简单年份相减。

## 本命年规则

项目以农历正月初一作为生肖年份切换边界。Kayro 的出生日期在 2007 年春节前，因此生肖由统一配置计算为狗、地支戌；本命年不是按公历年份或年龄取模判断。

`src/lib/lunar-calendar.ts` 内置经过核对的 2000—2100 年春节边界，运行时不联网。超出范围或个人日期无效时会返回明确的降级状态，不会误显示本命年。开发模式的 `?date=yyyy-MM-dd` 与年龄、生日和本命年共用同一个有效日期。

## 替换生日音乐

把拥有合法使用权的 MP3 文件放到：

```text
public/audio/birthday.mp3
```

仓库默认不附带音乐，以避免版权和仓库体积问题。文件缺失、网络失败或浏览器无法解码时，音乐控制条会显示友好提示，蛋糕、蜡烛与其他功能仍可正常使用。

现代浏览器不允许页面在用户没有交互时自动播放有声音的媒体。因此首次点击“开始”后才会调用播放；刷新后即使庆典状态已恢复，也可能需要再次点击播放按钮。

## 麦克风与隐私

吹气检测是可选增强功能：

- 只在用户主动点击“启用吹气检测”后请求权限；
- 音频只在浏览器本地通过 Web Audio API 分析音量，不会上传或保存；
- 持续达到阈值约 650ms 才会触发，普通短促声音不应立即吹灭蜡烛；
- 关闭功能或离开组件时会停止媒体轨道并关闭音频上下文；
- 拒绝权限或设备不可用时，仍可点击蛋糕或按钮吹灭蜡烛。

除 `localhost` 外，浏览器通常只允许在 **HTTPS** 安全上下文中请求麦克风。直接双击打开 `dist/index.html` 不仅不属于推荐预览方式，也通常无法使用麦克风；请用 `pnpm preview` 或 HTTPS 托管。

## 状态持久化

`localStorage` 保存庆典是否开启、当天蜡烛状态、音乐音量和静音。庆典与蜡烛使用形如 `kayro-birthday:2026-01-29:*` 的日期键，因此跨日期自动失效。麦克风权限和输入数据不会保存。

## 部署

### GitHub Pages

1. 将项目推送到 GitHub 仓库。
2. 执行 `pnpm build`。
3. 使用 GitHub Actions 上传 `dist/`，或用 Pages 部署 Action 发布该目录。
4. 在仓库 Settings → Pages 中选择 GitHub Actions。

推荐工作流的构建步骤为 `pnpm install --frozen-lockfile` 和 `pnpm build`，发布目录为 `dist`。项目使用 `base: './'`，仓库子路径部署无需修改资源前缀。

### Vercel

导入仓库后使用：

- Framework Preset：Vite
- Install Command：`pnpm install --frozen-lockfile`
- Build Command：`pnpm build`
- Output Directory：`dist`

### Netlify

导入仓库并设置：

- Build command：`pnpm build`
- Publish directory：`dist`

Vercel 与 Netlify 默认提供 HTTPS，因此可以正常申请麦克风权限。

## 自动生日祝福邮件

每年 1 月 29 日（北京时间），GitHub Actions 会按计划触发 `scripts/send-birthday-email.mjs`——一个零依赖的 Node 18+ 脚本（内置 `node:net`/`node:tls` 最小 SMTP 客户端），通过自己的邮箱服务（飞书 SMTP：`smtp.larksuite.com:465` 隐式 TLS）向 `i@kayro.cn` 发送一封品牌化 HTML 生日祝福邮件，无需打开页面或手工操作：

- 定时器：`.github/workflows/birthday-email.yml` 的年度 cron——通过 `timezone: Asia/Shanghai` 以每年 1 月 29 日北京时间 00:00 为目标时间自动运行一次。GitHub 不保证定时任务严格准点，高负载时可能延迟；脚本内的日期守卫仍会在运行瞬间二次确认，防止手动误触发时错发；
- 统一配置：网页与发信脚本共同读取 `birthday.config.json`。修改后运行 `pnpm cfg`，它会校验字段、日期、邮箱、URL、IANA 时区，并核对 workflow 的 cron/timezone；
- 邮件模板：`scripts/email-template.mjs`——与生日页面同一套视觉语言（近黑信笺、暖白衬线字、金色强调、细分隔线、大留白；蛋糕透明底融入深色卡片；无气泡/头像），姓名、生日和页面地址均来自统一配置；`cakeImagePath` 使用 `public/` 下的站内路径，发信时自动转为绝对 URL；
- 发信脚本：`scripts/send-birthday-email.mjs`——支持 `AUTH LOGIN`、UTF-8 主题与 multipart（纯文本兜底 + HTML 模板）base64 正文，失败时输出 SMTP 应答便于排查；
- 祝福语录：`scripts/birthday-wishes.mjs`——站长提供的语录清单（自动去重），每次发送随机抽取一条，不重样；
- 发件人、收件人和 SMTP 公开参数：均在 `birthday.config.json` 中维护；
- 内容：邮件标题与正文中的年龄由发送时刻按北京时间动态计算，祝福语随机抽取。

配置（一次性）：

1. 仓库 Settings → Secrets and variables → Actions → **Secrets** → New repository secret，名称 **`SMTP_PASS`**，值为发信账号密码/应用授权码；
2. 编辑 `birthday.config.json`，若生日或发送时间变化，同步工作流中的 cron，然后运行 `pnpm cfg`；
3. 检查通过后推送仓库，定时器即生效。

### Secret 与公开配置

- `SMTP_PASS` 是敏感凭据，必须创建为仓库 **Secret**，不能创建为仓库 **Variable**。Variable 默认不会在日志中脱敏，只适合用户名、主机名等非敏感信息；
- `birthday.config.json` 只保存可公开的业务配置，`pnpm cfg` 会拒绝其中出现 `pass` 或 `password` 字段；
- 如果密码曾出现在聊天、日志、提交或导出文件中，必须先在邮箱服务端作废并生成新密码，再更新 `SMTP_PASS`。仅把已经泄露的旧值保存为 Secret，不能恢复其安全性；
- Workflow 仅在实际发信步骤中注入 `SMTP_PASS`，SMTP 调试日志也会隐藏登录账号和密码。

### 定时任务可靠性

此仓库当前是公开仓库。GitHub 会在公开仓库连续 60 天没有活动时自动停用 scheduled workflow；恢复仓库活动或手动重新启用后才会继续运行。因此年度 cron 不能单独保证数月后仍处于启用状态。可选择保持仓库有活动、将仓库设为私有，或使用独立的外部定时服务。详见 [GitHub schedule 文档](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。

验证发送（Actions 页面 → Birthday blessing email → Run workflow）:

- 不勾选 **force**：只有当天恰好是生日（北京）才发，否则日志显示"不是生日，跳过发送"；
- 勾选 **force**：无视日期立即发送一封真实邮件（年龄按当前年份推算）。

本地预览（不发信）：`DRY_RUN=1 node scripts/send-birthday-email.mjs`——无需 SMTP 密码，会输出完整 HTML 模板到 stdout。本地发信测试只需设置 `SMTP_PASS=<密码>` 和 `BIRTHDAY_FORCE=true`；其他值默认读取统一配置，仍可用同名环境变量临时覆盖。`SMTP_DEBUG=1` 只打印脱敏后的 SMTP 对话。

发信密码始终走 GitHub Secret `SMTP_PASS`，不要写入仓库配置、Variable 或日志。

## 目录结构

```text
.
├── .github/
│   └── workflows/
│       ├── birthday-email.yml   # 生日当天 00:00 自动发祝福邮件
│       └── ci.yml
├── scripts/
│   ├── birthday-wishes.mjs     # 祝福语录（随机抽取，自动去重）
│   ├── check-config.mjs        # pnpm cfg 统一配置检查
│   ├── email-template.mjs      # 品牌化 HTML 邮件模板（与生日页面同一套视觉语言）
│   └── send-birthday-email.mjs # 祝福邮件发送脚本（Node 18+，可本地测试/预览）
├── public/
│   ├── audio/
│   │   ├── README.md
│   │   └── birthday.mp3
│   ├── favicon.svg
│   └── images/
│       ├── birthday-cake-extinguished-final.webp
│       └── birthday-cake-lit-final.webp
├── src/
│   ├── components/          # 编辑式 Hero、倒计时、图片蛋糕与控制组件
│   ├── hooks/               # 日期、倒计时、音频与麦克风
│   ├── lib/                 # 个人配置、生日/农历边界算法和存储工具
│   ├── styles/              # CSS tokens、布局、倒计时、生日、控件、庆祝、响应式
│   ├── test/                # 生日、本命年、工具函数与 hooks 单元测试
│   ├── types/               # 共享类型
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .gitattributes
├── .gitignore
├── LICENSE
├── README.md
├── birthday.config.json        # 网页与邮件自动化的唯一业务配置源
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

`pnpm-lock.yaml` 由 `pnpm install` 自动生成，不应手动编辑。

## 常见问题

**音乐显示“无音乐模式”**

确认文件名严格为 `birthday.mp3`，路径为 `public/audio/birthday.mp3`，并确认文件本身可被浏览器解码。文件缺失不会导致页面崩溃。

**麦克风按钮不出现或无法授权**

使用 `localhost` 或 HTTPS 地址，检查浏览器站点权限、系统隐私权限以及麦克风是否被其他程序独占。不支持相关 API 的浏览器会自动隐藏入口。

**日期与预期不一致**

项目按浏览器本地时区判断生日。检查系统日期、时间和时区；开发模式可用 `?date=yyyy-MM-dd` 验证边界。

**刷新后蜡烛仍是熄灭状态**

这是当天状态恢复功能。点击“重新点亮蜡烛”即可；跨到另一天后该状态会自动失效。
