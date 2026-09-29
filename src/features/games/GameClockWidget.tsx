import { useEffect, useRef } from 'react'
import { Check, Clock, X } from 'lucide-react'
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
  playerLabel = 'LƯỢT BẠN',
  opponentLabel = 'LƯỢT ĐỐI THỦ',
  isOnline,
  opponentProposal,
  myPendingProposal,
  onProposeTime,
  onAcceptProposal,
  onRejectProposal,
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

  // Nhãn và màu sắc: Mình = Xanh | Đối thủ = Đỏ
  const currentLabel = isMyTurn ? playerLabel : opponentLabel

  return (
    <div
      className={cn(
        'w-full rounded-2xl bg-gradient-to-b from-[#0b1329]/95 to-[#070c1a]/95 border border-white/10 shadow-xl backdrop-blur-md p-3 flex flex-col justify-between gap-2 select-none transition-all duration-300 min-h-[175px]',
        className,
      )}
    >
      {/* ── 1 Ô ĐỒNG HỒ ĐẾM NGƯỢC DUY NHẤT: Mình = Xanh | Đối thủ = Đỏ ── */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 overflow-hidden flex-1 justify-center',
          isMyTurn
            ? isEmergency
              ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.35)]'
            : isEmergency
              ? 'bg-rose-950/60 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
              : 'bg-rose-950/40 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.35)]',
        )}
      >
        {/* Tên bên đang đến lượt: Mình xanh, Địch đỏ */}
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider mb-1">
          <span
            className={cn(
              'size-2 rounded-full shrink-0',
              isMyTurn
                ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
                : 'bg-rose-500 shadow-[0_0_6px_#f43f5e]',
              isPlaying && 'animate-ping',
            )}
          />
          <span
            className={cn(
              'truncate max-w-[150px]',
              isMyTurn ? 'text-cyan-300' : 'text-rose-300',
            )}
          >
            {currentLabel}
          </span>
        </div>

        {/* Số đếm ngược to rõ */}
        <div
          className={cn(
            'font-mono font-black text-3xl sm:text-4xl tracking-tight leading-none my-1 drop-shadow-md',
            isEmergency
              ? 'text-rose-400 animate-pulse'
              : isMyTurn
                ? 'text-cyan-200'
                : 'text-rose-200',
          )}
        >
          {formatClockTime(isPlaying ? timeRemaining : safeTurnSeconds)}
        </div>

        {/* Thanh progress bar rút dần theo thời gian */}
        {isPlaying && (
          <div className="w-full h-1.5 bg-black/40 rounded-full mt-2 overflow-hidden border border-white/5">
            <div
              style={{ width: `${progressRatio * 100}%` }}
              className={cn(
                'h-full transition-all duration-200 rounded-full',
                isEmergency
                  ? 'bg-rose-500'
                  : isMyTurn
                    ? 'bg-cyan-400'
                    : 'bg-rose-500',
              )}
            />
          </div>
        )}
      </div>

      {/* ── CẤU HÌNH THỜI GIAN TRƯỚC TRẬN ĐẤU / HOẶC TRẠNG THÁI KHI ĐANG CHƠI ── */}
      {isPlaying ? (
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] font-bold text-slate-400">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Thời gian: {safeTurnSeconds}s / lượt</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 pt-1">
          {/* Thông báo đề xuất từ đối thủ nếu có */}
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
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Chọn thời gian / lượt:</span>
                {isOnline && myPendingProposal && (
                  <span className="text-amber-400 font-medium animate-pulse">Chờ duyệt...</span>
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
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm'
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
      )}
    </div>
  )
}
