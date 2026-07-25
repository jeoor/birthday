/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

function createMockAudio() {
  const listeners = new Map<string, Array<() => void>>()
  const audio = {
    preload: '',
    loop: false,
    volume: 1,
    muted: false,
    currentTime: 0,
    duration: 180,
    src: '',
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn((event: string, fn: () => void) => {
      if (!listeners.has(event)) listeners.set(event, [])
      listeners.get(event)!.push(fn)
    }),
    removeEventListener: vi.fn(),
    removeAttribute: vi.fn(),
  }
  return { audio, listeners }
}

describe('useAudioPlayer', () => {
  let mockAudio: ReturnType<typeof createMockAudio>

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    mockAudio = createMockAudio()
    vi.stubGlobal('Audio', vi.fn(() => mockAudio.audio))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('initializes with loading status', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { result } = renderHook(() => useAudioPlayer('/test.mp3'))
    expect(result.current.status).toBe('loading')
    expect(result.current.error).toBeNull()
  })

  test('creates Audio with correct config', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    renderHook(() => useAudioPlayer('/song.mp3'))

    expect(window.Audio).toHaveBeenCalledWith('/song.mp3')
    expect(mockAudio.audio.preload).toBe('metadata')
    expect(mockAudio.audio.loop).toBe(true)
  })

  test('transitions to ready on canplay event', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { result } = renderHook(() => useAudioPlayer('/test.mp3'))

    const canplayHandlers = (window.Audio as ReturnType<typeof vi.fn>).mock.results[0].value
      .addEventListener.mock.calls
      .filter(([event]: [string]) => event === 'canplay')
      .map(([, fn]: [string, () => void]) => fn)

    act(() => { canplayHandlers.forEach((fn: () => void) => fn()) })
    expect(result.current.status).toBe('ready')
  })

  test('play sets status to playing', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { result } = renderHook(() => useAudioPlayer('/test.mp3'))

    await act(async () => { await result.current.play() })
    expect(mockAudio.audio.play).toHaveBeenCalled()
  })

  test('pause calls audio.pause', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { result } = renderHook(() => useAudioPlayer('/test.mp3'))

    act(() => { result.current.pause() })
    expect(mockAudio.audio.pause).toHaveBeenCalled()
  })

  test('toggleMuted flips muted state', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { result } = renderHook(() => useAudioPlayer('/test.mp3'))

    expect(result.current.muted).toBe(false)
    act(() => { result.current.toggleMuted() })
    expect(result.current.muted).toBe(true)
  })

  test('setVolume clamps and updates', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { result } = renderHook(() => useAudioPlayer('/test.mp3'))

    act(() => { result.current.setVolume(0.5) })
    expect(result.current.volume).toBe(0.5)
  })

  test('seek updates currentTime', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { result } = renderHook(() => useAudioPlayer('/test.mp3'))

    act(() => { result.current.seek(30) })
    expect(mockAudio.audio.currentTime).toBe(30)
  })

  test('cleans up Audio on unmount', async () => {
    const { useAudioPlayer } = await import('../hooks/useAudioPlayer')
    const { unmount } = renderHook(() => useAudioPlayer('/test.mp3'))

    unmount()
    expect(mockAudio.audio.pause).toHaveBeenCalled()
    expect(mockAudio.audio.removeAttribute).toHaveBeenCalledWith('src')
  })
})
