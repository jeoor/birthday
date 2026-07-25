import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { BIRTHDAY } from '../lib/birthday'
import { UI_TRANSITION } from '../lib/motion'
import type { BenmingYearState } from '../types/benming'
import { AgeDisplay } from './AgeDisplay'
import { BenmingStatus } from './BenmingStatus'

interface BirthdayHeroProps {
  age: number
  benmingYear: BenmingYearState
  children: ReactNode
}

export function BirthdayHero({
  age,
  benmingYear,
  children,
}: BirthdayHeroProps) {
  return (
    <section className="birthday-hero" id="top" data-od-id="birthday-hero" aria-labelledby="birthday-title">
      <div className="birthday-copy">
        <motion.p
          className="birthday-date-label"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...UI_TRANSITION, delay: 0.04 }}
        >
          1 月 29 日
        </motion.p>
        <motion.h1
          id="birthday-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...UI_TRANSITION, delay: 0.1 }}
        >
          <span>生日快乐，</span>
          <span>{BIRTHDAY.name}.</span>
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...UI_TRANSITION, delay: 0.2 }}
        >
          <AgeDisplay age={age} />
          <BenmingStatus state={benmingYear} />
        </motion.div>
      </div>
      <motion.div
        className="birthday-stage"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...UI_TRANSITION, delay: 0.32 }}
      >
        {children}
      </motion.div>
    </section>
  )
}
