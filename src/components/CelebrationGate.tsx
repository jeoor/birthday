import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, X } from 'lucide-react'
import { useEffect } from 'react'
import { BIRTHDAY } from '../lib/birthday'
import { UI_TRANSITION } from '../lib/motion'
import type { BenmingYearState } from '../types/benming'
import { BenmingStatus } from './BenmingStatus'

interface CelebrationGateProps {
  open: boolean
  benmingYear: BenmingYearState
  onStart: () => void
  onDismiss: () => void
}

export function CelebrationGate({
  open,
  benmingYear,
  onStart,
  onDismiss,
}: CelebrationGateProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDismiss, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="celebration-gate"
          data-od-id="celebration-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gate-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button className="gate-close" type="button" onClick={onDismiss} aria-label="暂时关闭生日启动界面">
            <X size={20} aria-hidden="true" />
          </button>
          <motion.div
            className="gate-layout"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={UI_TRANSITION}
          >
            <div className="gate-primary">
              <div className="gate-date-line">
                <p>1 月 29 日</p>
                <BenmingStatus state={benmingYear} />
              </div>
              <h2 id="gate-title">
                <span>生日快乐，</span>
                <span>{BIRTHDAY.name}。</span>
              </h2>
              <button className="editorial-button gate-begin" type="button" onClick={onStart} autoFocus>
                <span>点亮</span><ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
