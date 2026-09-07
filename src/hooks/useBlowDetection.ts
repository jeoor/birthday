import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicrophoneStatus } from '../types/birthday'

interface BlowDetectionState {
  isSupported: boolean
  status: MicrophoneStatus
  level: number
  message: string
  enable: () => Promise<void>
  disable: () => void
}

/** 校准阶段：启用后前若干帧用于测量本底噪声（约 250ms）。 */
const CALIBRATION_FRAMES = 15
/** 自适应阈值下限/上限：安静环境更灵敏，嘈杂环境抬高阈值防误触。 */
const BLOW_THRESHOLD_MIN = 0.1
const BLOW_THRESHOLD_MAX = 0.3
/** 阈值 = 本底噪声中位数 × 该系数，再 clamp 到上下限之间。 */
const BLOW_THRESHOLD_WEIGHT = 2.5
/** 吹气需持续时长（毫秒）。 */
const BLOW_DURATION = 650
/** 峰值/RMS 比上限：吹气是平稳噪声（≈1–3），说话有高频尖峰（>4.5），用于排除大声说话。 */
const CREST_LIMIT = 4.5

const MESSAGES: Record<MicrophoneStatus, string> = {
  idle: '只有你点开它时，才会请求麦克风权限。',
  requesting: '等你允许麦克风…',
  listening: '靠近一点，轻轻吹一口气。',
  denied: '没关系，也可以直接按按钮许愿。',
  unsupported: '这个浏览器暂时听不到你的愿望。',
  error: '麦克风没有准备好，直接按按钮也一样。',
}

export function useBlowDetection(onBlow: () => void): BlowDetectionState {
  const isSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window.AudioContext !== 'undefined'
  const [status, setStatus] = useState<MicrophoneStatus>(isSupported ? 'idle' : 'unsupported')
  const [level, setLevel] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const frameRef = useRef<number | null>(null)
  const blowStartedRef = useRef<number | null>(null)
  const onBlowRef = useRef(onBlow)
  const requestTokenRef = useRef(0)

  // 渲染期间不允许写 ref：在 effect 中同步最新回调。
  useEffect(() => {
    onBlowRef.current = onBlow
  }, [onBlow])

  const disable = useCallback(() => {
    requestTokenRef.current += 1
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (contextRef.current && contextRef.current.state !== 'closed') {
      void contextRef.current.close()
    }
    contextRef.current = null
    blowStartedRef.current = null
    setLevel(0)
    setStatus(isSupported ? 'idle' : 'unsupported')
  }, [isSupported])

  const enable = useCallback(async () => {
    if (!isSupported || status === 'requesting' || status === 'listening') return
    const requestToken = requestTokenRef.current + 1
    requestTokenRef.current = requestToken
    let pendingStream: MediaStream | null = null
    let pendingContext: AudioContext | null = null
    setStatus('requesting')
    try {
      pendingStream = await navigator.mediaDevices.getUserMedia({
        // 关闭自动增益（否则吹气能量会被抹平）；关闭降噪（WebRTC 会主动
        // 衰减"稳态噪声"，而吹气恰恰是稳态宽带噪声）；仅保留回声消除。
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      })
      if (requestToken !== requestTokenRef.current) {
        pendingStream.getTracks().forEach((track) => track.stop())
        return
      }

      pendingContext = new AudioContext()
      // iOS Safari：在 await getUserMedia 之后创建，激活窗口可能已过期，
      // context 会停在 suspended——必须显式 resume，否则完全检测不到声音。
      if (pendingContext.state !== 'running') await pendingContext.resume()
      if (requestToken !== requestTokenRef.current) {
        pendingStream.getTracks().forEach((track) => track.stop())
        if (pendingContext.state !== 'closed') void pendingContext.close()
        return
      }
      const analyser = pendingContext.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.45
      pendingContext.createMediaStreamSource(pendingStream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      streamRef.current = pendingStream
      contextRef.current = pendingContext
      setStatus('listening')

      // 校准：前 CALIBRATION_FRAMES 帧只测本底噪声（取中位数），
      // 之后阈值 = 本底 × 权重，随环境自适应。
      const calibrationSamples: number[] = []
      let calibrationFrame = 0
      let blowThreshold = BLOW_THRESHOLD_MIN

      const analyse = (time: number) => {
        analyser.getByteTimeDomainData(samples)
        let sum = 0
        let peak = 0
        for (const sample of samples) {
          const normalized = (sample - 128) / 128
          const absolute = Math.abs(normalized)
          if (absolute > peak) peak = absolute
          sum += normalized * normalized
        }
        const rms = Math.sqrt(sum / samples.length)
        const normalizedLevel = Math.min(1, rms / 0.32)
        setLevel(normalizedLevel)

        if (calibrationFrame < CALIBRATION_FRAMES) {
          calibrationSamples.push(rms)
          calibrationFrame += 1
          if (calibrationFrame === CALIBRATION_FRAMES) {
            calibrationSamples.sort((a, b) => a - b)
            const baseline = calibrationSamples[Math.floor(calibrationSamples.length / 2)]
            blowThreshold = Math.min(
              BLOW_THRESHOLD_MAX,
              Math.max(BLOW_THRESHOLD_MIN, baseline * BLOW_THRESHOLD_WEIGHT),
            )
          }
          frameRef.current = requestAnimationFrame(analyse)
          return
        }

        if (rms >= blowThreshold && peak / rms <= CREST_LIMIT) {
          blowStartedRef.current ??= time
          if (time - blowStartedRef.current >= BLOW_DURATION) {
            onBlowRef.current()
            blowStartedRef.current = null
          }
        } else {
          blowStartedRef.current = null
        }
        frameRef.current = requestAnimationFrame(analyse)
      }
      frameRef.current = requestAnimationFrame(analyse)
    } catch (caught) {
      pendingStream?.getTracks().forEach((track) => track.stop())
      if (pendingContext && pendingContext.state !== 'closed') void pendingContext.close()
      if (requestToken !== requestTokenRef.current) return
      const denied = caught instanceof DOMException && (caught.name === 'NotAllowedError' || caught.name === 'SecurityError')
      setStatus(denied ? 'denied' : 'error')
      streamRef.current = null
      contextRef.current = null
    }
  }, [isSupported, status])

  useEffect(() => disable, [disable])

  return { isSupported, status, level, message: MESSAGES[status], enable, disable }
}
