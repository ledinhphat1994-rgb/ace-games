import type { GameType, PlayerSide } from '@shared/protocol/game'
import { cn } from '@/lib/utils'

// Quân cờ vẽ bằng SVG, cùng bảng màu với ảnh bìa (GameArt) và bàn chơi — sắc nét ở mọi kích thước ô.
// Caro: X xanh / O hồng · Cờ Vua: ♔ Trắng / ♚ Đen · Cờ Tướng: 帥 Đỏ / 將 Đen.

interface QuanCoProps {
  gameType: GameType
  side: PlayerSide
  className?: string
}

export function QuanCo({ gameType, side, className }: QuanCoProps) {
  if (gameType === 'chess') {
    return (
      <span
        aria-hidden
        className={cn(
          'flex aspect-square items-center justify-center font-bold text-base select-none',
          side === 'X' ? 'text-amber-100 drop-shadow' : 'text-slate-900 drop-shadow',
          className,
        )}
      >
        {side === 'X' ? '♔' : '♚'}
      </span>
    )
  }

  if (gameType === 'xiangqi') {
    return (
      <span
        aria-hidden
        className={cn(
          'flex aspect-square items-center justify-center rounded-full border border-amber-900/60 bg-amber-100 font-serif font-black text-xs shadow-sm select-none',
          side === 'X' ? 'text-red-700 border-red-700/50' : 'text-slate-950 border-slate-900/50',
          className,
        )}
      >
        {side === 'X' ? '帥' : '將'}
      </span>
    )
  }

  // Caro 15×15
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('block aspect-square', className)}>
      {side === 'X' ? (
        <path d="M6 6L18 18M18 6L6 18" stroke="#22d3ee" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      ) : (
        <circle cx="12" cy="12" r="6.6" stroke="#e879f9" strokeWidth="3.2" fill="none" />
      )}
    </svg>
  )
}
