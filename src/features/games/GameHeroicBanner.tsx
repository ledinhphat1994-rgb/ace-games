import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export type HeroicBannerType = 'start' | 'win' | 'lose' | 'draw' | 'check' | 'notice'

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
  autoDismissMs = 1800,
  className,
}: GameHeroicBannerProps) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (visible && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        onCloseRef.current?.()
      }, autoDismissMs)
      return () => clearTimeout(timer)
    }
  }, [visible, autoDismissMs])

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
    notice: {
      defaultTitle: 'THÔNG BÁO',
      gradient: 'from-amber-100 via-yellow-300 to-amber-500',
    },
  }[type]

  const displayTitle = title || config.defaultTitle
  const isLongTitle = displayTitle.length > 10

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center p-4 select-none pointer-events-none transition-all animate-in fade-in duration-200',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
        <div className="bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.45)_50%,transparent_80%)] px-8 py-5 sm:px-12 sm:py-7 flex flex-col items-center justify-center max-w-[90vw] sm:max-w-[480px]">
          <span
            className={cn(
              // leading + py: chữ tô gradient chỉ hiện trong khung của nó — không chừa chỗ thì dấu (Ắ, Ầ, Ạ…) bị cắt mất.
              'leading-[1.4] py-3 px-1 font-black uppercase tracking-wider text-center bg-clip-text text-transparent select-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-pulse',
              isLongTitle
                ? 'text-2xl sm:text-3xl md:text-4xl'
                : 'text-5xl sm:text-6xl md:text-7xl',
              `bg-gradient-to-b ${config.gradient}`,
            )}
          >
            {displayTitle}
          </span>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base font-semibold text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] tracking-wide text-center">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
