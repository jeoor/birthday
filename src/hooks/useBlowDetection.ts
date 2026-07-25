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

const BLOW_THRESHOLD = 0.16
const BLOW_DURATION = 650

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
  onBlowRef.current = onBlow

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
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      })
      if (requestToken !== requestTokenRef.current) {
        pendingStream.getTracks().forEach((track) => track.stop())
        return
      }

      pendingContext = new AudioContext()
      const analyser = pendingContext.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.45
      pendingContext.createMediaStreamSource(pendingStream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      streamRef.current = pendingStream
      contextRef.current = pendingContext
      setStatus('listening')

      const analyse = (time: number) => {
        analyser.getByteTimeDomainData(samples)
        let sum = 0
        for (const sample of samples) {
          const normalized = (sample - 128) / 128
          sum += normalized * normalized
        }
        const rms = Math.sqrt(sum / samples.length)
        const normalizedLevel = Math.min(1, rms / 0.32)
        setLevel(normalizedLevel)

        if (rms >= BLOW_THRESHOLD) {
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
