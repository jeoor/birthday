import { motion } from 'motion/react'
import { BIRTHDAY } from '../lib/birthday'
import type { BenmingYearState } from '../types/benming'
import { UI_TRANSITION } from '../lib/motion'
import { AgeWatermark } from './AgeWatermark'
import { BenmingAccentLine } from './BenmingAccentLine'
import { BenmingStatus } from './BenmingStatus'
import { CountdownStrip } from './CountdownStrip'

interface OrdinaryCountdownHeroProps {
  age: number
  target: Date
  simulatedNow?: Date
  benmingYear: BenmingYearState
}

export function OrdinaryCountdownHero({
  age,
  target,
  simulatedNow,
  benmingYear,
}: OrdinaryCountdownHeroProps) {
  return (
    <section className="ordinary-countdown-hero" id="top" aria-label={`${BIRTHDAY.name} 的生日倒计时`}>
      <AgeWatermark age={age} />
      <div className="ordinary-countdown-content">
        {benmingYear.isBenmingYear && (
          <motion.div
            className="ordinary-benming-context"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...UI_TRANSITION, delay: 0.06 }}
          >
            <BenmingStatus state={benmingYear} />
            <BenmingAccentLine visible />
          </motion.div>
        )}

        <motion.div
          className="ordinary-countdown-primary"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...UI_TRANSITION, delay: 0.16 }}
        >
          <CountdownStrip
            target={target}
            simulatedNow={simulatedNow}
            hero
          />
        </motion.div>
      </div>
    </section>
  )
}
