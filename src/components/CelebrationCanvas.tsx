import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface CelebrationCanvasProps {
  onComplete: () => void
}

const COLOR_PALETTE = {
  gold: '#d6b574',
  goldLight: '#e2c58c',
  goldPale: '#c9a85c',
  white: '#f1eee7',
  silver: '#bdb8ae',
  muted: '#918b82',
  warm: '#d4c5a0',
} as const

const STRIP_COLORS = [
  COLOR_PALETTE.gold,
  COLOR_PALETTE.gold,
  COLOR_PALETTE.gold,
  COLOR_PALETTE.goldLight,
  COLOR_PALETTE.white,
  COLOR_PALETTE.white,
  COLOR_PALETTE.silver,
  COLOR_PALETTE.goldPale,
  COLOR_PALETTE.warm,
  COLOR_PALETTE.muted,
] as const

interface StripDef {
  id: number
  startX: number
  startY: number
  endX: number
  endY: number
  width: number
  height: number
  color: string
  rotate: number
  duration: number
  delay: number
  wave: number
}

function buildStrips(width: number, height: number, count: number): StripDef[] {
  const strips: StripDef[] = []

  const waves = [
    { count: Math.floor(count * 0.2), delayOffset: 0, density: 0.5 },
    { count: Math.floor(count * 0.5), delayOffset: 0.35, density: 1.5 },
    { count: Math.floor(count * 0.3), delayOffset: 0.8, density: 0.7 },
  ]

  let globalId = 0
  for (let w = 0; w < waves.length; w++) {
    const wave = waves[w]
    for (let i = 0; i < wave.count; i++) {
      const startX = Math.random() * width
      const startY = -(Math.random() * height * 0.45 + height * 0.05)
      const driftX = (Math.random() - 0.5) * width * 0.55
      const endX = startX + driftX
      const endY = height + Math.random() * 100

      const isNarrow = Math.random() < 0.35
      strips.push({
        id: globalId,
        startX,
        startY,
        endX,
        endY,
        width: isNarrow ? 2 + Math.random() * 3 : 5 + Math.random() * 10,
        height: isNarrow ? 10 + Math.random() * 18 : 3 + Math.random() * 7,
        color: STRIP_COLORS[Math.floor(Math.random() * STRIP_COLORS.length)],
        rotate: (Math.random() - 0.5) * 50,
        duration: 3.0 + Math.random() * 2.5,
        delay: wave.delayOffset + Math.random() * 1.5,
        wave: w,
      })
      globalId++
    }
  }

  return strips
}

export function CelebrationCanvas({ onComplete }: CelebrationCanvasProps) {
  const onCompleteRef = useRef(onComplete)

  // 渲染期间不允许写 ref：在 effect 中同步最新回调。
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const [ready, setReady] = useState(false)

  const strips = useMemo(() => {
    // Window dimensions are read once at mount time for confetti layout.
    // An empty deps array is intentional — this runs only on mount/key change.
    const w = window.innerWidth
    const h = window.innerHeight
    const mobile = w < 640
    return buildStrips(w, h, mobile ? 42 : 72)
  }, [])

  useEffect(() => {
    // 下一次事件循环再置 ready：既满足"挂载后再渲染纸片"的动画需要，
    // 也避免在 effect 体内同步 setState（新 hooks 规则）。
    const readyTimer = window.setTimeout(() => setReady(true), 0)
    const maxEnd = strips.reduce((m, s) => Math.max(m, s.delay + s.duration), 0)
    const timer = setTimeout(() => onCompleteRef.current(), (maxEnd + 0.5) * 1000)
    return () => {
      window.clearTimeout(readyTimer)
      clearTimeout(timer)
    }
  }, [strips])

  if (!ready) return null

  return (
    <div className="celebration-canvas" aria-hidden="true">
      {/* Warm ambient glow — fades in at candle-blow moment */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.12, 0.06, 0] }}
        transition={{ duration: 2.2, times: [0, 0.12, 0.5, 1], ease: 'easeOut' }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 60% 50% at 50% 40%, ${COLOR_PALETTE.gold} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Confetti strips — 3 waves */}
      {strips.map((s) => (
        <motion.div
          key={s.id}
          initial={{
            x: s.startX,
            y: s.startY,
            opacity: 0,
            rotate: 0,
          }}
          animate={{
            x: s.endX,
            y: s.endY,
            opacity: [0, 0.7, 0.6, 0.45, 0],
            rotate: s.rotate,
          }}
          transition={{
            duration: s.duration,
            delay: s.delay,
            ease: 'linear',
            times: [0, 0.06, 0.35, 0.75, 1],
          }}
          style={{
            position: 'absolute',
            width: s.width,
            height: s.height,
            backgroundColor: s.color,
          }}
        />
      ))}
    </div>
  )
}
