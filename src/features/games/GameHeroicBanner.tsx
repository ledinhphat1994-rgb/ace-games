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
      gradient: 'from-amber-50 via-amber-200 to-amber-500',
    },
    win: {
      defaultTitle: 'BẠN THẮNG',
      gradient: 'from-amber-100 via-yellow-300 to-amber-600',
    },
    lose: {
      defaultTitle: 'BẠN THUA',
      gradient: 'from-rose-100 via-rose-400 to-red-700',
    },
    draw: {
      defaultTitle: 'HOÀ CỜ',
      gradient: 'from-slate-100 via-slate-300 to-slate-400',
    },
    check: {
      defaultTitle: 'CHIẾU TƯỚNG',
      gradient: 'from-orange-100 via-rose-300 to-red-600',
    },
  }[type]

  const displayTitle = title || config.defaultTitle

  return (
    <div
      role="alert"
      aria-live="assertive"
      onClick={() => onClose?.()}
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center p-4 cursor-pointer select-none pointer-events-auto transition-all animate-in fade-in duration-200',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
        <div className="bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.35)_45%,transparent_75%)] px-10 py-6 sm:px-14 sm:py-8 flex items-center justify-center">
          <span
            className={cn(
              // leading + py: chữ tô gradient chỉ hiện trong khung của nó — không chừa chỗ thì dấu (Ắ, Ầ, Ạ…) bị cắt mất.
              'text-5xl sm:text-6xl md:text-7xl leading-[1.4] py-3 px-1 font-black uppercase tracking-widest text-center bg-clip-text text-transparent select-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-pulse',
              `bg-gradient-to-b ${config.gradient}`,
            )}
          >
            {displayTitle}
          </span>
        </div>
      </div>
    </div>
  )
}
