import React from 'react'
import { Bot, UserPlus, Sparkles, Flame, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'

import { type EloRankTier, getEloRankTier } from './elo-rank'
export { type EloRankTier, getEloRankTier }

export interface EloRankAvatarFrameProps {
  ten: string
  avatar?: string | null
  elo?: number
  isBot?: boolean
  hasPlayer?: boolean
  isTurn?: boolean
  turnSide?: 'red' | 'black' | 'white'
  /** Lớp kích thước, mặc định `size-11 sm:size-12` (44px-48px) */
  sizeClassName?: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  title?: string
  ariaLabel?: string
}

export const EloRankAvatarFrame = React.memo(function EloRankAvatarFrame({
  ten,
  avatar,
  elo = 1000,
  isBot = false,
  hasPlayer = true,
  isTurn = false,
  turnSide = 'red',
  sizeClassName = 'size-11 sm:size-12',
  className,
  onClick,
  title,
  ariaLabel,
}: EloRankAvatarFrameProps) {
  const rank = getEloRankTier(elo, isBot)

  // Trạng thái chưa có người chơi (Chờ đối thủ)
  if (!hasPlayer) {
    return (
      <div
        role={onClick ? 'button' : undefined}
        onClick={onClick}
        className={cn(
          'relative rounded-full border-2 border-dashed border-white/20 bg-white/5 text-stone-400 flex items-center justify-center shrink-0 cursor-pointer hover:border-amber-400/60 hover:text-amber-300 transition-colors duration-150 select-none shadow-md',
          sizeClassName,
          className
        )}
        title={title || 'Mời người chơi'}
        aria-label={ariaLabel || 'Mời người chơi'}
      >
        <UserPlus className="size-5 text-stone-400" />
      </div>
    )
  }

  // Khung viền đẳng cấp cho người chơi thật hoặc Bot
  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative rounded-full shrink-0 flex items-center justify-center select-none cursor-pointer group transition-transform duration-150',
        sizeClassName,
        className
      )}
      title={title || `${ten} · Elo ${elo} (${rank.title})`}
      aria-label={ariaLabel || `${ten} · Elo ${elo}`}
    >
      {/* 1. HIỆU ỨNG TỚI LƯỢT ĐI (PULSE TURN RADAR GLOW) */}
      {isTurn && (
        <span
          className={cn(
            'absolute -inset-1 rounded-full animate-ping opacity-75 pointer-events-none',
            turnSide === 'red' ? 'bg-red-500/40' : 'bg-sky-400/40'
          )}
        />
      )}

      {/* 2. LỚP KHUNG VIỀN CẤP BẬC ELO ĐA TẦNG CỰC NGẦU */}
      {rank.tier === 7 ? (
        // Bậc 7: Thần Thoại - Hào quang cầu vồng chuyển động animated gradient shimmer
        <div
          className={cn(
            'absolute -inset-[2.5px] rounded-full p-[2.5px] bg-gradient-to-tr from-amber-300 via-rose-500 to-cyan-400 animate-hero-title-shimmer pointer-events-none ring-2 ring-white/90',
            rank.shadowClass
          )}
        >
          {/* Vương miện Thần Thoại tí hon trên đỉnh avatar */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.9)] z-20">
            <Crown className="size-2.5 fill-amber-300 text-amber-950" />
          </div>
        </div>
      ) : rank.tier === 6 ? (
        // Bậc 6: Đại Kiện Tướng - Viền Hỏa Long Ruby rực lửa ánh đỏ vàng nhấp nháy
        <div
          className={cn(
            'absolute -inset-[2px] rounded-full border-2 border-rose-500 ring-2 ring-amber-400/80 pointer-events-none animate-pulse',
            rank.shadowClass
          )}
        >
          {/* Ngọn lửa Ruby góc đỉnh */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-rose-600 text-amber-200 p-0.5 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.9)] z-20">
            <Flame className="size-2.5 fill-amber-300 text-rose-500" />
          </div>
        </div>
      ) : rank.tier === 5 ? (
        // Bậc 5: Kiện Tướng - Kim Cương Tím Sapphire lấp lánh ma thuật
        <div
          className={cn(
            'absolute -inset-[2px] rounded-full border-2 border-indigo-400 ring-2 ring-violet-400/70 pointer-events-none',
            rank.shadowClass
          )}
        >
          {/* Điểm nhấn ngọc tím ma thuật */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-violet-600 text-indigo-100 p-0.5 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.9)] z-20">
            <Sparkles className="size-2.5 text-violet-200" />
          </div>
        </div>
      ) : rank.tier === 4 ? (
        // Bậc 4: Cao Thủ - Viền Bạch Kim Ngọc Lục / Cyan Neon phát sáng
        <div
          className={cn(
            'absolute -inset-[1.5px] rounded-full border-2 border-cyan-400 ring-2 ring-cyan-300/60 pointer-events-none',
            rank.shadowClass
          )}
        />
      ) : rank.tier === 3 ? (
        // Bậc 3: Tinh Anh - Hoàng Kim Vương Giả
        <div
          className={cn(
            'absolute -inset-[1.5px] rounded-full border-2 border-amber-400 ring-2 ring-yellow-300/50 pointer-events-none',
            rank.shadowClass
          )}
        />
      ) : rank.tier === 2 ? (
        // Bậc 2: Chiến Binh - Bạc Sáng Bạch Ngân
        <div
          className={cn(
            'absolute -inset-[1.5px] rounded-full border-2 border-slate-300 ring-2 ring-slate-400/40 pointer-events-none',
            rank.shadowClass
          )}
        />
      ) : (
        // Bậc 1: Tân Thủ - Đồng Cổ Kim Loại
        <div
          className={cn(
            'absolute -inset-[1px] rounded-full border-2 border-amber-700/90 ring-1 ring-amber-600/30 pointer-events-none',
            rank.shadowClass
          )}
        />
      )}

      {/* 3. VIỀN CHỈ BÁO LƯỢT ĐI ĐẶC BIỆT KHI ĐANG ĐẾN LƯỢT */}
      {isTurn && (
        <div
          className={cn(
            'absolute -inset-[2px] rounded-full border-2 z-10 pointer-events-none',
            turnSide === 'red'
              ? 'border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
              : 'border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]'
          )}
        />
      )}

      {/* 4. MẶT AVATAR BÊN TRONG CĂN VỪA KHỚP 100% */}
      <div className="relative size-full rounded-full overflow-hidden bg-[#121620] flex items-center justify-center z-10">
        {isBot ? (
          <div className="size-full flex items-center justify-center bg-sky-950/70 text-sky-400">
            <Bot className="size-3/5" />
          </div>
        ) : (
          <AnhNguoiDung ten={ten} avatar={avatar} className="size-full rounded-full pointer-events-none" />
        )}
      </div>
    </div>
  )
})
