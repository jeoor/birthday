import { motion } from 'motion/react'
import type { Variants } from 'motion/react'
import type { CandleState } from '../types/birthday'

/**
 * Animated flame, glow and smoke overlay for the lit cake image.
 *
 * Positions were measured from the 1254×1254 source image (yellow-pixel
 * scan): the three candle flames sit at ~45.9% / 50.8% / 55.6% horizontally,
 * their tips at ~9.0% from the top of the frame. The overlays are sized in
 * percentages of the square cake frame so alignment holds at any size.
 */

const FLAME_POSITIONS = [45.93, 50.76, 55.58] as const
const FLAME_WIDTH = 2.4 // % of frame width
const FLAME_HEIGHT = 3.5 // % of frame height
const FLAME_BOTTOM = 90.2 // % from frame bottom (flame base at candle tip)

const flameVariants: Variants = {
  unlit: { opacity: 0, scale: 0.5 },
  lighting: {
    opacity: [0, 1],
    scale: [0.6, 1.18, 1],
    y: [0, -1],
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  lit: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  wavering: (index: number) => ({
    opacity: [1, 0.88, 1, 0.94, 1],
    scale: [1, 1.06, 0.97, 1.03, 1],
    transition: {
      duration: 0.85 + index * 0.12,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    },
  }),
  extinguishing: {
    opacity: 0,
    scale: 0.35,
    y: 1.5,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
  extinguished: { opacity: 0, scale: 0.35, y: 1.5 },
}

const glowVariants: Variants = {
  unlit: { opacity: 0 },
  lighting: { opacity: [0, 0.7], transition: { duration: 0.35, ease: 'easeOut' } },
  lit: { opacity: 0.7, transition: { duration: 0.25 } },
  wavering: {
    opacity: [0.55, 0.72, 0.55],
    transition: { duration: 2.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
  },
  extinguishing: { opacity: 0, transition: { duration: 0.4 } },
  extinguished: { opacity: 0 },
}

const smokeVariants: Variants = {
  extinguishing: (index: number) => ({
    opacity: [0, 0.5, 0],
    y: [0, -26],
    scale: [0.9, 1.5],
    // 时长控制在 560ms 的"熄灭中"窗口内，避免冒烟动画被截断。
    transition: { duration: 0.5, delay: 0.02 + index * 0.04, ease: 'easeOut' },
  }),
}

interface CandleFlamesProps {
  state: CandleState
}

export function CandleFlames({ state }: CandleFlamesProps) {
  // 仅在"熄灭中"渲染烟缕：恢复"已熄灭"状态的冷加载不冒烟。
  const showSmoke = state === 'extinguishing'

  return (
    <span className="candle-flames" aria-hidden="true">
      <motion.span
        className="candle-glow"
        variants={glowVariants}
        initial={false}
        animate={state}
      />
      {FLAME_POSITIONS.map((x, index) => (
        <motion.span
          key={x}
          className="candle-flame"
          style={{
            left: `calc(${x}% - ${FLAME_WIDTH / 2}%)`,
            width: `${FLAME_WIDTH}%`,
            height: `${FLAME_HEIGHT}%`,
            bottom: `${FLAME_BOTTOM}%`,
          }}
          custom={index}
          variants={flameVariants}
          initial={false}
          animate={state}
        >
          <svg viewBox="0 0 12 17.5" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <defs>
              <linearGradient id="flame-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffe08a" />
                <stop offset="0.55" stopColor="#f2b34d" />
                <stop offset="1" stopColor="#e08c33" />
              </linearGradient>
              <filter id="flame-soft" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="0.45" />
              </filter>
            </defs>
            <g filter="url(#flame-soft)">
              <path
                d="M6 0.5 C8.1 3.6 11.2 6.8 11.2 10.3 A5.2 5.2 0 1 1 0.8 10.3 C0.8 6.8 3.9 3.6 6 0.5 Z"
                fill="url(#flame-fill)"
              />
              <path
                d="M6 6.2 C7 7.6 8.3 9 8.3 11 A2.3 2.3 0 1 1 3.7 11 C3.7 9 5 7.6 6 6.2 Z"
                fill="#fff1c2"
                opacity="0.9"
              />
            </g>
          </svg>
        </motion.span>
      ))}
      {showSmoke &&
        FLAME_POSITIONS.map((x, index) => (
          <motion.span
            key={`smoke-${x}`}
            className="candle-smoke"
            style={{
              left: `calc(${x}% - 0.55%)`,
              bottom: `${FLAME_BOTTOM}%`,
            }}
            custom={index}
            variants={smokeVariants}
            initial="extinguishing"
            animate={state}
          />
        ))}
    </span>
  )
}
