import { useEffect, useState } from 'react'

interface AgeWatermarkProps {
  age: number
}

export function AgeWatermark({ age }: AgeWatermarkProps) {
  const [displayAge, setDisplayAge] = useState(0)

  useEffect(() => {
    if (age <= 0) {
      setDisplayAge(age)
      return
    }

    setDisplayAge(0)
    let currentAge = 0
    let intervalId: number | undefined
    const stepDelay = Math.max(70, Math.min(120, 1800 / age))
    const startId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        currentAge += 1
        setDisplayAge(currentAge)

        if (currentAge >= age && intervalId !== undefined) {
          window.clearInterval(intervalId)
        }
      }, stepDelay)
    }, 180)

    return () => {
      window.clearTimeout(startId)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [age])

  return (
    <span className="age-watermark" aria-hidden="true">
      {displayAge}
    </span>
  )
}
