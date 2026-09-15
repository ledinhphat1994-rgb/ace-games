import { Button } from '@/components/ui/button'
import type { MediaState } from '@shared/protocol/room'
import {
  Crown,
  Expand,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export type VideoSizePreset = 'pip' | 'medium' | 'large' | 'full'

interface FloatingVideoPlayerProps {
  mediaState: MediaState
  isHost: boolean
  volume: number
  onVolumeChange: (vol: number) => void
  onSyncMedia: (action: 'play' | 'pause' | 'seek', time: number) => void
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
  const sec = Math.max(0, Math.floor(s))
  const m = Math.floor(sec / 60)
  const rem = sec % 60
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
}

export function FloatingVideoPlayer({
  mediaState,
  isHost,
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

  const [currentTime, setCurrentTime] = useState(mediaState.time)
  const duration = 214 // default ~3:34
  const containerRef = useRef<HTMLDivElement>(null)

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
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

  // Periodic target time ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (mediaState.status === 'playing') {
        const target = calculateTargetTime()
        setCurrentTime(target)
      } else {
        setCurrentTime(mediaState.time)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [mediaState, calculateTargetTime])

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

  const handlePlayPause = () => {
    const nextStatus = mediaState.status === 'playing' ? 'pause' : 'play'
    const target = mediaState.status === 'playing' ? calculateTargetTime() : mediaState.time
    onSyncMedia(nextStatus, target)
  }

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime)
    onSyncMedia('seek', newTime)
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
          className="flex cursor-move items-center gap-2 pr-2 border-r border-white/10"
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
          onClick={handlePlayPause}
          className="h-7 w-7 rounded-full p-0 text-cyan-400 hover:bg-cyan-500/20"
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
              <Crown className="h-2.5 w-2.5" /> Bạn chủ trì
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

      {/* 2. Video Player Frame */}
      <div className="relative flex-1 bg-black overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${mediaState.videoId}?autoplay=${
            mediaState.status === 'playing' ? 1 : 0
          }&enablejsapi=1&controls=0&modestbranding=1&rel=0`}
          title="YouTube Video Player"
          className="absolute inset-0 h-full w-full border-0 pointer-events-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />

        {/* Overlay click to play/pause */}
        <div
          onClick={handlePlayPause}
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/10 hover:bg-black/25 transition-colors"
        >
          {mediaState.status === 'paused' ? (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/90 text-black shadow-2xl hover:scale-110 transition-transform">
              <Play className="h-7 w-7 fill-current ml-1" />
            </div>
          ) : null}
        </div>
      </div>

      {/* 3. Bottom Control Bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-t border-white/10 bg-[#0d1424]/90 px-3 gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="h-7 w-7 p-0 text-cyan-400 hover:bg-white/10"
          >
            {mediaState.status === 'playing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <span className="text-[11px] font-mono text-slate-300">
            {dinhDangGiayPhut(currentTime)}
          </span>
        </div>

        {/* Seek Bar */}
        <input
          type="range"
          min={0}
          max={duration}
          value={Math.min(currentTime, duration)}
          onChange={(e) => handleSeek(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-cyan-400"
        />

        <div className="flex items-center gap-2">
          <Volume2 className="h-3.5 w-3.5 text-slate-400" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-white/20 accent-cyan-400"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSearchQueue}
            className="h-6 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/20 font-medium"
          >
            Đổi video / Hàng đợi
          </Button>
        </div>
      </div>
    </div>
  )
}
