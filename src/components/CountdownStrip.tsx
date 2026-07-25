import { memo } from 'react'
import { useCountdown } from '../hooks/useCountdown'

interface CountdownStripProps {
  target: Date
  simulatedNow?: Date
  hero?: boolean
}

const units = [
  ['days', '天'],
  ['hours', '小时'],
  ['minutes', '分钟'],
  ['seconds', '秒'],
] as const

export const CountdownStrip = memo(function CountdownStrip({
  target,
  simulatedNow,
  hero = false,
}: CountdownStripProps) {
  const countdown = useCountdown(target, simulatedNow)

  return (
    <section
      className={hero ? 'countdown-section is-hero' : 'countdown-section'}
      data-od-id={hero ? 'birthday-countdown-hero' : 'birthday-countdown'}
      aria-label="距离下一次生日的倒计时"
    >
      <p className="countdown-kicker">这一岁，还剩下</p>
      <div className="countdown-strip" role="timer" aria-live="off">
        {units.map(([key, label]) => (
          <div className="countdown-unit" key={key}>
            <strong>{String(countdown[key]).padStart(2, '0')}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
})
