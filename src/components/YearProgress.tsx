import { useEffect, useRef, useState } from 'react'

interface YearProgressProps {
  age: number
  progress: number
  isBenmingYear: boolean
  /** 字体就绪、加载页开始淡出后为 true；此后进度条才滑入，保证动画不被加载页遮挡。 */
  active: boolean
}

export function YearProgress({ age, progress, isBenmingYear, active }: YearProgressProps) {
  const rounded = Math.min(100, Math.max(0, progress))
  const [displayProgress, setDisplayProgress] = useState(0)
  const startedRef = useRef(false)

  // 加载页完全淡出（约 0.3s）后才开始 0 → 当前进度的滑入（CSS transition 平滑过渡），
  // 保证整段动画在可见状态下播放。
  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true
    const timer = window.setTimeout(() => setDisplayProgress(rounded), 380)
    return () => window.clearTimeout(timer)
  }, [active, rounded])

  // 后续数据变化（如每日百分比刷新）同样平滑过渡，不重播。
  useEffect(() => {
    if (startedRef.current) setDisplayProgress(rounded)
  }, [rounded])

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
