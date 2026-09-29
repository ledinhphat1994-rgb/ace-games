import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export type HeroicBannerType = 'start' | 'win' | 'lose' | 'draw' | 'check'

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
  visible,
  onClose,
  autoDismissMs = 2500,
  className,
}: GameHeroicBannerProps) {
  useEffect(() => {
    if (visible && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, autoDismissMs)
      return () => clearTimeout(timer)
    }
  }, [visible, autoDismissMs, onClose])

  if (!visible || !type) return null

  const config = {
    start: {
      defaultTitle: 'BẮT ĐẦU',
      gradient: 'from-amber-300 via-yellow-200 to-amber-400',
      glow: 'drop-shadow-[0_0_25px_rgba(251,191,36,0.95)] drop-shadow-[0_0_50px_rgba(245,158,11,0.6)]',
    },
    win: {
      defaultTitle: 'BẠN THẮNG',
      gradient: 'from-emerald-300 via-teal-200 to-green-400',
      glow: 'drop-shadow-[0_0_25px_rgba(52,211,153,0.95)] drop-shadow-[0_0_50px_rgba(16,185,129,0.6)]',
    },
    lose: {
      defaultTitle: 'BẠN THUA',
      gradient: 'from-rose-400 via-red-300 to-pink-500',
      glow: 'drop-shadow-[0_0_25px_rgba(244,63,94,0.95)] drop-shadow-[0_0_50px_rgba(225,29,72,0.6)]',
    },
    draw: {
      defaultTitle: 'HOÀ CỜ',
      gradient: 'from-yellow-300 via-amber-200 to-orange-400',
      glow: 'drop-shadow-[0_0_25px_rgba(234,179,8,0.95)] drop-shadow-[0_0_50px_rgba(202,138,4,0.6)]',
    },
    check: {
      defaultTitle: 'CHIẾU TƯỚNG',
      gradient: 'from-red-400 via-rose-300 to-amber-400',
      glow: 'drop-shadow-[0_0_25px_rgba(239,68,68,0.95)] drop-shadow-[0_0_50px_rgba(220,38,38,0.6)]',
    },
  }[type]

  const displayTitle = title || config.defaultTitle

  return (
    <div
      role="alert"
      aria-live="assertive"
      onClick={() => onClose?.()}
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center p-4 cursor-pointer select-none pointer-events-auto bg-black/25 backdrop-blur-[2px] transition-all animate-in fade-in duration-200',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
        <span
          className={cn(
            'text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-widest text-center bg-clip-text text-transparent animate-pulse select-none',
            `bg-gradient-to-r ${config.gradient}`,
            config.glow,
          )}
        >
          {displayTitle}
        </span>
      </div>
    </div>
  )
}
