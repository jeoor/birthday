import { AnimatePresence, motion } from 'motion/react'
import type { RefObject } from 'react'
import { useState } from 'react'
import { UI_TRANSITION } from '../lib/motion'
import type { CandleState } from '../types/birthday'

interface MinimalCakeProps {
  buttonRef: RefObject<HTMLButtonElement>
  candleState: CandleState
  onBlow: () => void
}

export function MinimalCake({ buttonRef, candleState, onBlow }: MinimalCakeProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const canBlow = candleState === 'lit' || candleState === 'wavering'
  const extinguished = candleState === 'extinguishing' || candleState === 'extinguished'
  const imageSrc = `${import.meta.env.BASE_URL}images/${extinguished ? 'birthday-cake-extinguished-final' : 'birthday-cake-lit-final'}.webp`

  return (
    <motion.button
      ref={buttonRef}
      className="cake-button"
      data-od-id="birthday-cake"
      type="button"
      onClick={() => canBlow && onBlow()}
      aria-label={canBlow ? '点击蛋糕吹灭蜡烛' : 'Kayro 的生日蛋糕'}
      data-candle-state={candleState}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...UI_TRANSITION, delay: 0.06 }}
      >
      <span className="birthday-cake-frame">
        {imageFailed ? (
          <span className="cake-image-fallback" role="status">生日蛋糕暂时无法加载</span>
        ) : (
          <AnimatePresence initial={false} mode="sync">
            <motion.img
              key={imageSrc}
              className="birthday-cake-image"
              src={imageSrc}
              alt=""
              onError={() => setImageFailed(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          </AnimatePresence>
        )}
      </span>
    </motion.button>
  )
}
