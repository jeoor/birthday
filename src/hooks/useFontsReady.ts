import { useEffect, useState } from 'react'
import birthdayConfig from '../../birthday.config.json'

/**
 * 展示字体清单。sample.text 必须覆盖页面实际渲染的所有字形——
 * 思源宋体/鸿蒙按 unicode-range 切片加载，漏掉的字符（如全角标点）
 * 会在内容显示后才懒加载，导致字体交换跳变。
 */
const PERSON_NAME = birthdayConfig.person.name
const LATIN_NAME = PERSON_NAME.match(/[\u0020-\u007E]+/g)?.join('') ?? ''
const DISPLAY_TEXT = `生日快乐，。${PERSON_NAME}.0123456789 月日天小时分秒岁这一岁还剩下走过·此刻的音乐麦克风吹蜡烛未启用点亮重新吹灭愿望已经收好`
const FONT_CHECKS = [
  { sample: '16px "Newsreader Variable"', text: `0123456789${LATIN_NAME}.` },
  { sample: '16px "Noto Serif SC"', text: DISPLAY_TEXT },
  { sample: '16px "HarmonyOS_Regular"', text: DISPLAY_TEXT },
] as const

/**
 * 兜底超时。正常情况下字体切片在良好网络下 1 秒内完成，
 * 只在网络卡死时结束加载页，避免无限停留。
 */
const LOAD_TIMEOUT_MS = 8000

/**
 * 等待展示字体（Newsreader / Noto Serif SC / HarmonyOS_Regular）
 * 及其所有可见字形切片加载完成，避免文字先以回退字体渲染、
 * 字体到达后字形宽度/位置骤变（FOUT 跳变）。
 * 加载期间页面被全屏加载状态覆盖：用户只会看到最终字体的页面。
 * 字体已缓存时立即放行，加载失败时回退到系统字体并直接渲染。
 */
export function useFontsReady(): boolean {
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined' || typeof document.fonts === 'undefined') {
      setFontsReady(true)
      return
    }

    let cancelled = false
    const finish = () => {
      if (!cancelled) setFontsReady(true)
    }

    const check = async () => {
      try {
        const allLoaded = FONT_CHECKS.every(({ sample, text }) =>
          document.fonts.check(sample, text),
        )
        if (document.fonts.status === 'loaded' && allLoaded) {
          finish()
          return
        }
        // 等所有展示字体及其字形切片真正可用（同时触发其网络加载），
        // 而不是简单等待固定时长。
        await Promise.race([
          (async () => {
            await Promise.all(FONT_CHECKS.map(({ sample, text }) => document.fonts.load(sample, text)))
            await document.fonts.ready
          })(),
          new Promise((resolve) => setTimeout(resolve, LOAD_TIMEOUT_MS)),
        ])
        finish()
      } catch {
        // 字体加载失败：回退字体将保持渲染，不会再有交换跳变。
        finish()
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [])

  return fontsReady
}
