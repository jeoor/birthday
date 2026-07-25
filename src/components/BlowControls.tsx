import { Mic, MicOff } from 'lucide-react'
import { useEffect } from 'react'
import { useBlowDetection } from '../hooks/useBlowDetection'

interface BlowControlsProps {
  onBlow: () => void
  disabled: boolean
}

export function BlowControls({ onBlow, disabled }: BlowControlsProps) {
  const detector = useBlowDetection(onBlow)
  const detectorStatus = detector.status
  const disableDetector = detector.disable

  useEffect(() => {
    if (disabled && detectorStatus === 'listening') disableDetector()
  }, [detectorStatus, disableDetector, disabled])

  if (!detector.isSupported) {
    return (
      <section className="compact-mic" data-od-id="blow-controls">
        <button className="bar-text-button" type="button" disabled>
          <MicOff size={16} aria-hidden="true" />
          当前浏览器不支持吹气检测
        </button>
      </section>
    )
  }

  const listening = detector.status === 'listening'
  const requesting = detector.status === 'requesting'
  const showFeedback = detector.status !== 'idle'
  const feedback = requesting
    ? '正在请求麦克风权限'
    : listening
      ? '正在聆听'
      : detector.status === 'denied'
        ? '麦克风权限被拒绝'
        : '麦克风暂时不可用'

  return (
    <section className="compact-mic" data-od-id="blow-controls">
      <button
        className="bar-text-button microphone-button"
        type="button"
        onClick={listening ? detector.disable : detector.enable}
        disabled={disabled || requesting}
        aria-label={listening ? '关闭麦克风' : '启用麦克风吹蜡烛'}
      >
        {listening ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
        {requesting ? '请求中…' : listening ? '关闭麦克风' : '麦克风吹蜡烛'}
      </button>
      {detector.status === 'idle' && (
        <span className="microphone-idle-state" aria-hidden="true">· 未启用</span>
      )}
      {showFeedback && <p className="microphone-feedback" role="status">{feedback}</p>}
      {listening && (
        <div
          className="mic-meter"
          role="meter"
          aria-label={`输入音量 ${Math.round(detector.level * 100)}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(detector.level * 100)}
        >
          <span style={{ transform: `scaleX(${detector.level})` }} />
        </div>
      )}
    </section>
  )
}
