/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

function createMockAudioContext() {
  const analyser = {
    fftSize: 1024,
    smoothingTimeConstant: 0,
    getByteTimeDomainData: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = 128
    }),
    connect: vi.fn(),
  }

  const context = {
    state: 'running' as AudioContextState,
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => ({ connect: vi.fn((dest: unknown) => dest) })),
    close: vi.fn().mockResolvedValue(undefined),
  }

  return { context, analyser }
}

describe('useBlowDetection', () => {
  let mockStream: { getTracks: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    const mockAC = createMockAudioContext()
    mockStream = { getTracks: vi.fn(() => [{ stop: vi.fn() }]) }

    vi.stubGlobal('AudioContext', vi.fn(() => mockAC.context))
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('reports isSupported as true in modern browsers', async () => {
    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result } = renderHook(() => useBlowDetection(onBlow))
    expect(result.current.isSupported).toBe(true)
    expect(result.current.status).toBe('idle')
  })

  test('transitions to requesting then listening when enabled', async () => {
    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result } = renderHook(() => useBlowDetection(onBlow))

    await act(async () => { await result.current.enable() })
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
    })
    expect(result.current.status).toBe('listening')
  })

  test('does not re-enable when already listening', async () => {
    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result } = renderHook(() => useBlowDetection(onBlow))
    await act(async () => { await result.current.enable() })
    expect(result.current.status).toBe('listening')

    await act(async () => { await result.current.enable() })
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1)
  })

  test('disable stops tracks and resets status', async () => {
    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result } = renderHook(() => useBlowDetection(onBlow))
    await act(async () => { await result.current.enable() })

    act(() => { result.current.disable() })
    expect(result.current.status).toBe('idle')
    expect(result.current.level).toBe(0)
  })

  test('handles microphone permission denied', async () => {
    const error = new DOMException('Permission denied', 'NotAllowedError')
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(error) },
    })

    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result } = renderHook(() => useBlowDetection(onBlow))
    await act(async () => { await result.current.enable() })

    expect(result.current.status).toBe('denied')
    expect(result.current.message).toBe('没关系，也可以直接按按钮许愿。')
  })

  test('reports unsupported when AudioContext is unavailable', async () => {
    vi.stubGlobal('AudioContext', undefined)

    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result } = renderHook(() => useBlowDetection(onBlow))
    expect(result.current.isSupported).toBe(false)
    expect(result.current.status).toBe('unsupported')
  })

  test('calls onBlow callback when blow detected', async () => {
    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    // Capture rAF callbacks so we can drive them manually
    const rAFQueue: Array<(time: number) => void> = []
    const rAFSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (cb: FrameRequestCallback) => {
        rAFQueue.push(cb as (time: number) => void)
        return rAFQueue.length
      },
    )

    const { result } = renderHook(() => useBlowDetection(onBlow))
    await act(async () => { await result.current.enable() })

    // Override getByteTimeDomainData to simulate loud input
    const ac = (window.AudioContext as ReturnType<typeof vi.fn>).mock.results[0].value
    const analyser = ac.createAnalyser()
    analyser.getByteTimeDomainData.mockImplementation((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = 200
    })

    // Drive 80 analysis frames manually (each ~16ms apart = 1280ms total > BLOW_DURATION 650ms)
    for (let i = 0; i < 80; i++) {
      const cb = rAFQueue.length > 0 ? rAFQueue.shift()! : null
      if (cb) {
        act(() => { cb(i * 16) })
        // Flush any state updates queued by the callback
        await act(async () => { await new Promise((r) => setTimeout(r, 0)) })
      }
    }

    expect(onBlow).toHaveBeenCalled()
    rAFSpy.mockRestore()
  })

  test('cleans up on unmount', async () => {
    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result, unmount } = renderHook(() => useBlowDetection(onBlow))
    await act(async () => { await result.current.enable() })

    unmount()
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })

  test('idle message is correct', async () => {
    const { useBlowDetection } = await import('../hooks/useBlowDetection')
    const onBlow = vi.fn()

    const { result } = renderHook(() => useBlowDetection(onBlow))
    expect(result.current.message).toBe('只有你点开它时，才会请求麦克风权限。')
  })
})
