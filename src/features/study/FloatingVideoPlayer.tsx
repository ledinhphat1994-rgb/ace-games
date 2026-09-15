import { Button } from '@/components/ui/button'
import type { MediaState } from '@shared/protocol/room'
import {
  AlertCircle,
  Crown,
  Expand,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState, useId } from 'react'
import { useYouTubePlayer } from '@/hooks/use-youtube-player'

export type VideoSizePreset = 'pip' | 'medium' | 'large' | 'full'

interface FloatingVideoPlayerProps {
  mediaState: MediaState
  isHost: boolean
  canModerate?: boolean
  canControlMedia?: boolean
  volume: number
  onVolumeChange: (vol: number) => void
  onSyncMedia: (action: 'play' | 'pause' | 'seek' | 'rate', time?: number, rate?: number) => void
  onOpenSearchQueue: () => void
  onClose: () => void
  calculateTargetTime: () => number
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function dinhDangGiayPhut(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '00:00'
  const sec = Math.floor(s)
  const m = Math.floor(sec / 60)
  const rem = sec % 60
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
}

export function FloatingVideoPlayer({
  mediaState,
  isHost,
  canModerate = false,
  canControlMedia = true,
  volume,
  onVolumeChange,
  onSyncMedia,
  onOpenSearchQueue,
  onClose,
  calculateTargetTime,
}: FloatingVideoPlayerProps) {
  const [sizePreset, setSizePreset] = useState<VideoSizePreset>('medium')
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 40, y: 30 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  })

  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const containerId = `floating_yt_${rawId}`
  const containerRef = useRef<HTMLDivElement>(null)

  const effectiveCanControl = canControlMedia && (!mediaState.hostOnlyControl || isHost || canModerate)

  const {
    isReady,
    currentTime,
    duration,
    playbackRate,
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

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartRef.current.mouseX
      const dy = e.clientY - dragStartRef.current.mouseY
      setPosition({
        x: Math.max(10, dragStartRef.current.startX + dx),
        y: Math.max(10, dragStartRef.current.startY + dy),
      })
    }
    const handleMouseUp = () => {
      if (isDragging) setIsDragging(false)
    }
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // Preset dimensions
  const getPresetStyles = (): React.CSSProperties => {
    if (sizePreset === 'full') {
      return {
        position: 'absolute',
        inset: '16px',
        width: 'calc(100% - 32px)',
        height: 'calc(100% - 32px)',
        zIndex: 40,
      }
    }
    const widths: Record<VideoSizePreset, number> = {
      pip: 360,
      medium: 540,
      large: 760,
      full: 960,
    }
    const width = widths[sizePreset]
    const height = Math.round((width * 9) / 16) + 72 // 16:9 + header & controls

    return {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: 40,
    }
  }

  // Minimized Floating Pill Mode
  if (isMinimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="absolute z-40 flex items-center gap-3 rounded-full border border-white/20 bg-[#0d1424]/95 px-4 py-2 shadow-2xl backdrop-blur-xl ring-1 ring-cyan-500/30"
      >
        <div
          onMouseDown={handleMouseDown}
          className="flex cursor-move items-center gap-2 pr-2 border-r border-white/10 select-none"
        >
          <GripHorizontal className="h-4 w-4 text-slate-400" />
          <YoutubeIcon className="h-4 w-4 text-red-500" />
          <span className="max-w-[150px] truncate text-xs font-semibold text-slate-200">
            {mediaState.title || 'YouTube Video'}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={!effectiveCanControl}
          onClick={mediaState.status === 'playing' ? handleUserPause : handleUserPlay}
          className="h-7 w-7 rounded-full p-0 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-40"
        >
          {mediaState.status === 'playing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>

        <span className="text-[11px] font-mono text-slate-400">
          {dinhDangGiayPhut(currentTime)}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="h-7 w-7 rounded-full p-0 text-slate-300 hover:text-white"
          title="Mở rộng khung video"
        >
          <Expand className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 rounded-full p-0 text-slate-400 hover:text-red-400"
          title="Tắt video"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={getPresetStyles()}
      className="flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0a0f18]/95 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 transition-all duration-150"
    >
      {/* 1. Header with Drag Handle & Size Controls */}
      <div
        onMouseDown={handleMouseDown}
        className="flex h-9 shrink-0 cursor-move items-center justify-between border-b border-white/10 bg-white/5 px-3 select-none"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <GripHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <YoutubeIcon className="h-4 w-4 text-red-500 shrink-0" />
          <span className="truncate text-xs font-semibold text-slate-200">
            {mediaState.title || 'Video học tập chung'}
          </span>

          {isHost ? (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300">
              <Crown className="h-2.5 w-2.5" /> Chủ phòng
            </span>
          ) : canModerate ? (
            <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
              <ShieldAlert className="h-2.5 w-2.5" /> Điều hành
            </span>
          ) : null}

          {mediaState.hostOnlyControl && !effectiveCanControl ? (
            <span className="hidden sm:inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] text-rose-300">
              Chỉ host điều khiển
            </span>
          ) : null}
        </div>

        {/* Preset size and window buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSizePreset('pip')}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              sizePreset === 'pip' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Kích thước nhỏ (PiP 360px)"
          >
            Nhỏ
          </button>
          <button
            onClick={() => setSizePreset('medium')}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              sizePreset === 'medium' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Kích thước vừa (540px)"
          >
            Vừa
          </button>
          <button
            onClick={() => setSizePreset('large')}
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
              sizePreset === 'large' ? 'bg-cyan-500 text-black font-bold' : 'text-slate-400 hover:text-white'
            }`}
            title="Kích thước lớn (760px)"
          >
            Lớn
          </button>
          <button
            onClick={() => setSizePreset((prev) => (prev === 'full' ? 'medium' : 'full'))}
            className={`rounded p-1 text-slate-400 hover:text-white transition-colors ${
              sizePreset === 'full' ? 'text-cyan-400' : ''
            }`}
            title={sizePreset === 'full' ? 'Thu nhỏ lại' : 'Toàn màn hình'}
          >
            {sizePreset === 'full' ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="rounded p-1 text-slate-400 hover:text-white"
            title="Thu nhỏ thành thanh dock mini"
          >
            <Minimize2 className="h-3 w-3" />
          </button>

          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-red-400"
            title="Đóng khung video"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Video Player Area */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {/* The DOM element where YT.Player is instantiated */}
        <div id={containerId} className="absolute inset-0 h-full w-full" />

        {/* Loading state before YT.Player is ready */}
        {!isReady && !errorMessage ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070b12]/90 backdrop-blur-sm gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="text-xs text-slate-400 font-mono">Đang khởi tạo YouTube Player...</span>
          </div>
        ) : null}

        {/* Error state */}
        {errorMessage ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0c121e]/95 p-6 text-center gap-3">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <p className="text-sm font-medium text-rose-200 max-w-sm">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSearchQueue}
              className="border-white/20 bg-white/5 text-cyan-300 hover:bg-white/10"
            >
              Chọn video khác từ hàng đợi
            </Button>
          </div>
        ) : null}

        {/* Autoplay Blocked Overlay */}
        {isAutoplayBlocked ? (
          <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Trình duyệt chặn tự phát video</p>
              <p className="text-xs text-slate-300 mt-0.5">Nhấn để mở âm thanh và đồng bộ cùng phòng ngay</p>
            </div>
            <Button
              size="sm"
              onClick={handleDismissAutoplayBlock}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg"
            >
              <Play className="h-4 w-4 fill-current mr-1.5" />
              Đồng bộ & Phát ngay
            </Button>
          </div>
        ) : null}
      </div>

      {/* 3. Bottom Control Bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-t border-white/10 bg-[#0d1424]/90 px-3 gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!effectiveCanControl}
            onClick={mediaState.status === 'playing' ? handleUserPause : handleUserPlay}
            className="h-7 w-7 p-0 text-cyan-400 hover:bg-white/10 disabled:opacity-40"
            title={effectiveCanControl ? (mediaState.status === 'playing' ? 'Tạm dừng' : 'Phát') : 'Chỉ chủ phòng hoặc điều hành mới có quyền phát/dừng'}
          >
            {mediaState.status === 'playing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <span className="text-[11px] font-mono text-slate-300 shrink-0">
            {dinhDangGiayPhut(currentTime)} / {dinhDangGiayPhut(duration)}
          </span>
        </div>

        {/* Real Seek Bar */}
        <input
          type="range"
          min={0}
          max={duration > 0 ? duration : 100}
          step={1}
          value={Math.min(currentTime, duration > 0 ? duration : 100)}
          disabled={!effectiveCanControl || duration <= 0}
          onChange={(e) => handleUserSeek(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed"
          title={effectiveCanControl ? 'Tua đến vị trí' : 'Bạn không có quyền tua video'}
        />

        {/* Speed / Rate control */}
        {effectiveCanControl ? (
          <select
            value={playbackRate}
            onChange={(e) => handleUserRate(Number(e.target.value))}
            className="rounded bg-black/40 px-1 py-0.5 text-[10px] font-mono text-cyan-300 border border-white/10 focus:outline-none"
            title="Tốc độ phát chung"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2.0x</option>
          </select>
        ) : (
          <span className="text-[10px] font-mono text-slate-400">
            {playbackRate}x
          </span>
        )}

        <div className="flex items-center gap-2">
          {/* Local Volume (never broadcast to room) */}
          <button
            onClick={() => onVolumeChange(volume > 0 ? 0 : 80)}
            className="text-slate-400 hover:text-white"
            title={volume === 0 ? 'Bật tiếng' : 'Tắt tiếng'}
          >
            {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="h-1.5 w-14 cursor-pointer appearance-none rounded-full bg-white/20 accent-cyan-400"
            title={`Âm lượng cá nhân: ${volume}%`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSearchQueue}
            className="h-6 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/20 font-medium"
          >
            Hàng đợi
          </Button>
        </div>
      </div>
    </div>
  )
}
