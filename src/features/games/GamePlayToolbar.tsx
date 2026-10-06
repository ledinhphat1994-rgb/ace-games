import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Flag, Handshake, Lock, Maximize2, Minimize2, Play, RotateCcw, UserPlus, Zap, MessageCircle, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CumPvePvp } from './CumPvePvp'
import { ChonThoiGian } from './ChonThoiGian'
import type { CapDoMay, CheDoChoi } from './cap-do-may'

/** `online`: bàn đối kháng qua mạng do máy chủ làm trọng tài (chỉ có khi bàn cờ mở từ sảnh). */
export type PlayMode = CheDoChoi
export type AiDifficulty = CapDoMay

interface GamePlayToolbarProps {
  onBack?: () => void
  title?: string
  badge?: string
  icon?: React.ReactNode
  mode?: PlayMode
  onModeChange?: (mode: PlayMode) => void
  aiLevel?: AiDifficulty
  onAiLevelChange?: (level: AiDifficulty) => void
  /** Thời gian mỗi lượt (giây) */
  turnSeconds?: number
  onTurnSecondsChange?: (sec: number) => void
  timePresets?: readonly number[]
  onReset: () => void
  resetLabel?: string
  resetIcon?: React.ReactNode
  resetDisabled?: boolean
  hideReset?: boolean
  /** Ẩn cụm chọn chế độ (PvE/PvP) nếu trò chơi không dùng (ví dụ: Rắn Cổ Điển) */
  hideModeSelector?: boolean
  /** PvP chuyển sang Online (bàn mở từ sảnh, đối thủ là người thật) thay vì hai người cùng máy (chỉ với `hideCenterTurn`). */
  onlineAvailable?: boolean
  surrenderAttempts?: number
  activeSide?: 'red' | 'black'
  turnLabel?: string
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
  showRoomChat?: boolean
  showRankings?: boolean
  /** Thẻ / khối đối thủ đặt bên trái cụm điều khiển trung tâm (Vùng 3) */
  opponentSlot?: React.ReactNode
  /** Thẻ / khối người chơi đặt bên phải cụm điều khiển trung tâm (Vùng 3) */
  playerSlot?: React.ReactNode
  /** Thao tác đề nghị hòa cờ */
  roomName?: string
  isPrivate?: boolean
  soPhongHienThi?: string
  onInvite?: () => void
  onOfferDraw?: () => void
  offerDrawDisabled?: boolean
  className?: string
}

export function GamePlayToolbar({
  onBack,
  title,
  badge,
  icon,
  roomName,
  isPrivate,
  soPhongHienThi,
  onInvite,
  mode = 'ai',
  onModeChange = () => {},
  aiLevel = 'medium',
  onAiLevelChange = () => {},
  turnSeconds,
  onTurnSecondsChange,
  timePresets,
  onReset,
  resetLabel,
  resetIcon,
  resetDisabled = false,
  hideReset = false,
  hideModeSelector = false,
  onlineAvailable = false,
  surrenderAttempts,
  activeSide,
  turnLabel = '',
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
  showRoomChat = false,
  showRankings = true,
  opponentSlot,
  playerSlot,
  onOfferDraw,
  offerDrawDisabled = false,
  className,
}: GamePlayToolbarProps) {
  const [internalFullscreen, setInternalFullscreen] = useState(false)
  useEffect(() => {
    const handleFs = () => setInternalFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFs)
    return () => document.removeEventListener('fullscreenchange', handleFs)
  }, [])
  const isFs = isFullscreen ?? internalFullscreen

  // Hỗ trợ kéo qua kéo lại (drag-to-scroll) trên cụm icon ở giữa
  const centerScrollRef = useRef<HTMLDivElement>(null)
  const keoRef = useRef<{ x: number; cuon: number; daKeo: boolean; id: number } | null>(null)
  const [dangKeo, setDangKeo] = useState(false)

  useEffect(() => {
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
      className="size-8 p-0 border-border-default bg-surface text-text-primary hover:bg-surface-raised text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs flex items-center justify-center"
      title={isFs ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
      aria-label="Toàn màn hình"
    >
      {isFs ? <Minimize2 className="size-3.5 text-brand" /> : <Maximize2 className="size-3.5 text-brand" />}
      <span className="sr-only">{isFs ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
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
  const isOver = resetLabel === 'Ván mới' || resetLabel === 'Đấu lại'
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
        'gap-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer',
        laBatDau
          ? 'h-8 px-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-brand hover:bg-brand-hover text-white shadow-md shadow-emerald-500/30 ring-1 ring-white/30'
          : isOver
            ? 'h-8 px-3 bg-brand text-brand-foreground hover:bg-brand/90 font-bold shadow-xs'
            : 'h-8 px-2 border-border-default bg-surface text-text-primary hover:bg-surface-raised font-bold',
      )}
    >
      {resetIcon ?? (laBatDau ? <Play className="size-3.5 fill-white text-white drop-shadow" /> : isOver ? <RotateCcw className="size-3.5 text-white" /> : <Flag className="size-3.5 text-rose-400" />)}
      <span className="game-control-label">{resetLabel ?? 'Xin thua'}</span>
      {surrenderAttempts !== undefined && surrenderAttempts > 0 && !isOver && (
        <span className="game-control-label text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {surrenderAttempts}/3
        </span>
      )}
    </Button>
  )

  const nutThoiGian =
    turnSeconds !== undefined && onTurnSecondsChange ? (
      <ChonThoiGian
        turnSeconds={turnSeconds}
        onTurnSecondsChange={onTurnSecondsChange}
        timePresets={timePresets}
      />
    ) : null

  // ── KHI PHÓNG TO: CHỈ CÒN BÀN CỜ VÀ CARD THỜI GIAN (ĐỂ XEM TỚI LƯỢT AI ĐÁNH) ──
  if (isFs) {
    return (
      <div className="game-toolbar-frame w-full min-w-0 shrink-0 select-none py-1 px-1 sm:px-2">
        <div className="w-full flex items-center justify-between gap-2 max-w-full">
          {/* Card Thời gian ở trung tâm: Đối thủ + Lượt đánh + Đồng hồ + Người chơi */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="game-card-time flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 rounded-2xl border border-border-default bg-surface-raised/90 backdrop-blur-md shadow-xs max-w-full shrink-0">
              {opponentSlot && <div className="game-toolbar-opponent flex items-center shrink-0">{opponentSlot}</div>}
              {!hideCenterTurn && (
                <div className="game-toolbar-turn flex min-w-0 items-center justify-center px-1 shrink-0">
                  {outcomeNotice ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-sm">
                      {outcomeNotice}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all duration-200',
                        isRed
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                          : isAiThinking
                            ? 'bg-brand/10 border border-brand/35 text-brand'
                            : 'bg-surface border border-border-default text-text-secondary',
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
                    </div>
                  )}
                </div>
              )}
              {nutThoiGian && <div className="game-toolbar-time flex items-center shrink-0">{nutThoiGian}</div>}
              {rightSlot && <div className="game-toolbar-slot flex items-center shrink-0">{rightSlot}</div>}
              {playerSlot && <div className="game-toolbar-player flex items-center shrink-0">{playerSlot}</div>}
            </div>
          </div>

          {/* Nút thu nhỏ nhỏ gọn để thoát toàn màn hình */}
          <div className="game-card-fullscreen shrink-0">
            {nutFullscreen}
          </div>
        </div>
      </div>
    )
  }

  // ── CHẾ ĐỘ THƯỜNG: BỐ TRÍ ĐỦ 5 CARD RÕ RÀNG, MẠCH LẠC KHÔNG BAO GIỜ ĐÈ NHAU ──
  return (
    <div className="game-toolbar-frame w-full min-w-0 shrink-0 select-none flex flex-col gap-2 pb-1">
      {/* ── HÀNG 1: CARD 1 (QUAY LẠI SẢNH) + CARD 2 (PVP/PVE) ────── CARD 4 (HÒA/THUA) + CARD 5 (PHÓNG TO) ── */}
      <div
        data-testid="game-play-toolbar"
        role="toolbar"
        aria-label={title ? `Điều khiển ${title}` : 'Điều khiển trò chơi'}
        className={cn(
          'game-play-toolbar flex items-center justify-between gap-2 w-full min-w-0 py-0.5',
          className,
        )}
      >
        {/* Nhóm trái: Card 1 (Quay lại sảnh) & Card 2 (PvP/PvE) */}
        <div className="game-toolbar-fixed-left flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          {/* Card 1: Quay lại sảnh */}
          <div className="game-card-back flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-xl border border-border-default bg-surface/90 backdrop-blur-md shadow-xs shrink-0">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                id="game-leave-btn"
                aria-label="Quay lại sảnh"
                title="Quay lại sảnh"
                className="gap-1 font-bold border-border-default bg-surface text-text-primary hover:bg-surface-raised text-xs h-8 px-2 shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xs"
              >
                <ArrowLeft className="size-3.5 text-text-primary" />
                <span className="hidden sm:inline font-medium">Sảnh</span>
              </Button>
            )}

            {roomName ? (
              <div className="flex items-center gap-1.5 px-0.5 min-w-0">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-text-primary whitespace-nowrap shrink-0">
                  {roomName} {soPhongHienThi ? `#${soPhongHienThi}` : ''}
                </span>
                {isPrivate && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 shrink-0">
                    <Lock className="size-2.5 text-amber-400" />
                    <span className="hidden sm:inline">Riêng tư</span>
                  </span>
                )}
              </div>
            ) : title ? (
              <div className="flex items-center gap-1.5 px-0.5 min-w-0">
                {icon && (
                  <div className="size-6 sm:size-7 rounded-lg bg-surface-raised border border-border-default flex items-center justify-center shadow-xs shrink-0">
                    {icon}
                  </div>
                )}
                <span className="text-xs sm:text-sm font-bold tracking-tight text-text-primary truncate hidden sm:inline">
                  {title}
                </span>
                {badge && (
                  <span className="text-[10px] font-medium font-mono px-1.5 py-0.2 rounded-md bg-surface-raised border border-border-subtle text-text-secondary shrink-0 hidden md:inline">
                    {badge}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Card 2: PVP / PVE */}
          {!hideModeSelector && (
            <div className="game-card-mode flex items-center p-1 sm:p-1.5 rounded-xl border border-border-default bg-surface/90 backdrop-blur-md shadow-xs shrink-0">
              <div className="game-toolbar-modes min-w-0 flex items-center justify-center shrink-0">
                {cumChedo}
              </div>
            </div>
          )}

          {/* VÙNG 3+: Nút Mời chơi cạnh PvP/PvE */}
          {onInvite && (
            <Button
              size="sm"
              variant="outline"
              onClick={onInvite}
              className="h-8 px-2 sm:px-2.5 rounded-xl text-xs font-semibold gap-1 sm:gap-1.5 border-border-default bg-surface hover:bg-surface-raised text-text-primary cursor-pointer transition-colors duration-150 shrink-0"
              title="Mời người chơi theo tên"
            >
              <UserPlus className="size-3.5 text-sky-400" />
              <span className="hidden sm:inline">Mời chơi</span>
            </Button>
          )}
        </div>

        {/* Nhóm phải: Card 4 (Hòa / Thua) & Card 5 (Phóng to) */}
        <div className="game-toolbar-fixed-right flex items-center justify-end gap-1.5 sm:gap-2 min-w-0 shrink-0">
          {/* Card 4: Hòa / Thua */}
          <div className="game-card-action flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-xl border border-border-default bg-surface/90 backdrop-blur-md shadow-xs shrink-0">
            {!isOver && onOfferDraw && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOfferDraw}
                disabled={offerDrawDisabled}
                aria-label="Xin hòa"
                title="Đề nghị hòa cờ"
                className="h-8 px-2 sm:px-2.5 gap-1 sm:gap-1.5 text-xs font-bold border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 transition-all active:scale-95 cursor-pointer shadow-xs shrink-0"
              >
                <Handshake className="size-3.5 text-amber-400" />
                <span className="game-control-label">Xin hòa</span>
              </Button>
            )}
            {!hideReset && nutReset}
          </div>

          {/* Card 5: Phóng to */}
          {!hideFullscreen && (
            <div className="game-card-fullscreen flex items-center p-1 sm:p-1.5 rounded-xl border border-border-default bg-surface/90 backdrop-blur-md shadow-xs shrink-0">
              {nutFullscreen}
            </div>
          )}
        </div>
      </div>

      {/* ── HÀNG 2: CARD 3 (THỜI GIAN, ĐỒNG HỒ & LƯỢT ĐI) CĂN GIỮA NẰM NGAY TRÊN BÀN CỜ ── */}
      {(!hideCenterTurn || Boolean(opponentSlot || nutThoiGian || rightSlot || playerSlot || showRoomChat || showRankings)) && (
        <div className="w-full flex items-center justify-center pt-0.5">
        <div
          ref={centerScrollRef}
          onPointerDown={batDauKeo}
          onPointerMove={keo}
          onPointerUp={thaKeo}
          onPointerCancel={thaKeo}
          onClickCapture={chanClickKhiKeo}
          className={cn(
            'game-toolbar-scrollable-center flex items-center justify-center min-w-0 max-w-full overflow-x-auto py-0.5 touch-pan-x',
            /* sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:z-10 */
            dangKeo ? 'cursor-grabbing select-none' : 'cursor-grab',
          )}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="game-card-time flex items-center gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 rounded-2xl border border-border-default bg-surface-raised/90 backdrop-blur-md shadow-xs max-w-full shrink-0">
            {opponentSlot && <div className="game-toolbar-opponent flex items-center shrink-0">{opponentSlot}</div>}

            {!hideCenterTurn && (
              <div className="game-toolbar-turn flex min-w-0 items-center justify-center px-1 shrink-0">
                {outcomeNotice ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-sm">
                    {outcomeNotice}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all duration-200',
                      isRed
                        ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                        : isAiThinking
                          ? 'bg-brand/10 border border-brand/35 text-brand'
                          : 'bg-surface border border-border-default text-text-secondary',
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

            {nutThoiGian && <div className="game-toolbar-time flex items-center shrink-0">{nutThoiGian}</div>}
            {rightSlot && <div className="game-toolbar-slot flex items-center shrink-0">{rightSlot}</div>}
            {playerSlot && <div className="game-toolbar-player flex items-center shrink-0">{playerSlot}</div>}

            {showRoomChat && (
              <Button
                variant="ghost"
                size="sm"
                data-testid="game-room-chat-trigger"
                onClick={() => window.dispatchEvent(new CustomEvent('activity:open-panel', { detail: 'messages' }))}
                className="h-8 gap-1.5 border border-border-default bg-surface hover:bg-surface-raised px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer shrink-0"
                title="Mở trò chuyện phòng"
                aria-label="Trò chuyện phòng"
              >
                <MessageCircle className="size-3.5 text-brand" />
                <span className="game-control-label">Chat</span>
              </Button>
            )}
            {showRankings && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('activity:open-panel', { detail: 'leaderboard' }))}
                className="h-8 gap-1.5 border border-border-default bg-surface hover:bg-surface-raised px-2.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-all active:scale-95 cursor-pointer shrink-0"
                title="Mở bảng xếp hạng"
                aria-label="Bảng xếp hạng"
              >
                <Trophy className="size-3.5 text-amber-400" />
                <span className="game-control-label">Xếp hạng</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
