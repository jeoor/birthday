import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import type { AudioPlayerState } from '../hooks/useAudioPlayer'

interface MusicControlsProps {
  player: AudioPlayerState
}

function formatAudioTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function MusicControls({ player }: MusicControlsProps) {
  const isPlaying = player.status === 'playing'
  const unavailable = player.status === 'error'
  const progress = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0
  const [showVolume, setShowVolume] = useState(false)

  return (
    <section className="compact-music" data-od-id="music-controls" aria-label="生日音乐控制">
      <button
        className="bar-icon-button music-play-button"
        type="button"
        onClick={() => isPlaying ? player.pause() : void player.play()}
        disabled={unavailable}
        aria-label={isPlaying ? '暂停音乐' : '播放音乐'}
      >
        {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      </button>
      <span className="music-title">此刻的音乐</span>
      {!unavailable && (
        <label className="music-progress">
          <span className="sr-only">播放进度</span>
          <i aria-hidden="true" style={{ transform: `scaleX(${progress / 100})` }} />
          <input
            type="range"
            min="0"
            max={player.duration || 0}
            step="0.1"
            value={Math.min(player.currentTime, player.duration || 0)}
            onChange={(e) => player.seek(Number(e.target.value))}
            disabled={player.duration <= 0}
          />
        </label>
      )}
      {!unavailable && (
        <time className="music-time">
          {formatAudioTime(player.currentTime)} / {formatAudioTime(player.duration)}
        </time>
      )}
      <div
        className="music-volume-control"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setShowVolume(false)
        }}
      >
        <button
          className="bar-icon-button"
          type="button"
          onClick={() => setShowVolume((current) => !current)}
          disabled={unavailable}
          aria-label="音量控制"
          aria-expanded={showVolume}
          aria-controls="music-volume-popover"
        >
          {player.muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
        </button>
        {showVolume && !unavailable && (
          <div className="volume-popover" id="music-volume-popover">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={player.volume}
              onChange={(event) => player.setVolume(Number(event.target.value))}
              aria-label={`音量 ${Math.round(player.volume * 100)}%`}
            />
            <span>{Math.round(player.volume * 100)}%</span>
            <button type="button" onClick={player.toggleMuted}>
              {player.muted ? '取消静音' : '静音'}
            </button>
          </div>
        )}
      </div>
      {player.error && <p className="music-error" role="status">{player.error}</p>}
    </section>
  )
}
