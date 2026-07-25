import { useCallback, useEffect, useRef, useState } from 'react'
import { clamp, readBoolean, readNumber, writeStorage } from '../lib/utils'

export type AudioStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'error'

export interface AudioPlayerState {
  status: AudioStatus
  volume: number
  muted: boolean
  currentTime: number
  duration: number
  error: string | null
  play: () => Promise<void>
  pause: () => void
  toggleMuted: () => void
  setVolume: (value: number) => void
  seek: (value: number) => void
}

const VOLUME_KEY = 'kayro-birthday:music-volume'
const MUTED_KEY = 'kayro-birthday:music-muted'
const DEFAULT_VOLUME = 0.68

export function useAudioPlayer(src: string): AudioPlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [status, setStatus] = useState<AudioStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volumeState, setVolumeState] = useState(() => clamp(readNumber(VOLUME_KEY, DEFAULT_VOLUME), 0, 1))
  const [muted, setMuted] = useState(() => readBoolean(MUTED_KEY))

  useEffect(() => {
    const audio = new Audio(src)
    audio.preload = 'metadata'
    audio.loop = true
    audio.volume = volumeState
    audio.muted = muted
    audioRef.current = audio

    const handleReady = () => setStatus((current) => (current === 'loading' ? 'ready' : current))
    const handlePlay = () => setStatus('playing')
    const handlePause = () => setStatus((current) => (current === 'error' ? 'error' : 'paused'))
    const syncDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const syncCurrentTime = () => setCurrentTime(audio.currentTime)
    const handleError = () => {
      setError('未找到生日音乐，其他功能仍可使用。')
      setStatus('error')
    }

    audio.addEventListener('canplay', handleReady)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('loadedmetadata', syncDuration)
    audio.addEventListener('durationchange', syncDuration)
    audio.addEventListener('timeupdate', syncCurrentTime)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeEventListener('canplay', handleReady)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('loadedmetadata', syncDuration)
      audio.removeEventListener('durationchange', syncDuration)
      audio.removeEventListener('timeupdate', syncCurrentTime)
      audio.removeEventListener('error', handleError)
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
    // 音量和静音变化由独立 effect 同步，避免重建 Audio 实例。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volumeState
    writeStorage(VOLUME_KEY, volumeState)
  }, [volumeState])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
    writeStorage(MUTED_KEY, muted)
  }, [muted])

  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || status === 'error') return
    try {
      await audio.play()
      setError(null)
    } catch {
      setError('浏览器阻止了播放，请再次点击播放按钮。')
      setStatus('paused')
    }
  }, [status])

  const pause = useCallback(() => audioRef.current?.pause(), [])
  const toggleMuted = useCallback(() => setMuted((current) => !current), [])
  const setVolume = useCallback((value: number) => setVolumeState(clamp(value, 0, 1)), [])
  const seek = useCallback((value: number) => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration)) return
    const nextTime = clamp(value, 0, audio.duration)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  return {
    status,
    volume: volumeState,
    muted,
    currentTime,
    duration,
    error,
    play,
    pause,
    toggleMuted,
    setVolume,
    seek,
  }
}
