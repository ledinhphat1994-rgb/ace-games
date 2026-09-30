import React from 'react'
import { ArrowLeft, Flag, Maximize2, Minimize2, Play, RotateCcw, Zap } from 'lucide-react'
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
      className="h-8 gap-1.5 border-white/10 bg-white/5 px-2 text-xs font-bold text-slate-200 transition-all hover:scale-105 hover:bg-white/10 active:scale-95 cursor-pointer shrink-0"
      title={isFs ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
      aria-label="Toàn màn hình"
    >
      {isFs ? <Minimize2 className="size-3.5 text-cyan-400" /> : <Maximize2 className="size-3.5 text-cyan-400" />}
      <span className="hidden min-[480px]:inline">{isFs ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
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
      data-testid="nut-hanh-dong-chinh"
      className={cn(
        'gap-2 text-xs font-black transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer',
        laBatDau
          ? 'h-9 px-3.5 sm:px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-white/30 uppercase tracking-wider'
          : resetLabel === 'Ván mới'
            ? 'h-8 px-2.5 bg-brand text-brand-foreground hover:bg-brand/90 font-bold'
            : 'h-8 px-2 border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 font-bold',
      )}
    >
      {resetIcon ?? (laBatDau ? <Play className="size-4 fill-white text-white drop-shadow" /> : resetLabel === 'Ván mới' ? <RotateCcw className="size-3.5" /> : <Flag className="size-3.5 text-rose-400" />)}
      <span>{resetLabel ?? 'Xin thua'}</span>
      {surrenderAttempts !== undefined && surrenderAttempts > 0 && resetLabel !== 'Ván mới' && (
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {surrenderAttempts}/3
        </span>
      )}
    </Button>
  )

  return (
    <div className="game-toolbar-frame w-full min-w-0 shrink-0">
      <div
        data-testid="game-play-toolbar"
        className={cn(
          'game-play-toolbar relative grid items-center gap-x-3 gap-y-2 w-full py-1 min-w-0',
          className,
        )}
      >
        {/* ── 1. Nút quay lại sảnh & Tiêu đề nổi bật tên game (Vùng 2+ sát mép trái) ── */}
        <div className="game-toolbar-identity flex items-center gap-2 min-w-0 z-10">
          {onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              aria-label="Quay lại sảnh"
              className="gap-1.5 font-bold border-white/10 hover:bg-white/5 text-xs text-text-secondary hover:text-white h-8 px-2 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Quay lại sảnh</span>
            </Button>
          )}
          {title && (
            <>
              <div className="h-4 w-px bg-white/10 hidden sm:block shrink-0" />
              <div className="game-toolbar-title hidden sm:flex items-center gap-2 min-w-0">
                {icon && (
                  <div className="size-7 sm:size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-sm shrink-0">
                    {icon}
                  </div>
                )}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={cn(
                      'text-sm sm:text-base font-black tracking-wide uppercase bg-clip-text text-transparent drop-shadow-sm truncate',
                      title.toLowerCase().includes('tướng')
                        ? 'bg-gradient-to-r from-red-400 to-rose-400'
                        : title.toLowerCase().includes('rắn')
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                          : 'bg-gradient-to-r from-amber-400 to-yellow-300',
                    )}
                  >
                    {title}
                  </span>
                  {badge && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-300 shrink-0">
                      {badge}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── 2. Cụm chuyển đổi chế độ PvE/PvP (Vùng 4+ lên sát mép trên ở giữa) ── */}
        <div className="game-toolbar-modes min-w-0 flex items-center justify-center">{cumChedo}</div>
        {!hideCenterTurn && (
          <div className="game-toolbar-turn flex min-w-0 items-center justify-center px-1">
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
                      ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900/80 border border-white/10 text-slate-200',
                )}
              >
                {isRed ? (
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                  </span>
                ) : isAiThinking ? (
                  <Zap className="size-3.5 text-cyan-400 animate-spin" />
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

        {/* ── 3. Các thao tác hành động (Vùng 3+ ra sát mép phải) ── */}
        <div className="game-toolbar-actions flex items-center justify-end gap-2 z-10 min-w-0">
          {rightSlot}
          {nutFullscreen}
          {nutReset}
        </div>
      </div>
    </div>
  )
}
