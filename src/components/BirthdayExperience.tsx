import { useCallback, useEffect, useRef, useState } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { readBoolean, writeStorage } from '../lib/utils'
import type { CandleState } from '../types/birthday'
import type { BenmingYearState } from '../types/benming'
import { BirthdayHero } from './BirthdayHero'
import { BlowControls } from './BlowControls'
import { CakeControls } from './CakeControls'
import { CelebrationCanvas } from './CelebrationCanvas'
import { CelebrationGate } from './CelebrationGate'
import { MinimalCake } from './MinimalCake'
import { MusicControls } from './MusicControls'

interface BirthdayExperienceProps {
  age: number
  celebrationStarted: boolean
  onCelebrationChange: (started: boolean) => void
  storageKey: string
  benmingYear: BenmingYearState
}

export function BirthdayExperience({
  age,
  celebrationStarted,
  onCelebrationChange,
  storageKey,
  benmingYear,
}: BirthdayExperienceProps) {
  const candlesOutKey = `${storageKey}:candles-out`
  const initialCandlesOut = readBoolean(candlesOutKey)
  const [candleState, setCandleState] = useState<CandleState>(() =>
    initialCandlesOut ? 'extinguished' : celebrationStarted ? 'wavering' : 'unlit',
  )
  const [wishRecorded, setWishRecorded] = useState(initialCandlesOut)
  const [gateOpen, setGateOpen] = useState(!celebrationStarted)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const cakeRef = useRef<HTMLButtonElement>(null)
  const timersRef = useRef<number[]>([])
  const player = useAudioPlayer(`${import.meta.env.BASE_URL}audio/birthday.mp3`)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay)
    timersRef.current.push(timer)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const lightCandles = useCallback(() => {
    clearTimers()
    setWishRecorded(false)
    setCandleState('lighting')
    writeStorage(candlesOutKey, false)
    schedule(() => setCandleState('lit'), 300)
    schedule(() => setCandleState('wavering'), 620)
  }, [candlesOutKey, clearTimers, schedule])

  const startCelebration = useCallback(() => {
    onCelebrationChange(true)
    writeStorage(`${storageKey}:celebration-started`, true)
    setGateOpen(false)
    lightCandles()
    void player.play()
  }, [lightCandles, onCelebrationChange, player, storageKey])

  const blowOutCandles = useCallback(() => {
    if (candleState !== 'lit' && candleState !== 'wavering') return
    clearTimers()
    setCandleState('extinguishing')
    setBurstKey((current) => current + 1)
    setIsCelebrating(true)
    schedule(() => {
      setCandleState('extinguished')
      setWishRecorded(true)
      writeStorage(candlesOutKey, true)
    }, 560)
  }, [candleState, candlesOutKey, clearTimers, schedule])

  const dismissGate = useCallback(() => setGateOpen(false), [])

  const candlesAreOut = candleState === 'extinguished' || candleState === 'extinguishing'
  const canBlow = candleState === 'lit' || candleState === 'wavering'

  return (
    <>
      {isCelebrating && (
        <CelebrationCanvas
          key={burstKey}
          onComplete={() => setIsCelebrating(false)}
        />
      )}
      <CelebrationGate
        open={gateOpen}
        benmingYear={benmingYear}
        onStart={startCelebration}
        onDismiss={dismissGate}
      />
      <BirthdayHero age={age} benmingYear={benmingYear}>
        <div className="cake-stage">
          <MinimalCake
            buttonRef={cakeRef}
            candleState={candleState}
            onBlow={blowOutCandles}
          />
          <CakeControls
            celebrationStarted={celebrationStarted}
            candlesAreOut={candlesAreOut}
            canBlow={canBlow}
            wishRecorded={wishRecorded}
            onStartCelebration={startCelebration}
            onLightCandles={lightCandles}
            onBlowOut={blowOutCandles}
          />
        </div>
      </BirthdayHero>

      {celebrationStarted && (
        <div className="bottom-bar birthday-controls">
          <MusicControls player={player} />
          <BlowControls onBlow={blowOutCandles} disabled={!canBlow} />
        </div>
      )}
    </>
  )
}
