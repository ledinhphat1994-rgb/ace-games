import { useEffect, useRef } from 'react'
import { Check, Clock, Lock, Sliders, Timer, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { playClockTickSound } from '@/features/games/game-audio'

export const TIME_PRESETS = [15, 30, 60, 90, 120] as const
export type TurnTimePreset = (typeof TIME_PRESETS)[number]

export interface GameClockWidgetProps {
  /** Thời gian còn lại (giây) của lượt hiện tại */
  timeRemaining: number
  /** Mốc thời gian suy nghĩ cấu hình (giây) */
  turnSeconds: number
  /** Ván đấu đang chạy hay chưa */
  isPlaying: boolean
  /** Có phải lượt của người chơi ta không */
  isMyTurn: boolean
  /** Nhãn người chơi ta */
  playerLabel?: string
  /** Nhãn đối thủ / máy */
  opponentLabel?: string
  /** Chế độ chơi online có đối thủ qua mạng */
  isOnline: boolean
  /** Đề xuất thời gian từ đối thủ (nếu có) */
  opponentProposal?: number | null
  /** Đề xuất của chính mình đang chờ đối thủ duyệt */
  myPendingProposal?: number | null
  /** Khi bấm chọn / đề xuất mốc thời gian mới */
  onProposeTime: (seconds: number) => void
  /** Khi đồng ý đề xuất thời gian từ đối thủ */
  onAcceptProposal?: (seconds: number) => void
  /** Khi từ chối đề xuất thời gian từ đối thủ */
  onRejectProposal?: () => void
  /** Tone màu */
  theme?: 'red' | 'amber' | 'cyan'
  className?: string
}

function formatClockTime(sec: number): string {
  const safe = Math.max(0, Math.floor(sec))
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function GameClockWidget({
  timeRemaining,
  turnSeconds,
  isPlaying,
  isMyTurn,
  playerLabel = 'BẠN',
  opponentLabel = 'ĐỐI THỦ',
  isOnline,
  opponentProposal,
  myPendingProposal,
  onProposeTime,
  onAcceptProposal,
  onRejectProposal,
  theme = 'amber',
  className,
}: GameClockWidgetProps) {
  // Phát âm thanh tích tắc ở 5 giây cuối kịch tính
  const lastTickedSecondRef = useRef<number | null>(null)
  useEffect(() => {
    if (isPlaying && isMyTurn && timeRemaining <= 5 && timeRemaining > 0) {
      if (lastTickedSecondRef.current !== timeRemaining) {
        lastTickedSecondRef.current = timeRemaining
        playClockTickSound()
      }
    } else {
      lastTickedSecondRef.current = null
    }
  }, [isPlaying, isMyTurn, timeRemaining])

  const safeTurnSeconds = Math.max(10, turnSeconds || 30)
  const progressRatio = Math.max(0, Math.min(1, timeRemaining / safeTurnSeconds))
  const isEmergency = isPlaying && timeRemaining <= 5 && timeRemaining > 0

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-gradient-to-b from-[#0b1329]/95 to-[#070c1a]/95 border border-white/10 shadow-xl backdrop-blur-md p-3 flex flex-col gap-2.5 select-none transition-all duration-300',
        className,
      )}
    >
      {/* ── HEADER: Tiêu đề & Trạng thái Khóa / Cấu hình ── */}
      <div className="flex items-center justify-between gap-1 border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Timer
            className={cn(
              'size-4 shrink-0',
              theme === 'red' && 'text-red-400',
              theme === 'amber' && 'text-amber-400',
              theme === 'cyan' && 'text-cyan-400',
            )}
          />
          <span className="text-[11px] font-black tracking-wider text-slate-200 uppercase truncate">
            ĐỒNG HỒ SUY NGHĨ
          </span>
        </div>

        {isPlaying ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 border border-rose-500/40 text-rose-300 shrink-0">
            <Lock className="size-2.5" />
            <span>Đã khóa</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shrink-0">
            <Sliders className="size-2.5" />
            <span>Thiết lập</span>
          </span>
        )}
      </div>

      {/* ── PHẦN ĐỒNG HỒ SỐ (DUAL DIGITAL CLOCK) ── */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Ô 1: BÊN BẠN */}
        <div
          className={cn(
            'relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 overflow-hidden',
            isMyTurn && isPlaying
              ? isEmergency
                ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                : theme === 'red'
                  ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                  : theme === 'cyan'
                    ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'bg-slate-900/60 border-white/5 opacity-70',
          )}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate max-w-full">
            {isMyTurn && isPlaying && <span className="size-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />}
            <span className="truncate">{playerLabel}</span>
          </div>

          <div
            className={cn(
              'font-mono font-black text-xl xl:text-2xl tracking-tight',
              isMyTurn && isPlaying
                ? isEmergency
                  ? 'text-rose-400'
                  : 'text-white'
                : 'text-slate-400',
            )}
          >
            {formatClockTime(isMyTurn && isPlaying ? timeRemaining : safeTurnSeconds)}
          </div>

          {/* Progress bar rút dần khi tới lượt */}
          {isMyTurn && isPlaying && (
            <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div
                style={{ width: `${progressRatio * 100}%` }}
                className={cn(
                  'h-full transition-all duration-200 rounded-full',
                  isEmergency
                    ? 'bg-rose-500'
                    : theme === 'red'
                      ? 'bg-red-400'
                      : theme === 'cyan'
                        ? 'bg-cyan-400'
                        : 'bg-amber-400',
                )}
              />
            </div>
          )}
        </div>

        {/* Ô 2: ĐỐI THỦ / MÁY */}
        <div
          className={cn(
            'relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 overflow-hidden',
            !isMyTurn && isPlaying
              ? isEmergency
                ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
                : 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
              : 'bg-slate-900/60 border-white/5 opacity-70',
          )}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate max-w-full">
            {!isMyTurn && isPlaying && <span className="size-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />}
            <span className="truncate">{opponentLabel}</span>
          </div>

          <div
            className={cn(
              'font-mono font-black text-xl xl:text-2xl tracking-tight',
              !isMyTurn && isPlaying
                ? isEmergency
                  ? 'text-rose-400'
                  : 'text-white'
                : 'text-slate-400',
            )}
          >
            {formatClockTime(!isMyTurn && isPlaying ? timeRemaining : safeTurnSeconds)}
          </div>

          {/* Progress bar đối thủ */}
          {!isMyTurn && isPlaying && (
            <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div
                style={{ width: `${progressRatio * 100}%` }}
                className={cn(
                  'h-full transition-all duration-200 rounded-full',
                  isEmergency ? 'bg-rose-500' : 'bg-cyan-400',
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── CẤU HÌNH THỜI GIAN SUY NGHĨ TRƯỚC TRẬN ĐẤU ── */}
      {!isPlaying ? (
        <div className="flex flex-col gap-2 pt-1 border-t border-white/10">
          {/* Thông báo đề xuất từ đối thủ (nếu có) */}
          {isOnline && opponentProposal ? (
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 flex flex-col gap-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Clock className="size-3.5 shrink-0" />
                <span>Đối thủ đề xuất: {opponentProposal}s / lượt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAcceptProposal?.(opponentProposal)}
                  className="flex-1 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <Check className="size-3" />
                  <span>Đồng ý</span>
                </button>
                <button
                  type="button"
                  onClick={onRejectProposal}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="size-3" />
                  <span>Từ chối</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                <span>Chọn thời gian / lượt:</span>
                {isOnline && myPendingProposal && (
                  <span className="text-amber-400 font-medium animate-pulse">Chờ đối thủ duyệt...</span>
                )}
              </div>

              {/* Dãy chip chọn mốc thời gian */}
              <div className="grid grid-cols-5 gap-1">
                {TIME_PRESETS.map((sec) => {
                  const isSelected = (myPendingProposal ?? safeTurnSeconds) === sec
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => onProposeTime(sec)}
                      className={cn(
                        'py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-black transition-all cursor-pointer border text-center',
                        isSelected
                          ? theme === 'red'
                            ? 'bg-red-500 text-white border-red-400 shadow-sm'
                            : theme === 'cyan'
                              ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm'
                              : 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      {sec}s
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        /* Khi ván đang chạy: Báo thời gian suy nghĩ cố định */
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1 pt-0.5">
          <span>Giới hạn suy nghĩ:</span>
          <span className="text-slate-200 font-bold">{safeTurnSeconds}s / lượt</span>
        </div>
      )}
    </div>
  )
}
