import { cn } from '@/lib/utils'
import { Zap, Crown, Award, CloudRain, Sparkles, Flame } from 'lucide-react'

export interface GameAncientSealProps {
  isPlayerTurn: boolean
  turnLabel: string
  mode: 'ai' | 'pass_and_play'
  isAiThinking?: boolean
  isCheck?: boolean
  isGameOver?: boolean
  isWinner?: boolean | null
  winnerTitle?: string
  endReason?: string | null
  theme?: 'oriental' | 'royal'
  className?: string
}

export function GameAncientSeal({
  isPlayerTurn,
  turnLabel,
  mode,
  isAiThinking = false,
  isCheck = false,
  isGameOver = false,
  isWinner = null,
  winnerTitle,
  endReason: _endReason = null,
  theme: _theme = 'oriental',
  className,
}: GameAncientSealProps) {
  // Trạng thái kết thúc ván: Thiết kế gaming đẳng cấp, cực ngầu, ít chữ, chuẩn esports
  if (isGameOver) {
    const isWin = isWinner === true
    const isLoss = isWinner === false

    const displayText = isWin
      ? 'BẠN THẮNG'
      : isLoss
        ? 'BẠN THUA'
        : (winnerTitle ?? 'HOÀ CỜ')

    return (
      <div
        className={cn(
          'relative flex flex-col items-center justify-center p-3 w-full h-[135px] min-h-[135px] max-h-[135px] rounded-2xl select-none transition-all duration-300 overflow-hidden',
          isWin
            ? 'bg-gradient-to-b from-[#78350f] via-[#451a03] to-[#1c0a00] border-2 border-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.7),inset_0_0_25px_rgba(253,224,71,0.35)] ring-2 ring-yellow-400/50'
            : isLoss
              ? 'bg-gradient-to-b from-[#1e2330] via-[#121622] to-[#0a0c14] border-2 border-slate-600/80 shadow-[0_0_24px_rgba(30,41,59,0.7),inset_0_0_15px_rgba(148,163,184,0.08)] ring-1 ring-slate-500/30'
              : 'bg-gradient-to-b from-[#0e1d2f] via-[#08121f] to-[#040910] border-2 border-brand/80 shadow-[0_0_28px_rgba(198,161,90,0.4),inset_0_0_15px_rgba(198,161,90,0.15)] ring-1 ring-brand/30',
          className
        )}
      >
        {/* Hào quang nền radial */}
        <div
          className={cn(
            'absolute inset-0 pointer-events-none opacity-50',
            isWin
              ? 'bg-[radial-gradient(ellipse_at_center,rgba(253,224,71,0.5),transparent_70%)]'
              : isLoss
                ? 'bg-[radial-gradient(ellipse_at_center,rgba(100,116,139,0.2),transparent_70%)]'
                : 'bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.3),transparent_70%)]'
          )}
        />

        {/* 4 góc điểm nhấn kim loại esports */}
        <div className={cn('absolute top-2 left-2 text-[10px] font-mono leading-none', isWin ? 'text-yellow-300/80' : isLoss ? 'text-slate-500/40' : 'text-brand/60')}>◤</div>
        <div className={cn('absolute top-2 right-2 text-[10px] font-mono leading-none', isWin ? 'text-yellow-300/80' : isLoss ? 'text-slate-500/40' : 'text-brand/60')}>◥</div>
        <div className={cn('absolute bottom-2 left-2 text-[10px] font-mono leading-none', isWin ? 'text-yellow-300/80' : isLoss ? 'text-slate-500/40' : 'text-brand/60')}>◣</div>
        <div className={cn('absolute bottom-2 right-2 text-[10px] font-mono leading-none', isWin ? 'text-yellow-300/80' : isLoss ? 'text-slate-500/40' : 'text-brand/60')}>◢</div>

        {/* Khung nội dung trung tâm */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          {/* Biểu tượng uy lực phía trên */}
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            {isWin ? (
              <>
                <Sparkles className="size-4 text-yellow-300 animate-pulse" />
                <Crown className="size-7 text-yellow-300 fill-yellow-400/40 drop-shadow-[0_0_16px_rgba(253,224,71,1)] animate-bounce" />
                <Sparkles className="size-4 text-yellow-300 animate-pulse" />
              </>
            ) : isLoss ? (
              <>
                <span className="text-[10px] text-slate-500">●</span>
                <CloudRain className="size-6 text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.5)] animate-pulse" />
                <span className="text-[10px] text-slate-500">●</span>
              </>
            ) : (
              <>
                <span className="text-[11px] text-brand/80">◆</span>
                <Award className="size-6 text-brand drop-shadow-[0_0_10px_rgba(198,161,90,0.8)]" />
                <span className="text-[11px] text-brand/80">◆</span>
              </>
            )}
          </div>

          {/* Dòng chữ chính: Đúng font chuẩn tiếng Việt, ánh kim loại, phong cách gaming đỉnh cao */}
          <h2
            className={cn(
              'font-sans font-black uppercase leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] px-1 text-center whitespace-nowrap',
              displayText.length > 10 ? 'text-lg sm:text-xl tracking-wider' : 'text-xl sm:text-2xl tracking-widest',
              isWin
                ? 'bg-gradient-to-b from-white via-yellow-100 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(250,204,21,0.95)]'
                : isLoss
                  ? 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                  : 'bg-gradient-to-b from-brand via-brand to-brand bg-clip-text text-transparent'
            )}
          >
            {displayText}
          </h2>

          {/* Tia sáng laser mảnh dưới chữ */}
          <div
            className={cn(
              'w-28 sm:w-32 h-[2px] mt-2 rounded-full',
              isWin
                ? 'bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_14px_rgba(250,204,21,1)]'
                : isLoss
                  ? 'bg-gradient-to-r from-transparent via-slate-500/70 to-transparent shadow-[0_0_6px_rgba(148,163,184,0.4)]'
                  : 'bg-gradient-to-r from-transparent via-brand to-transparent shadow-[0_0_8px_rgba(198,161,90,0.9)]'
            )}
          />
        </div>
      </div>
    )
  }

  // Đang trong ván: Con dấu đóng mộc lượt đi - Kích thước 2 bên cố định tuyệt đối
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-2.5 sm:p-3 w-full h-[135px] min-h-[135px] max-h-[135px] rounded-2xl select-none transition-colors duration-200',
        isPlayerTurn
          ? 'bg-gradient-to-b from-[#8f1d1d] via-[#6e1414] to-[#450a0a] border-2 border-red-500/90 shadow-[0_0_22px_rgba(220,38,38,0.5)] ring-2 ring-red-400/40'
          : 'bg-gradient-to-b from-[#131b2c] via-[#0d1424] to-[#080d18] border-2 border-slate-600/80 shadow-[0_0_18px_rgba(15,23,42,0.8)] ring-2 ring-slate-500/30',
        isCheck && 'animate-pulse ring-4 ring-rose-500 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.7)]',
        className
      )}
    >
      {/* Góc triện cổ kính */}
      <div className="absolute top-1.5 left-1.5 text-[9px] opacity-40 font-serif">╔</div>
      <div className="absolute top-1.5 right-1.5 text-[9px] opacity-40 font-serif">╗</div>
      <div className="absolute bottom-1.5 left-1.5 text-[9px] opacity-40 font-serif">╚</div>
      <div className="absolute bottom-1.5 right-1.5 text-[9px] opacity-40 font-serif">╝</div>

      {/* Khung hoa văn nét đứt triện ấn */}
      <div
        className={cn(
          'w-full h-full p-2 rounded-xl border border-dashed flex flex-col items-center justify-center text-center relative overflow-hidden',
          isPlayerTurn
            ? 'border-amber-300/70 bg-red-950/50'
            : 'border-slate-500/60 bg-black/40'
        )}
      >
        {/* Tiêu đề chính: Ghi gọn gàng TỚI LƯỢT BẠN hoặc TỚI LƯỢT ĐỊCH chuẩn font tiếng Việt */}
        <div className="flex flex-col items-center justify-center my-auto min-h-[44px]">
          <span
            className={cn(
              'text-base sm:text-lg font-sans font-black tracking-wider uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center px-1 whitespace-nowrap',
              isPlayerTurn
                ? 'text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]'
                : isAiThinking
                  ? 'text-brand animate-pulse'
                  : 'text-slate-200'
            )}
          >
            {isPlayerTurn
              ? 'TỚI LƯỢT BẠN'
              : (mode === 'ai'
                  ? (isAiThinking ? 'MÁY ĐANG TÍNH…' : 'TỚI LƯỢT ĐỊCH')
                  : `TỚI LƯỢT ${turnLabel.replace(/^Lượt:\s*/i, '').replace(/^Bên\s*/i, '')}`)}
          </span>
        </div>

        {/* Cảnh báo CHIẾU TƯỚNG khẩn cấp */}
        {isCheck && (
          <div className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600/90 border border-rose-300 text-white font-black text-[10px] tracking-wider uppercase animate-bounce shadow-md">
            <Flame className="size-3 text-amber-300 fill-amber-300 animate-spin" />
            <span>CHIẾU TƯỚNG!</span>
          </div>
        )}

        {/* Icon phụ xoay tính toán khi AI đang nghĩ */}
        {!isPlayerTurn && isAiThinking && !isCheck && (
          <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-brand">
            <Zap className="size-3 animate-spin text-brand" />
            <span>Đang suy tính…</span>
          </div>
        )}
      </div>
    </div>
  )
}
