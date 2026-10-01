import React from 'react'
import { ArrowLeft, Flag, Maximize2, Minimize2, Play, RotateCcw, Zap, MessageCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CumPvePvp } from './CumPvePvp'
import type { CapDoMay, CheDoChoi } from './cap-do-may'

/** `online`: bàn đối kháng qua mạng do máy chủ làm trọng tài (chỉ có khi bàn cờ mở từ sảnh). */
export type PlayMode = CheDoChoi
export type AiDifficulty = CapDoMay

interface GamePlayToolbarProps {
  onBack?: () => void
  title?: string
  badge?: string
  icon?: React.ReactNode
  mode: PlayMode
  onModeChange: (mode: PlayMode) => void
  aiLevel: AiDifficulty
  onAiLevelChange: (level: AiDifficulty) => void
  onReset: () => void
  resetLabel?: string
  resetIcon?: React.ReactNode
  resetDisabled?: boolean
  hideReset?: boolean
  /** PvP chuyển sang Online (bàn mở từ sảnh, đối thủ là người thật) thay vì hai người cùng máy (chỉ với `hideCenterTurn`). */
  onlineAvailable?: boolean
  surrenderAttempts?: number
  activeSide?: 'red' | 'black'
  turnLabel: string
  turnIndicator?: React.ReactNode
  isAiThinking?: boolean
  statusAlert?: React.ReactNode
  outcomeNotice?: React.ReactNode
  hideCenterTurn?: boolean
  /** Slot nội dung bổ sung bên phải thanh toolbar (ví dụ nút Biểu cảm nhanh) */
  rightSlot?: React.ReactNode
  /** Nút toàn màn hình tùy biến */
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  /** Ẩn nút toàn màn hình nếu không cần */
  hideFullscreen?: boolean
  /** Game chỉ có PvE (Rắn Săn Mồi): cụm chế độ chỉ hiện PvE, không có PvP giả. */
  chiPve?: boolean
  /** Phần riêng của game trong bảng chọn PvE (ví dụ số máy). */
  phuPve?: React.ReactNode
  /** Chữ ở chip cạnh PvE thay cho cấp độ (ví dụ "Vừa · 6"). */
  nhanChipPve?: string
  /** Phần riêng của game trong bảng chọn PvP (ví dụ thêm số bot). */
  phuPvp?: React.ReactNode
  /** Chữ ở chip cạnh PvP (ví dụ "6 Bot"). */
  nhanChipPvp?: string
  /** Nút hành động chính (Bắt đầu…) làm nổi bằng màu nhấn thay cho nút viền. */
  resetNoiBat?: boolean
  className?: string
}

export function GamePlayToolbar({
  onBack,
  title,
  badge,
  icon,
  mode,
  onModeChange,
  aiLevel,
  onAiLevelChange,
  onReset,
  resetLabel,
  resetIcon,
  resetDisabled = false,
  hideReset = false,
  onlineAvailable = false,
  surrenderAttempts,
  activeSide,
  turnLabel,
  turnIndicator,
  isAiThinking = false,
  statusAlert,
  outcomeNotice,
  hideCenterTurn = false,
  rightSlot,
  onToggleFullscreen,
  isFullscreen,
  hideFullscreen = false,
  chiPve = false,
  phuPve,
  nhanChipPve,
  phuPvp,
  nhanChipPvp,
  resetNoiBat = false,
  className,
}: GamePlayToolbarProps) {
  const [internalFullscreen, setInternalFullscreen] = React.useState(false)
  React.useEffect(() => {
    const handleFs = () => setInternalFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFs)
    return () => document.removeEventListener('fullscreenchange', handleFs)
  }, [])
  const isFs = isFullscreen ?? internalFullscreen

  // Hỗ trợ kéo qua kéo lại (drag-to-scroll) trên cụm icon ở giữa
  const centerScrollRef = React.useRef<HTMLDivElement>(null)
  const keoRef = React.useRef<{ x: number; cuon: number; daKeo: boolean; id: number } | null>(null)
  const [dangKeo, setDangKeo] = React.useState(false)

  React.useEffect(() => {
    const el = centerScrollRef.current
    if (!el) return
    const xuLyWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', xuLyWheel, { passive: false })
    return () => el.removeEventListener('wheel', xuLyWheel)
  }, [])

  const batDauKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    const el = centerScrollRef.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    keoRef.current = {
      x: e.clientX,
      cuon: el.scrollLeft,
      daKeo: false,
      id: e.pointerId,
    }
  }

  const keo = (e: React.PointerEvent<HTMLDivElement>) => {
    const k = keoRef.current
    const el = centerScrollRef.current
    if (!k || !el || k.id !== e.pointerId) return
    const dx = e.clientX - k.x
    if (!k.daKeo && Math.abs(dx) < 4) return
    if (!k.daKeo) {
      k.daKeo = true
      setDangKeo(true)
      try {
        el.setPointerCapture(e.pointerId)
      } catch {}
    }
    el.scrollLeft = k.cuon - dx
  }

  const thaKeo = (e: React.PointerEvent<HTMLDivElement>) => {
    const k = keoRef.current
    if (!k || k.id !== e.pointerId) return
    try {
      centerScrollRef.current?.releasePointerCapture(e.pointerId)
    } catch {}
    setDangKeo(false)
    setTimeout(() => {
      keoRef.current = null
    }, 0)
  }

  const chanClickKhiKeo = (e: React.MouseEvent) => {
    if (keoRef.current?.daKeo) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const handleFsToggle = (e: React.MouseEvent) => {
    if (onToggleFullscreen) {
      onToggleFullscreen()
      return
    }
    if (!document.fullscreenElement) {
      const stageEl =
        (e.currentTarget as HTMLElement).closest('.game-stage') ||
        document.querySelector('.game-stage') ||
        document.documentElement
      stageEl.requestFullscreen?.().catch(() => {
        document.documentElement.requestFullscreen?.().catch(() => {})
      })
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  const handleBack = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    }
    onBack?.()
  }

  const nutFullscreen = !hideFullscreen && (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFsToggle}
      className="h-8 gap-1.5 border-white/15 bg-white/10 px-2 text-xs font-bold text-white transition-all hover:bg-white/20 hover:border-white/30 active:scale-95 cursor-pointer shrink-0"
      title={isFs ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
      aria-label="Toàn màn hình"
    >
      {isFs ? <Minimize2 className="size-3.5 text-brand" /> : <Maximize2 className="size-3.5 text-brand" />}
      <span className="game-control-label">{isFs ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
    </Button>
  )

  // Xác định bên đang đi: nếu không truyền activeSide thì nhận diện theo chữ trong turnLabel
  const isRed = activeSide
    ? activeSide === 'red'
    : !(turnLabel && (turnLabel.toLowerCase().includes('đen') || turnLabel.includes('O')))

  const cleanSideLabel = turnLabel.replace(/^Lượt:\s*/i, '').trim()

  const cumChedo = (
    <CumPvePvp
      mode={mode}
      onModeChange={onModeChange}
      aiLevel={aiLevel}
      onAiLevelChange={onAiLevelChange}
      onlineAvailable={onlineAvailable}
      chiPve={chiPve}
      phuPve={phuPve}
      nhanChip={nhanChipPve}
      phuPvp={phuPvp}
      nhanChipPvp={nhanChipPvp}
    />
  )

  const laBatDau = resetNoiBat || resetLabel === 'Bắt đầu'
  const nutReset = (
    <Button
      variant={laBatDau ? 'default' : 'outline'}
      size="sm"
      onClick={onReset}
      disabled={resetDisabled}
      aria-label={resetLabel ?? 'Xin thua'}
      title={resetLabel ?? 'Xin thua'}
      data-testid="nut-hanh-dong-chinh"
      className={cn(
        'gap-2 text-xs font-black transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer',
        laBatDau
          ? 'h-9 px-3.5 sm:px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-brand hover:bg-brand-hover text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/30 uppercase tracking-wider'
          : resetLabel === 'Ván mới'
            ? 'h-8 px-2.5 bg-brand text-brand-foreground hover:bg-brand/90 font-bold'
            : 'h-8 px-2 border-white/15 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 font-bold',
      )}
    >
      {resetIcon ?? (laBatDau ? <Play className="size-4 fill-white text-white drop-shadow" /> : resetLabel === 'Ván mới' ? <RotateCcw className="size-3.5 text-white" /> : <Flag className="size-3.5 text-rose-400" />)}
      <span className="game-control-label">{resetLabel ?? 'Xin thua'}</span>
      {surrenderAttempts !== undefined && surrenderAttempts > 0 && resetLabel !== 'Ván mới' && (
        <span className="game-control-label text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {surrenderAttempts}/3
        </span>
      )}
    </Button>
  )

  return (
    <div className="game-toolbar-frame w-full min-w-0 shrink-0">
      <div
        data-testid="game-play-toolbar"
        role="toolbar"
        aria-label={title ? `Điều khiển ${title}` : 'Điều khiển trò chơi'}
        className={cn(
          'game-play-toolbar relative flex items-center justify-between gap-1.5 sm:gap-2.5 w-full min-w-0 select-none',
          className,
        )}
      >
        {/* ── 1. Nút quay lại sảnh (Icon ngoài cùng bên trái CỐ ĐỊNH) & Tiêu đề game ── */}
        <div className="game-toolbar-fixed-left flex items-center gap-2 min-w-0">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              aria-label="Quay lại sảnh"
              title="Quay lại sảnh"
              className="gap-1.5 font-bold border-white/15 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 text-xs h-8 px-2 shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <ArrowLeft className="size-3.5 text-white" />
              <span className="game-control-label">Quay lại sảnh</span>
            </Button>
          )}
          {title && (
            <>
              <div className="game-control-detail h-4 w-px bg-white/10 shrink-0" />
              <div className="game-toolbar-title hidden sm:flex items-center gap-2 min-w-0">
                {icon && (
                  <div className="size-7 sm:size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-sm shrink-0">
                    {icon}
                  </div>
                )}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-text-primary truncate">
                    {title}
                  </span>
                  {badge && (
                    <span className="text-[10px] font-medium font-mono px-1.5 py-0.2 rounded-md bg-white/5 border border-white/10 text-text-tertiary shrink-0">
                      {badge}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 2. Cụm icon ở giữa: PvE/PvP, Biểu cảm, Toàn màn hình (Kéo qua kéo lại khi hover giữ im) ── */}
        <div
          ref={centerScrollRef}
          onPointerDown={batDauKeo}
          onPointerMove={keo}
          onPointerUp={thaKeo}
          onPointerCancel={thaKeo}
          onClickCapture={chanClickKhiKeo}
          className={cn(
            'game-toolbar-scrollable-center flex items-center gap-1.5 min-w-0 overflow-x-auto py-0.5 touch-pan-x',
            dangKeo ? 'cursor-grabbing select-none' : 'cursor-grab',
          )}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="game-toolbar-modes min-w-0 flex items-center justify-center shrink-0">{cumChedo}</div>
          {rightSlot && <div className="game-toolbar-slot flex items-center shrink-0">{rightSlot}</div>}
          {nutFullscreen && <div className="game-toolbar-fullscreen flex items-center shrink-0">{nutFullscreen}</div>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('activity:open-panel', { detail: 'messages' }))}
            className="h-8 gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer shrink-0"
            title="Mở trò chuyện phòng"
            aria-label="Trò chuyện phòng"
          >
            <MessageCircle className="size-3.5 text-brand" />
            <span className="game-control-label">Chat</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.dispatchEvent(new CustomEvent('activity:open-panel', { detail: 'leaderboard' }))}
            className="h-8 gap-1.5 border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer shrink-0"
            title="Mở bảng xếp hạng"
            aria-label="Bảng xếp hạng"
          >
            <Trophy className="size-3.5 text-amber-400" />
            <span className="game-control-label">Xếp hạng</span>
          </Button>
          {!hideCenterTurn && (
            <div className="game-toolbar-turn flex min-w-0 items-center justify-center px-1 shrink-0">
              {outcomeNotice ? (
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-sm">
                  {outcomeNotice}
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-200',
                    isRed
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                      : isAiThinking
                        ? 'bg-brand/10 border border-brand/35 text-brand'
                        : 'bg-slate-900/80 border border-white/10 text-slate-200',
                  )}
                >
                  {isRed ? (
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                    </span>
                  ) : isAiThinking ? (
                    <Zap className="size-3.5 text-brand animate-spin" />
                  ) : (
                    (turnIndicator ?? <span className="size-2.5 rounded-full bg-slate-500 ring-2 ring-slate-400/50 animate-pulse" />)
                  )}

                  <span>
                    {isRed
                      ? (mode === 'ai' ? `● Tới lượt bạn (${cleanSideLabel})` : `● Lượt ${cleanSideLabel}`)
                      : (mode === 'ai'
                          ? (isAiThinking ? 'Máy đang tính toán…' : 'Lượt của Máy AI')
                          : `● Lượt ${cleanSideLabel}`)}
                  </span>

                  {statusAlert}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. Icon ngoài cùng bên phải CỐ ĐỊNH: Nút hành động chính (Bắt đầu / Ván mới / Xin thua) ── */}
        <div className="game-toolbar-fixed-right flex items-center justify-end gap-2 min-w-0">
          {!hideReset && nutReset}
        </div>
      </div>
    </div>
  )
}
