import type { GameType, PlayerSide } from '@shared/protocol/game'
import { cn } from '@/lib/utils'

// Quân cờ vẽ bằng SVG, cùng bảng màu với ảnh bìa (GameArt) và bàn chơi — sắc nét ở mọi kích thước ô.
// Caro: X xanh / O hồng · Connect 4: X đỏ / O vàng · Reversi: X đen / O trắng.

interface QuanCoProps {
  gameType: GameType
  side: PlayerSide
  className?: string
}

export function QuanCo({ gameType, side, className }: QuanCoProps) {
  if (gameType === 'connect4') {
    return (
      <span
        aria-hidden
        className={cn(
          'block aspect-square rounded-full',
          side === 'X'
            ? 'bg-[radial-gradient(circle_at_35%_30%,#fb7185,#dc2626)] shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]'
            : 'bg-[radial-gradient(circle_at_35%_30%,#fde68a,#eab308)] shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]',
          className,
        )}
      />
    )
  }

  if (gameType === 'reversi') {
    return (
      <span
        aria-hidden
        className={cn(
          'block aspect-square rounded-full',
          side === 'X'
            ? 'bg-[radial-gradient(circle_at_35%_30%,#334155,#020617)] ring-1 ring-slate-600'
            : 'bg-[radial-gradient(circle_at_35%_30%,#ffffff,#cbd5e1)] ring-1 ring-slate-200',
          className,
        )}
      />
    )
  }

  // Caro 15×15 / 9×9
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
