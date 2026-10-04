// src/features/study/workspace/EmbeddedVideoPlayer.tsx
// Digital Campus v2: Embedded YouTube Player for Central Presentation Stage

import { SUPPORTED_PLAYBACK_RATES, type MediaState } from '@shared/protocol/room'
import { AlertCircle, Crown, Pause, Play, Search, Volume2, VolumeX, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useYouTubePlayer } from '@/hooks/use-youtube-player'
import { cn } from '@/lib/utils'

export interface EmbeddedVideoPlayerProps {
  mediaState: MediaState
  isHost: boolean
  canModerate?: boolean
  canControlMedia?: boolean
  volume: number
  onVolumeChange: (vol: number) => void
  onSyncMedia: (action: 'play' | 'pause' | 'seek' | 'rate' | 'close', time?: number, rate?: number) => void
  onOpenSearchQueue: () => void
  calculateTargetTime: () => number
  /** Nút điều khiển khung (phóng to / thu nhỏ / ẩn …) đặt ở góc phải đầu khung. */
  dieuKhienKhung?: ReactNode
  /** Lớp vẽ tàng hình gắn với video (đi theo khung video khi di chuyển / phóng to / ẩn). */
  lopVe?: ReactNode
  /** Đang là cửa sổ nổi: chỉ giữ phát / tạm dừng và thanh tua. */
  compact?: boolean
  isReconnecting?: boolean
  onCloseVideo?: () => void
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
  lopVe,
  compact = false,
  isReconnecting = false,
  onCloseVideo,
}: EmbeddedVideoPlayerProps) {
  const rawId = useId()
  const containerId = useMemo(() => `embedded-yt-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [rawId])

  const effectiveCanControl = !isReconnecting && (isHost || canModerate) && canControlMedia

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

  // ── YouTube Hover & Idle Experience (Giống YouTube) ──
  const [isHovered, setIsHovered] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [clickFeedback, setClickFeedback] = useState<'play' | 'pause' | null>(null)
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetIdleTimer = useCallback(() => {
    setIsInteracting(true)
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    idleTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false)
    }, 2600)
  }, [])

  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    }
  }, [])

  const isPlaying = mediaState.status === 'playing'
  // Hiện thanh điều khiển khi:
  // - Đang tua video (isSeeking)
  // - Hoặc đang rê chuột trên khung video (isHovered) VÀ (video đang dừng HOẶC vừa có thao tác di chuột isInteracting)
  const showControls = isSeeking || (isHovered && (!isPlaying || isInteracting))

  const handleTogglePlay = () => {
    if (!effectiveCanControl) return
    resetIdleTimer()
    if (isPlaying) {
      handleUserPause()
      setClickFeedback('pause')
    } else {
      handleUserPlay()
      setClickFeedback('play')
    }
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = setTimeout(() => {
      setClickFeedback(null)
    }, 500)
  }

  return (
    <div
      className={`group relative flex h-full w-full flex-col overflow-hidden bg-[#101010] select-none ${
        !showControls && isPlaying ? 'cursor-none' : ''
      }`}
      data-testid="embedded-video-stage"
      onMouseEnter={() => {
        setIsHovered(true)
        resetIdleTimer()
      }}
      onMouseMove={resetIdleTimer}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsInteracting(false)
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
      }}
    >
      {/* ── Main Video Viewport Area (100% diện tích, hiển thị nguyên bản toàn bộ khung hình không cắt xén) ── */}
      <div className="relative h-full w-full flex-1 bg-[#101010] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <div
            id={containerId}
            data-testid="yt-player-host"
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Lớp bắt click để phát / tạm dừng */}
        <div
          className={`absolute inset-0 z-10 ${effectiveCanControl ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={effectiveCanControl ? handleTogglePlay : resetIdleTimer}
        />

        {/* Biểu tượng hiệu ứng khi bấm click vào giữa video (Giống YouTube) */}
        {clickFeedback && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center animate-in fade-in zoom-in-75 duration-150">
            <div className="flex size-16 items-center justify-center rounded-full bg-black/60 backdrop-blur-md border border-border-default text-text-primary shadow-2xl">
              {clickFeedback === 'play' ? (
                <Play className="size-8 fill-white ml-1" />
              ) : (
                <Pause className="size-8 fill-white" />
              )}
            </div>
          </div>
        )}

        {/* Lớp vẽ riêng của video: chỉ nhận chuột khi đang chọn công cụ vẽ, còn lại bấm xuyên xuống để phát / dừng */}
        {lopVe && <div className="pointer-events-none absolute inset-0 z-[15]">{lopVe}</div>}

        {/* Loading overlay */}
        {!isReady && !errorMessage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-canvas/90 backdrop-blur-sm gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            <span className="text-xs text-text-secondary">Đang tải trình phát YouTube...</span>
          </div>
        )}

        {/* Error overlay */}
        {errorMessage && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface/95 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-2" />
            <p className="text-sm font-semibold text-text-primary">Không thể tải video</p>
            <p className="text-xs text-text-secondary mt-1 max-w-sm">{errorMessage}</p>
            {effectiveCanControl && (
              <button
                type="button"
                onClick={onOpenSearchQueue}
                className="mt-4 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-semibold text-text-primary hover:bg-red-500 transition-colors"
              >
                Chọn video khác
              </button>
            )}
          </div>
        )}

        {/* Autoplay block banner */}
        {isAutoplayBlocked && !errorMessage && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-warning mb-2" />
            <p className="text-sm font-bold text-warning">Trình duyệt đã tạm dừng video tự động</p>
            <p className="text-xs text-text-secondary mt-1">Bấm nút bên dưới để tiếp tục phát đồng bộ.</p>
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

      {/* ── Top Video Header Bar (Overlay chuyển mượt mà: chỉ hiện khi rê chuột) ── */}
      <div
        data-keo-khung
        className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/90 via-black/50 to-transparent transition-all duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-2'
        } ${compact ? 'h-9 px-2 pt-1' : 'h-12 px-3 sm:px-4 pt-1.5'}`}
      >
        <div className="flex items-center gap-2 truncate pr-2 min-w-0">
          <YoutubeIcon className="h-4 w-4 text-red-500 shrink-0 drop-shadow" />
          <span className="truncate text-xs sm:text-sm font-semibold text-text-primary drop-shadow">
            {mediaState.title || 'Video bài giảng'}
          </span>
          {effectiveCanControl && mediaState.hostOnlyControl && (
            <span title="Chủ phòng điều khiển" aria-label="Chủ phòng điều khiển" className="shrink-0 text-warning drop-shadow" data-testid="video-host-crown">
              <Crown className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        {/* Right: Vùng 1 — ĐỒNG BỘ CÔNG CỤ (ĐỔI, PHÓNG TO/THU NHỎ, TOÀN MÀN HÌNH, ẨN, ĐÓNG) */}
        <div className="flex items-center gap-0.5 shrink-0 ml-auto">
          {effectiveCanControl && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onOpenSearchQueue}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary cursor-pointer"
                title="Đổi video"
                aria-label="Đổi video"
                data-testid="video-btn-change"
              >
                <Search className="h-3.5 w-3.5" />
              </button>

              {dieuKhienKhung}

              {!dieuKhienKhung && onCloseVideo && (
                <button
                  type="button"
                  onClick={onCloseVideo}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-overlay hover:text-red-400 cursor-pointer"
                  title="Đóng video"
                  aria-label="Đóng video"
                  data-testid="video-btn-close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Synchronized Control Toolbar (Overlay dưới đáy: chỉ hiện khi rê chuột) ── */}
      <div
        className={`absolute bottom-0 inset-x-0 z-20 flex flex-col bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-300 ${
          showControls ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
        } ${compact ? 'px-2 pb-2 pt-6 gap-1' : 'px-4 pb-3 pt-8 gap-2'}`}
      >
        {/* Scrubber Bar */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] text-text-primary/80 shrink-0 tabular-nums drop-shadow">
            {dinhDangGiayPhut(isSeeking ? seekVal : currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={isSeeking ? seekVal : currentTime}
              disabled={!effectiveCanControl || duration <= 0}
              onChange={(e) => {
                if (!effectiveCanControl) return
                setIsSeeking(true)
                setSeekVal(Number(e.target.value))
                resetIdleTimer()
              }}
              onMouseDown={effectiveCanControl ? resetIdleTimer : undefined}
              onMouseUp={() => {
                if (isSeeking && effectiveCanControl) {
                  handleUserSeek(seekVal)
                  setIsSeeking(false)
                  resetIdleTimer()
                }
              }}
              onTouchEnd={() => {
                if (isSeeking && effectiveCanControl) {
                  handleUserSeek(seekVal)
                  setIsSeeking(false)
                  resetIdleTimer()
                }
              }}
              aria-label="Tua video"
              className={cn(
                'w-full h-1.5 rounded-lg appearance-none bg-surface-overlay accent-red-600 transition-all',
                effectiveCanControl
                  ? 'hover:h-2 cursor-pointer'
                  : 'cursor-default pointer-events-none opacity-90',
              )}
            />
          </div>
          <span className="font-mono text-[11px] text-text-primary/80 shrink-0 tabular-nums drop-shadow">
            {dinhDangGiayPhut(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {effectiveCanControl ? (
              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-text-primary hover:bg-red-500 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                title={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </button>
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-text-primary shadow-md cursor-default select-none opacity-90"
                title={isPlaying ? 'Chủ phòng đang phát' : 'Chủ phòng đang tạm dừng'}
                aria-label={isPlaying ? 'Trạng thái phát' : 'Trạng thái tạm dừng'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </div>
            )}

            {/* Volume slider */}
            <div className={`flex items-center ${compact ? 'ml-0.5 gap-1' : 'ml-2 gap-1.5'}`}>
              <button
                type="button"
                onClick={() => {
                  onVolumeChange(volume === 0 ? 80 : 0)
                  resetIdleTimer()
                }}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer drop-shadow"
                title={volume === 0 ? 'Bật âm lượng' : 'Tắt tiếng'}
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => {
                  onVolumeChange(Number(e.target.value))
                  resetIdleTimer()
                }}
                className={`${compact ? 'w-12' : 'w-16'} h-1 rounded-lg appearance-none bg-surface-overlay accent-white cursor-pointer`}
                aria-label="Âm lượng"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Rate selector */}
            <div className="flex items-center gap-1">
              {effectiveCanControl ? (
                <select
                  title="Tốc độ phát"
                  value={playbackRate}
                  onChange={(e) => {
                    handleUserRate(Number(e.target.value) as any)
                    resetIdleTimer()
                  }}
                  className="rounded-lg border border-border-default bg-black/50 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-text-primary focus:outline-none cursor-pointer shadow-sm"
                  aria-label="Tốc độ phát"
                >
                  {selectableRates.map((r) => (
                    <option key={r} value={r} className="bg-surface text-text-primary">
                      {r}x
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  title="Tốc độ phát của phòng"
                  className="rounded-lg border border-border-default bg-black/50 backdrop-blur-md px-2 py-1 text-[11px] font-bold text-text-primary shadow-sm cursor-default select-none opacity-90"
                  aria-label={`Tốc độ phát: ${playbackRate}x`}
                >
                  {playbackRate}x
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
