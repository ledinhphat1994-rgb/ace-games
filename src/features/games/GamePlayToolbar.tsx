import React from 'react'
import { ArrowLeft, Bot, ChevronDown, Flag, RotateCcw, Swords, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/** `online`: bàn đối kháng qua mạng do máy chủ làm trọng tài (chỉ có khi bàn cờ mở từ sảnh). */
export type PlayMode = 'ai' | 'pass_and_play' | 'online'
export type AiDifficulty = 'easy' | 'medium' | 'hard'

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
  className,
}: GamePlayToolbarProps) {
  // Xác định bên đang đi: nếu không truyền activeSide thì nhận diện theo chữ trong turnLabel
  const isRed = activeSide
    ? activeSide === 'red'
    : !(turnLabel && (turnLabel.toLowerCase().includes('đen') || turnLabel.includes('O')))

  const cleanSideLabel = turnLabel.replace(/^Lượt:\s*/i, '').trim()

  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-2 w-full py-1 shrink-0 min-w-0',
        className,
      )}
    >
      {/* ── 1. Nút quay lại sảnh & Tiêu đề nổi bật tên game ── */}
      <div className="flex items-center gap-2 min-w-0 z-10">
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            aria-label="Quay lại sảnh"
            className="gap-1.5 font-bold border-white/10 hover:bg-white/5 text-xs text-text-secondary hover:text-white h-8 px-2 shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden 2xl:inline">Quay lại sảnh</span>
          </Button>
        )}
        {title && (
          <>
            <div className="h-4 w-px bg-white/10 hidden 2xl:block shrink-0" />
            <div className="hidden 2xl:flex items-center gap-2 min-w-0">
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

      {/* ── 2. KHU VỰC CHÍNH GIỮA: CĂN GIỮA TUYỆT ĐỐI THEO BẢNG CHÍNH (50% TRỤC GIỮA) ── */}
      {hideCenterTurn ? (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-10">
          {/* Cụm chế độ chơi chuyên nghiệp: PvE (Đấu máy) | PvP (Đối kháng) - KHÓA KÍCH THƯỚC CỐ ĐỊNH */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-950/80 p-1 border border-white/10 text-xs font-semibold shadow-md shrink-0 w-[220px] sm:w-[240px] h-10 box-border">
            {/* 1. NÚT PvE (Đấu với máy AI) */}
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    onClick={() => onModeChange('ai')}
                    aria-label={mode === 'ai' ? 'Chế độ PvE (Đấu máy), chọn độ khó' : 'Chế độ PvE (Đấu máy)'}
                    className={cn(
                      'flex items-center justify-center gap-1 rounded-lg px-1.5 text-xs transition-all cursor-pointer h-full w-full font-black tracking-wide',
                      mode === 'ai'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm ring-1 ring-white/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                    )}
                    title="Nhấn để chơi PvE (Đấu máy) hoặc chọn độ khó"
                  >
                    <Bot className="size-3.5 shrink-0" />
                    <span>PvE</span>
                    {mode === 'ai' && (
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-1 py-0.5 rounded-full border shadow-sm shrink-0 flex items-center gap-0.5 ml-0.5',
                          aiLevel === 'easy' && 'bg-emerald-400 text-slate-950 border-emerald-300',
                          aiLevel === 'medium' && 'bg-amber-400 text-slate-950 border-amber-200',
                          aiLevel === 'hard' && 'bg-rose-500 text-white border-rose-300',
                        )}
                      >
                        {aiLevel === 'easy' ? 'Dễ' : aiLevel === 'medium' ? 'Vừa' : 'Khó'}
                        <ChevronDown className="size-2 opacity-70" />
                      </span>
                    )}
                  </button>
                }
              />

              <PopoverContent
                align="center"
                side="bottom"
                sideOffset={6}
                className="w-52 p-2 bg-[#0e1628]/95 border-white/15 backdrop-blur-md shadow-2xl text-xs"
              >
                <div className="text-[11px] font-bold text-text-tertiary px-1 pb-1 mb-1.5 border-b border-white/10 flex items-center justify-between">
                  <span>Cấp độ Máy AI</span>
                  <span className="text-[10px] text-slate-400 font-normal">3 mức</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        onModeChange('ai')
                        onAiLevelChange(lvl)
                      }}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left border',
                        aiLevel === lvl && mode === 'ai'
                          ? lvl === 'easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : lvl === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                          : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'size-2 rounded-full',
                            lvl === 'easy' && 'bg-emerald-400',
                            lvl === 'medium' && 'bg-amber-400',
                            lvl === 'hard' && 'bg-rose-400',
                          )}
                        />
                        <span>{lvl === 'easy' ? 'Dễ (Cơ bản)' : lvl === 'medium' ? 'Vừa (Tiêu chuẩn)' : 'Khó (Cao thủ)'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* 2. NÚT PvP (Người đấu Người) */}
            <button
              type="button"
              onClick={() => onModeChange(onlineAvailable ? 'online' : 'pass_and_play')}
              aria-label="Chế độ PvP (Đối kháng)"
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg px-1.5 text-xs transition-all cursor-pointer h-full w-full font-black tracking-wide',
                mode === 'online' || mode === 'pass_and_play'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
              )}
              title="Chế độ PvP (Đối kháng)"
            >
              <Swords className="size-3.5 shrink-0" />
              <span>PvP</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center px-1 shrink-0">
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

      {/* ── 3. KHU VỰC BÊN PHẢI (Khi hideCenterTurn = false) ── */}
      {!hideCenterTurn ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="grid grid-cols-2 rounded-xl bg-slate-950/70 p-0.5 border border-white/10 text-xs font-semibold shadow-sm w-[330px] sm:w-[350px]">
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    onClick={() => onModeChange('ai')}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs transition-all cursor-pointer h-8 w-full',
                      mode === 'ai'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                    )}
                    title="Nhấn để chơi PvE (Đấu máy) hoặc chọn độ khó"
                  >
                    <Bot className="size-3.5 shrink-0" />
                    <span className="whitespace-nowrap font-bold">PvE</span>
                    {mode === 'ai' && (
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border shadow-sm shrink-0 flex items-center gap-0.5 ml-0.5',
                          aiLevel === 'easy' && 'bg-emerald-400 text-slate-950 border-emerald-300',
                          aiLevel === 'medium' && 'bg-amber-400 text-slate-950 border-amber-200',
                          aiLevel === 'hard' && 'bg-rose-500 text-white border-rose-300',
                        )}
                      >
                        {aiLevel === 'easy' ? 'Dễ' : aiLevel === 'medium' ? 'Vừa' : 'Khó'}
                        <ChevronDown className="size-2.5 opacity-70" />
                      </span>
                    )}
                  </button>
                }
              />
              <PopoverContent
                align="start"
                side="bottom"
                sideOffset={6}
                className="w-52 p-2 bg-[#0e1628]/95 border-white/15 backdrop-blur-md shadow-2xl text-xs"
              >
                <div className="text-[11px] font-bold text-text-tertiary px-1 pb-1 mb-1.5 border-b border-white/10 flex items-center justify-between">
                  <span>Cấp độ Máy AI</span>
                  <span className="text-[10px] text-slate-400 font-normal">3 mức</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        onModeChange('ai')
                        onAiLevelChange(lvl)
                      }}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-left border',
                        aiLevel === lvl && mode === 'ai'
                          ? lvl === 'easy'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                            : lvl === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                          : 'border-transparent text-slate-300 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'size-2 rounded-full',
                            lvl === 'easy' && 'bg-emerald-400',
                            lvl === 'medium' && 'bg-amber-400',
                            lvl === 'hard' && 'bg-rose-400',
                          )}
                        />
                        <span>{lvl === 'easy' ? 'Dễ (Cơ bản)' : lvl === 'medium' ? 'Vừa (Tiêu chuẩn)' : 'Khó (Cao thủ)'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <button
              type="button"
              onClick={() => onModeChange('pass_and_play')}
              aria-label="Chế độ PvP (Đối kháng)"
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg px-1.5 text-xs transition-all cursor-pointer h-8 w-full min-w-0 font-bold',
                mode === 'pass_and_play'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
              )}
            >
              <Users className="size-3.5 shrink-0" />
              <span className="font-bold truncate">PvP</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={resetDisabled}
            aria-label={resetLabel ?? 'Xin thua'}
            className="h-8 gap-1.5 border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10 font-bold transition-all hover:scale-105 active:scale-95 order-3 shrink-0 px-2"
          >
            {resetIcon ?? (resetLabel === 'Ván mới' ? <RotateCcw className="size-3.5" /> : <Flag className="size-3.5 text-rose-400" />)}
            <span className="hidden min-[420px]:inline">{resetLabel ?? 'Xin thua'}</span>
            {surrenderAttempts !== undefined && surrenderAttempts > 0 && resetLabel !== 'Ván mới' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {surrenderAttempts}/3
              </span>
            )}
          </Button>
        </div>
      ) : (
        /* VÙNG 2+: Nút hành động bên phải đưa sang bên phải thanh toolbar, thẳng hàng với cột bên phải */
        <div className="flex items-center justify-end gap-2 shrink-0 z-10 min-w-0">
          {rightSlot}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={resetDisabled}
            aria-label={resetLabel ?? 'Xin thua'}
            className="h-8 gap-1.5 border-white/10 bg-white/5 text-xs text-slate-200 hover:bg-white/10 font-bold transition-all hover:scale-105 active:scale-95 shrink-0 px-2"
          >
            {resetIcon ?? (resetLabel === 'Ván mới' ? <RotateCcw className="size-3.5" /> : <Flag className="size-3.5 text-rose-400" />)}
            <span className="hidden min-[420px]:inline">{resetLabel ?? 'Xin thua'}</span>
            {surrenderAttempts !== undefined && surrenderAttempts > 0 && resetLabel !== 'Ván mới' && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {surrenderAttempts}/3
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
