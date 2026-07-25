import { ArrowRight, Flame, RotateCcw } from 'lucide-react'

interface CakeControlsProps {
  celebrationStarted: boolean
  candlesAreOut: boolean
  canBlow: boolean
  wishRecorded: boolean
  onStartCelebration: () => void
  onLightCandles: () => void
  onBlowOut: () => void
}

export function CakeControls({
  celebrationStarted,
  candlesAreOut,
  canBlow,
  wishRecorded,
  onStartCelebration,
  onLightCandles,
  onBlowOut,
}: CakeControlsProps) {
  return (
    <div className="cake-action-row">
      {!celebrationStarted ? (
        <button className="editorial-button" type="button" onClick={onStartCelebration}>
          点亮 <ArrowRight size={15} aria-hidden="true" />
        </button>
      ) : candlesAreOut ? (
        <button className="editorial-button" type="button" onClick={onLightCandles}>
          重新点亮 <RotateCcw size={14} aria-hidden="true" />
        </button>
      ) : (
        <button className="editorial-button" type="button" onClick={onBlowOut} disabled={!canBlow}>
          吹灭 <Flame size={14} aria-hidden="true" />
        </button>
      )}
      <p className="cake-status" role="status">
        {wishRecorded || candlesAreOut
          ? '愿望已经收好。'
          : celebrationStarted
            ? '蜡烛已点亮'
            : ''}
      </p>
    </div>
  )
}
