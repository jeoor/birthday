# Kayro's Birthday

[![CI](https://github.com/jeoor/kayro-birthday/actions/workflows/ci.yml/badge.svg)](https://github.com/jeoor/kayro-birthday/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-d6b574.svg)](LICENSE)

我自己的私人时间档案。普通日期以编辑式排版记录真实周岁、下一次生日倒计时和当前年龄周期；每年本地时间 1 月 29 日自动切换为包含极简蛋糕、蜡烛、音乐、DOM 纸片动画与可选吹气检测的生日模式。

## 视觉系统

- 近黑色纯色背景、暖白文字和单一暖金强调色；
- 使用开放式栅格、细分隔线和留白建立层级，不使用玻璃拟态卡片；
- 普通模式以超大生日倒计时为第一视觉焦点，当前年龄退为低对比背景水印；
- 生日模式沿用同一排版，只增加真实质感的双状态蛋糕、烛光、音乐与克制的仪式动作；
- 蛋糕使用同一母图衍生的点燃／熄灭 WebP，庆祝纸片通过 DOM 三波节奏动画与暖色余晖渲染；

## 技术栈

- React 18 + TypeScript（严格模式）
- Vite 5
- Tailwind CSS 3 + 原生 CSS
- Motion（原 Framer Motion）
- Lucide React
- date-fns
- WebP 双状态蛋糕、Motion DOM 纸片动画（三波节奏 + 暖色余晖）
- Vitest 62 项单元测试（日期、农历、Hooks、工具函数）+ ESLint 零警告

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

在项目根目录的 `birthday.config.ts` 中修改集中配置：

```ts
export const PERSON = {
  name: 'Kayro',
  birthDate: '2007-01-29',
} as const
```

页面标题位于 `index.html`。日期使用浏览器本地时区；实际周岁通过生日是否已到达判断，不是简单年份相减。

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

## 目录结构

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
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
├── birthday.config.ts
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
