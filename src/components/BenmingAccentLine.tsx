import { motion } from 'motion/react'
import { UI_TRANSITION } from '../lib/motion'

interface BenmingAccentLineProps {
  visible: boolean
}

export function BenmingAccentLine({ visible }: BenmingAccentLineProps) {
  if (!visible) return null

  return (
    <motion.span
      className="benming-accent-line"
      aria-hidden="true"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ ...UI_TRANSITION, duration: 0.5, delay: 0.12 }}
    />
  )
}
