// src/features/study/workspace/EmbeddedVideoPlayer.tsx
// Digital Campus v2: Embedded YouTube Player for Central Presentation Stage

import { SUPPORTED_PLAYBACK_RATES, type MediaState } from '@shared/protocol/room'
import { AlertCircle, Crown, Pause, Play, Search, Volume2, VolumeX } from 'lucide-react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { useYouTubePlayer } from '@/hooks/use-youtube-player'

export interface EmbeddedVideoPlayerProps {
  mediaState: MediaState
  isHost: boolean
  canModerate?: boolean
  canControlMedia?: boolean
  volume: number
  onVolumeChange: (vol: number) => void
  onSyncMedia: (action: 'play' | 'pause' | 'seek' | 'rate', time?: number, rate?: number) => void
  onOpenSearchQueue: () => void
  calculateTargetTime: () => number
  /** Nút điều khiển khung (phóng to / thu nhỏ / ẩn …) đặt ở góc phải đầu khung. */
  dieuKhienKhung?: ReactNode
  /** Đang là cửa sổ nổi: chỉ giữ phát / tạm dừng và thanh tua. */
  compact?: boolean
  isReconnecting?: boolean
}

function dinhDangGiayPhut(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '00:00'
  const sec = Math.floor(s)
  const m = Math.floor(sec / 60)
  const rem = sec % 60
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

export function EmbeddedVideoPlayer({
  mediaState,
  isHost,
  canModerate = false,
  canControlMedia = true,
  volume,
  onVolumeChange,
  onSyncMedia,
  onOpenSearchQueue,
  calculateTargetTime,
  dieuKhienKhung,
  compact = false,
  isReconnecting = false,
}: EmbeddedVideoPlayerProps) {
  const rawId = useId()
  const containerId = useMemo(() => `embedded-yt-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId])

  const effectiveCanControl = !isReconnecting && (isHost || canModerate || (!mediaState.hostOnlyControl && canControlMedia))

  const {
    isReady,
    currentTime,
    duration,
    playbackRate,
    availableRates,
    isAutoplayBlocked,
    errorMessage,
    handleUserPlay,
    handleUserPause,
    handleUserSeek,
    handleUserRate,
    handleDismissAutoplayBlock,
  } = useYouTubePlayer({
    containerId,
    mediaState,
    calculateTargetTime,
    onUserIntent: onSyncMedia,
    volume,
    canControlMedia: effectiveCanControl,
  })

  const selectableRates = useMemo(() => {
    if (!isReady || availableRates.length === 0) return SUPPORTED_PLAYBACK_RATES
    return SUPPORTED_PLAYBACK_RATES.filter((r) => availableRates.includes(r))
  }, [isReady, availableRates])

  const [isSeeking, setIsSeeking] = useState(false)
  const [seekVal, setSeekVal] = useState(0)

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-black select-none"
      data-testid="embedded-video-stage"
    >
      {/* Top Video Header Bar */}
      <div
        data-keo-khung
        className={`flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950/80 backdrop-blur-md z-10 ${compact ? 'h-9 px-2' : 'h-10 px-3 sm:px-4'}`}
      >
        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
          <YoutubeIcon className="h-4 w-4 text-red-500 shrink-0" />
          <span className="truncate text-xs font-semibold text-white">
            {mediaState.title || 'Video bài giảng'}
          </span>
          {mediaState.hostOnlyControl && (
            <span title="Chủ phòng điều khiển" aria-label="Chủ phòng điều khiển" className="shrink-0 text-amber-300">
              <Crown className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {effectiveCanControl && (
            <button
              type="button"
              onClick={onOpenSearchQueue}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
              title="Đổi video"
              aria-label="Đổi video"
              data-testid="video-btn-change"
            >
              <Search className="h-3 w-3" />
              {!compact && <span className="hidden sm:inline text-[11px]">Đổi video</span>}
            </button>
          )}

          {dieuKhienKhung && (
            <>
              <span className="mx-0.5 h-4 w-px bg-white/15" />
              {dieuKhienKhung}
            </>
          )}
        </div>
      </div>

      {/* Main Video Viewport Area */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {/* YT.Player target mount */}
        <div id={containerId} data-testid="yt-player-host" className="absolute inset-0 h-full w-full" />

        {/* Click layer routing to play/pause */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={() => {
            if (!effectiveCanControl) return
            if (mediaState.status === 'playing') handleUserPause()
            else handleUserPlay()
          }}
        />

        {/* Loading overlay */}
        {!isReady && !errorMessage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070b12]/90 backdrop-blur-sm gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <span className="text-xs text-slate-400">Đang tải trình phát YouTube...</span>
          </div>
        )}

        {/* Error overlay */}
        {errorMessage && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-2" />
            <p className="text-sm font-semibold text-white">Không thể tải video</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">{errorMessage}</p>
            {effectiveCanControl && (
              <button
                type="button"
                onClick={onOpenSearchQueue}
                className="mt-4 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Chọn video khác
              </button>
            )}
          </div>
        )}

        {/* Autoplay block banner */}
        {isAutoplayBlocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-amber-400 mb-2" />
            <p className="text-sm font-bold text-amber-200">Trình duyệt đã tạm dừng video tự động</p>
            <p className="text-xs text-slate-400 mt-1">Bấm nút bên dưới để tiếp tục phát đồng bộ.</p>
            <button
              type="button"
              onClick={handleDismissAutoplayBlock}
              className="mt-3 rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition-all cursor-pointer shadow-lg"
            >
              Tiếp tục phát
            </button>
          </div>
        )}
      </div>

      {/* Synchronized Control Toolbar */}
      <div className={`relative shrink-0 border-t border-white/10 bg-slate-950/95 flex flex-col z-10 backdrop-blur-md ${compact ? 'px-2 py-1 gap-1' : 'px-4 py-2 gap-1.5'}`}>
        {/* Scrubber Bar */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400 shrink-0 tabular-nums">
            {dinhDangGiayPhut(isSeeking ? seekVal : currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={isSeeking ? seekVal : currentTime}
            disabled={!effectiveCanControl || duration <= 0}
            onChange={(e) => {
              setIsSeeking(true)
              setSeekVal(Number(e.target.value))
            }}
            onMouseUp={() => {
              if (isSeeking) {
                handleUserSeek(seekVal)
                setIsSeeking(false)
              }
            }}
            onTouchEnd={() => {
              if (isSeeking) {
                handleUserSeek(seekVal)
                setIsSeeking(false)
              }
            }}
            aria-label="Tua video"
            className="flex-1 h-1.5 rounded-lg appearance-none bg-white/20 accent-red-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
          <span className="font-mono text-[10px] text-slate-400 shrink-0 tabular-nums">
            {dinhDangGiayPhut(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {effectiveCanControl ? (
              <button
                type="button"
                onClick={() => {
                  if (mediaState.status === 'playing') handleUserPause()
                  else handleUserPlay()
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors cursor-pointer"
                title={mediaState.status === 'playing' ? 'Tạm dừng' : 'Phát'}
              >
                {mediaState.status === 'playing' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                {mediaState.status === 'playing' ? 'Đang phát' : 'Đang tạm dừng'}
              </span>
            )}

            {/* Volume slider */}
            <div className={`items-center gap-1.5 ml-2 ${compact ? 'hidden' : 'flex'}`}>
              <button
                type="button"
                onClick={() => onVolumeChange(volume === 0 ? 80 : 0)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title={volume === 0 ? 'Bật âm lượng' : 'Tắt tiếng'}
              >
                {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-16 h-1 rounded-lg appearance-none bg-white/20 accent-white cursor-pointer"
                aria-label="Âm lượng"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Rate selector */}
            <div className={`items-center gap-1 ${compact ? 'hidden' : 'flex'}`}>
              <select
                title="Tốc độ phát"
                value={playbackRate}
                disabled={!effectiveCanControl}
                onChange={(e) => handleUserRate(Number(e.target.value) as any)}
                className="rounded border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white focus:outline-none cursor-pointer disabled:opacity-50"
                aria-label="Tốc độ phát"
              >
                {selectableRates.map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-white">
                    {r}x
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
