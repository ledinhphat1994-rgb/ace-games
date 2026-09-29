import { useEffect, useState } from 'react'
import { Swords, Trophy, Skull, Handshake, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeroicBannerType = 'start' | 'win' | 'lose' | 'draw'

export interface GameHeroicBannerProps {
  type: HeroicBannerType | null
  title?: string
  subtitle?: string
  visible: boolean
  onClose?: () => void
  autoDismissMs?: number
  className?: string
}

export function GameHeroicBanner({
  type,
  title,
  subtitle,
  visible,
  onClose,
  autoDismissMs = 2500,
  className,
}: GameHeroicBannerProps) {
  useEffect(() => {
    if (visible && autoDismissMs > 0 && type === 'start') {
      const timer = setTimeout(() => {
        onClose?.()
      }, autoDismissMs)
      return () => clearTimeout(timer)
    }
  }, [visible, autoDismissMs, type, onClose])

  if (!visible || !type) return null

  const config = {
    start: {
      icon: <Swords className="size-8 sm:size-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />,
      defaultTitle: 'TRẬN ĐẤU BẮT ĐẦU!',
      gradient: 'from-amber-500 via-orange-500 to-yellow-400',
      borderGlow: 'border-amber-400/40 shadow-[0_0_40px_rgba(245,158,11,0.35)]',
      bg: 'bg-gradient-to-b from-[#1b1509]/95 via-[#0e1220]/95 to-[#070b14]/95',
      badge: '⚔️ HÀO KHÍ XUẤT QUÂN',
      badgeColor: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    },
    win: {
      icon: <Trophy className="size-8 sm:size-10 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />,
      defaultTitle: 'CHIẾN THẮNG HUY HOÀNG!',
      gradient: 'from-emerald-400 via-teal-300 to-yellow-300',
      borderGlow: 'border-emerald-400/40 shadow-[0_0_45px_rgba(16,185,129,0.35)]',
      bg: 'bg-gradient-to-b from-[#061e16]/95 via-[#0b1622]/95 to-[#070b14]/95',
      badge: '🏆 BẠN ĐÃ THẮNG',
      badgeColor: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
    },
    lose: {
      icon: <Skull className="size-8 sm:size-10 text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]" />,
      defaultTitle: 'QUÂN TA BẠI TRẬN!',
      gradient: 'from-rose-500 via-red-500 to-amber-500',
      borderGlow: 'border-rose-500/40 shadow-[0_0_45px_rgba(244,63,94,0.35)]',
      bg: 'bg-gradient-to-b from-[#20080d]/95 via-[#130b18]/95 to-[#070b14]/95',
      badge: '💀 BẠN ĐÃ THUA',
      badgeColor: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
    },
    draw: {
      icon: <Handshake className="size-8 sm:size-10 text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.8)]" />,
      defaultTitle: 'BẮT TAY HOÀ CỜ!',
      gradient: 'from-yellow-400 via-amber-300 to-orange-400',
      borderGlow: 'border-yellow-400/40 shadow-[0_0_40px_rgba(234,179,8,0.3)]',
      bg: 'bg-gradient-to-b from-[#1c1808]/95 via-[#101424]/95 to-[#070b14]/95',
      badge: '🤝 HOÀ CỜ PHÂN TRANH',
      badgeColor: 'text-yellow-300 border-yellow-400/30 bg-yellow-500/10',
    },
  }[type]

  const displayTitle = title || config.defaultTitle

  return (
    <div
      role="alert"
      aria-live="assertive"
      onClick={() => onClose?.()}
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm cursor-pointer select-none animate-in fade-in zoom-in-95 duration-200',
        className,
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative flex flex-col items-center text-center max-w-sm sm:max-w-md w-full px-6 py-6 sm:py-8 rounded-3xl border backdrop-blur-xl transition-all',
          config.bg,
          config.borderGlow,
        )}
      >
        {/* Nút đóng nhanh */}
        {onClose && (
          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Đóng thông báo"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Badge thể loại */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase border mb-3.5 shadow-sm',
            config.badgeColor,
          )}
        >
          {config.badge}
        </span>

        {/* Biểu tượng hoành tráng */}
        <div className="relative mb-3 flex items-center justify-center size-16 sm:size-20 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner">
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 pointer-events-none" />
          {config.icon}
        </div>

        {/* Tiêu đề hào hùng */}
        <h2
          className={cn(
            'text-xl sm:text-2xl font-black uppercase tracking-wider bg-clip-text text-transparent drop-shadow-md leading-tight',
            `bg-gradient-to-r ${config.gradient}`,
          )}
        >
          {displayTitle}
        </h2>

        {/* Phụ đề sống động */}
        {subtitle && (
          <p className="mt-2 text-xs sm:text-sm font-medium text-slate-300 max-w-xs leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Gợi ý đóng */}
        <span className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {type === 'start' ? 'Tự đóng sau giây lát • Nhấn để đóng' : 'Nhấn bất kỳ đâu để xem lại thế cờ'}
        </span>
      </div>
    </div>
  )
}
