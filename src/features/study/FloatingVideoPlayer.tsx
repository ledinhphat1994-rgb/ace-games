import { Button } from '@/components/ui/button'
import { SUPPORTED_PLAYBACK_RATES, type MediaState } from '@shared/protocol/room'
import {
  AlertCircle,
  Crown,
  Expand,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState, useId, useMemo } from 'react'
import { useYouTubePlayer } from '@/hooks/use-youtube-player'

export type VideoSizePreset = 'pip' | 'medium' | 'large' | 'full'

const PRESET_SIZES: Record<'pip' | 'medium' | 'large', { w: number; h: number }> = {
  pip: { w: 360, h: 274 },
  medium: { w: 540, h: 376 },
  large: { w: 760, h: 500 },
}

type ResizeDir = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

const RESIZE_CURSORS: Record<ResizeDir, string> = {
  nw: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  se: 'nwse-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
}

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
  zIndex?: number
  onFocus?: () => void
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
  zIndex,
  onFocus,
}: FloatingVideoPlayerProps) {
  const [sizePreset, setSizePreset] = useState<VideoSizePreset>('medium')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 80, y: 70 })
  const [size, setSize] = useState<{ w: number; h: number }>(PRESET_SIZES.medium)
  const [prevBounds, setPrevBounds] = useState<{
    pos: { x: number; y: number }
    size: { w: number; h: number }
    preset: VideoSizePreset
  } | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)
  const [activeCursor, setActiveCursor] = useState<string>('default')
  const interRef = useRef<{
    type: 'drag' | 'resize'
    dir?: ResizeDir
    startMouseX: number
    startMouseY: number
    startX: number
    startY: number
    startW: number
    startH: number
  } | null>(null)

  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const containerId = `floating_yt_${rawId}`
  const containerRef = useRef<HTMLDivElement>(null)

  const effectiveCanControl = canControlMedia && (!mediaState.hostOnlyControl || isHost || canModerate)

  const {
    isReady,
    currentTime,
    duration,
    playbackRate,
    availableRates,
    rateWarning,
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

  // Dragging logic
  const startDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('select')) return
    if (isMaximized) return
    onFocus?.()
    setActiveCursor('move')
    setIsInteracting(true)
    interRef.current = {
      type: 'drag',
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: position.x,
      startY: position.y,
      startW: size.w,
      startH: size.h,
    }
  }

  const startResize = (dir: ResizeDir, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isMaximized) return
    onFocus?.()
    setActiveCursor(RESIZE_CURSORS[dir])
    setIsInteracting(true)
    interRef.current = {
      type: 'resize',
      dir,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: position.x,
      startY: position.y,
      startW: size.w,
      startH: size.h,
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const ref = interRef.current
      if (!ref) return
      const dx = e.clientX - ref.startMouseX
      const dy = e.clientY - ref.startMouseY

      if (ref.type === 'drag') {
        setPosition({
          x: Math.max(10, ref.startX + dx),
          y: Math.max(10, ref.startY + dy),
        })
      } else if (ref.type === 'resize' && ref.dir) {
        const c = ref.dir
        let newW = ref.startW
        let newH = ref.startH
        let newX = ref.startX
        let newY = ref.startY

        if (c.includes('e')) newW = Math.max(320, ref.startW + dx)
        if (c.includes('w')) {
          newW = Math.max(320, ref.startW - dx)
          newX = Math.max(10, ref.startX + Math.min(dx, ref.startW - 320))
        }
        if (c.includes('s')) newH = Math.max(220, ref.startH + dy)
        if (c.includes('n')) {
          newH = Math.max(220, ref.startH - dy)
          newY = Math.max(10, ref.startY + Math.min(dy, ref.startH - 220))
        }

        setSize({ w: newW, h: newH })
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      if (interRef.current) {
        interRef.current = null
        setIsInteracting(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const applyPreset = (preset: 'pip' | 'medium' | 'large') => {
    onFocus?.()
    if (isMaximized) {
      setIsMaximized(false)
    }
    setSizePreset(preset)
    setSize(PRESET_SIZES[preset])
  }

  const toggleMaximize = () => {
    onFocus?.()
    if (isMaximized) {
      if (prevBounds) {
        setPosition(prevBounds.pos)
        setSize(prevBounds.size)
        setSizePreset(prevBounds.preset)
      } else {
        setSize(PRESET_SIZES.medium)
        setSizePreset('medium')
      }
      setIsMaximized(false)
    } else {
      setPrevBounds({ pos: position, size, preset: sizePreset })
      setPosition({ x: 16, y: 56 })
      setSize({
        w: Math.max(640, window.innerWidth - 32),
        h: Math.max(400, window.innerHeight - 128),
      })
      setSizePreset('full')
      setIsMaximized(true)
    }
  }

  const getContainerStyle = (): React.CSSProperties => {
    if (isMinimized) {
      return {
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }
    }

    const effectiveZ = isMaximized ? 999 : (zIndex ?? 40)

    return {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.w}px`,
      height: `${size.h}px`,
      zIndex: effectiveZ,
      transition: isInteracting ? 'none' : 'all 150ms cubic-bezier(0.16, 1, 0.3, 1)',
    }
  }

  return (
    <>
      {/* Global transparent overlay during drag/resize to prevent YouTube iframe from capturing mouse */}
      {isInteracting && (
        <div
          className="fixed inset-0 z-[99999] select-none"
          style={{ cursor: activeCursor }}
        />
      )}

      {/* 1. Main Floating Window (ALWAYS mounted in DOM, hidden when minimized to preserve player instance) */}
      <div
        ref={containerRef}
        style={getContainerStyle()}
        className="flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0a0f18]/95 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 select-none"
        onClick={onFocus}
      >
        {/* 1. Header with Drag Handle & Size Controls */}
        <div
          onMouseDown={startDrag}
          className="flex h-9 shrink-0 cursor-move items-center justify-between border-b border-white/10 bg-white/5 px-3 select-none"
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <GripHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <YoutubeIcon className="h-4 w-4 text-red-500 shrink-0" />
            <span className="truncate text-xs font-semibold text-slate-200">
              {mediaState.title || 'Video học tập chung'}
            </span>

            {isHost ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300 shrink-0">
                <Crown className="h-2.5 w-2.5" /> Chủ phòng
              </span>
            ) : canModerate ? (
              <span className="inline-flex items-center gap-1 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300 shrink-0">
                <ShieldAlert className="h-2.5 w-2.5" /> Điều hành
              </span>
            ) : null}

            {mediaState.hostOnlyControl && !effectiveCanControl ? (
              <span className="hidden sm:inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] text-rose-300 shrink-0">
                Chỉ host điều khiển
              </span>
            ) : null}
          </div>

          {/* Preset size and window buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => applyPreset('pip')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                sizePreset === 'pip' ? 'bg-brand text-primary-foreground font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Kích thước nhỏ (PiP 360px)"
            >
              Nhỏ
            </button>
            <button
              onClick={() => applyPreset('medium')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                sizePreset === 'medium' ? 'bg-brand text-primary-foreground font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Kích thước vừa (540px)"
            >
              Vừa
            </button>
            <button
              onClick={() => applyPreset('large')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                sizePreset === 'large' ? 'bg-brand text-primary-foreground font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Kích thước lớn (760px)"
            >
              Lớn
            </button>
            <button
              onClick={toggleMaximize}
              className={`rounded p-1 text-slate-400 hover:text-white transition-colors ${
                isMaximized ? 'text-brand' : ''
              }`}
              title={isMaximized ? 'Thu về kích thước ban đầu' : 'Phóng to toàn màn hình'}
            >
              {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="rounded p-1 text-slate-400 hover:text-white transition-colors"
              title="Thu nhỏ thành thanh dock mini"
            >
              <Minus className="h-3 w-3" />
            </button>

            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:text-red-400 transition-colors"
              title="Đóng khung video"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Resize Handles */}
        {!isMaximized && (
          <>
            <div
              className="absolute -top-1 -left-1 h-3 w-3 cursor-nwse-resize z-30"
              onMouseDown={(e) => startResize('nw', e)}
            />
            <div
              className="absolute -top-1 -right-1 h-3 w-3 cursor-nesw-resize z-30"
              onMouseDown={(e) => startResize('ne', e)}
            />
            <div
              className="absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize z-30"
              onMouseDown={(e) => startResize('sw', e)}
            />
            <div
              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize z-30"
              onMouseDown={(e) => startResize('se', e)}
            />
            <div
              className="absolute top-0 left-2 right-2 h-1 cursor-ns-resize z-30"
              onMouseDown={(e) => startResize('n', e)}
            />
            <div
              className="absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize z-30"
              onMouseDown={(e) => startResize('s', e)}
            />
            <div
              className="absolute top-2 bottom-2 left-0 w-1 cursor-ew-resize z-30"
              onMouseDown={(e) => startResize('w', e)}
            />
            <div
              className="absolute top-2 bottom-2 right-0 w-1 cursor-ew-resize z-30"
              onMouseDown={(e) => startResize('e', e)}
            />
          </>
        )}

        {/* 2. Video Player Area */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        {/* The DOM element where YT.Player is instantiated */}
        <div id={containerId} data-testid="yt-player-host" className="absolute inset-0 h-full w-full" />

        {/* Authoritative click layer over player so direct clicks route to explicit controls */}
        <div
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={() => {
            if (!effectiveCanControl) return
            if (mediaState.status === 'playing') handleUserPause()
            else handleUserPlay()
          }}
        />

        {/* Loading state before YT.Player is ready */}
        {!isReady && !errorMessage ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070b12]/90 backdrop-blur-sm gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
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
              className="border-white/20 bg-white/5 text-brand hover:bg-white/10"
            >
              Chọn video khác từ hàng đợi
            </Button>
          </div>
        ) : null}

        {/* Autoplay Blocked Overlay */}
        {isAutoplayBlocked ? (
          <div className="absolute inset-0 z-25 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm p-4 text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand ring-1 ring-brand/40">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Trình duyệt chặn tự phát video</p>
              <p className="text-xs text-slate-300 mt-0.5">Nhấn để mở âm thanh và đồng bộ cùng phòng ngay</p>
            </div>
            <Button
              size="sm"
              onClick={handleDismissAutoplayBlock}
              className="bg-brand hover:bg-brand-hover text-primary-foreground font-semibold shadow-lg"
            >
              <Play className="h-4 w-4 fill-current mr-1.5" />
              Đồng bộ & Phát ngay
            </Button>
          </div>
        ) : null}
      </div>

      {/* 3. Bottom Control Bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-t border-white/10 bg-[#1c1a14]/90 px-3 gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!effectiveCanControl}
            onClick={mediaState.status === 'playing' ? handleUserPause : handleUserPlay}
            className="h-7 w-7 p-0 text-brand hover:bg-white/10 disabled:opacity-40"
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
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-brand disabled:opacity-40 disabled:cursor-not-allowed"
          title={effectiveCanControl ? 'Tua đến vị trí' : 'Bạn không có quyền tua video'}
        />

        {/* Speed / Rate control */}
        {effectiveCanControl ? (
          <select
            value={playbackRate}
            onChange={(e) => handleUserRate(Number(e.target.value))}
            className="rounded bg-black/40 px-1 py-0.5 text-[10px] font-mono text-brand border border-white/10 focus:outline-none"
            title="Tốc độ phát chung"
          >
            {selectableRates.map((r: number) => (
              <option key={r} value={r}>
                {r}x
              </option>
            ))}
          </select>
        ) : (
          <span
            className="text-[10px] font-mono text-slate-400"
            title={rateWarning || `Tốc độ hiện tại: ${playbackRate}x`}
          >
            {playbackRate}x
            {rateWarning && <span className="ml-1 text-amber-400 font-bold" title={rateWarning}>⚠️</span>}
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
            className="h-1.5 w-14 cursor-pointer appearance-none rounded-full bg-white/20 accent-brand"
            title={`Âm lượng cá nhân: ${volume}%`}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSearchQueue}
            className="h-6 px-2 text-[10px] text-brand hover:bg-brand/20 font-medium"
          >
            Hàng đợi
          </Button>
        </div>
      </div>
    </div>

    {/* 2. Minimized Floating Pill Mode (rendered alongside when isMinimized is true) */}
    {isMinimized && (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="absolute z-40 flex items-center gap-3 rounded-full border border-white/20 bg-[#1c1a14]/95 px-4 py-2 shadow-2xl backdrop-blur-xl ring-1 ring-brand/30"
      >
        <div
          onMouseDown={startDrag}
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
          className="h-7 w-7 rounded-full p-0 text-brand hover:bg-brand/20 disabled:opacity-40"
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
    )}
  </>
  )
}
