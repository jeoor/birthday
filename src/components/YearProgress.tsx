import { useEffect, useRef, useState } from 'react'

interface YearProgressProps {
  age: number
  progress: number
  isBenmingYear: boolean
}

export function YearProgress({ age, progress, isBenmingYear }: YearProgressProps) {
  const rounded = Math.min(100, Math.max(0, progress))
  const targetProgress = useRef(rounded)
  const animationComplete = useRef(false)
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    targetProgress.current = rounded
    if (animationComplete.current) setDisplayProgress(rounded)
  }, [rounded])

  useEffect(() => {
    animationComplete.current = false
    setDisplayProgress(0)
    let frameId: number | undefined
    const delayId = window.setTimeout(() => {
      const startedAt = performance.now()
      const duration = 1600

      const drawProgress = (now: number) => {
        const elapsed = Math.min(1, (now - startedAt) / duration)
        const eased = 1 - Math.pow(1 - elapsed, 3)
        setDisplayProgress(targetProgress.current * eased)

        if (elapsed < 1) {
          frameId = window.requestAnimationFrame(drawProgress)
        } else {
          animationComplete.current = true
          setDisplayProgress(targetProgress.current)
        }
      }

      frameId = window.requestAnimationFrame(drawProgress)
    }, 700)

    return () => {
      window.clearTimeout(delayId)
      if (frameId !== undefined) window.cancelAnimationFrame(frameId)
    }
  }, [age])

  return (
    <section
      className={isBenmingYear ? 'year-progress is-benming' : 'year-progress'}
      data-od-id="year-progress"
      aria-label={`当前 ${age} 岁年龄周期已完成 ${rounded.toFixed(1)}%`}
    >
      <p className="year-progress-note">这一岁，已经走过 {rounded.toFixed(0)}%。</p>
      <div
        className="progress-line"
        role="progressbar"
        aria-label={`年龄周期进度 ${rounded.toFixed(1)}%`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(rounded)}
      >
        <span style={{ transform: `scaleX(${displayProgress / 100})` }} />
      </div>
    </section>
  )
}
