import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

export interface CampusHeroBannerAction {
  label: string
  onClick: () => void
  icon?: ReactNode
}

export interface CampusHeroBannerProps {
  image?: string
  badgeText?: string
  badgeIcon?: ReactNode
  title: string
  subtitle?: string
  motto?: string
  primaryAction: CampusHeroBannerAction
  secondaryAction?: CampusHeroBannerAction
  slogan?: string
  className?: string
}

export function CampusHeroBanner({
  image = '/assets/campus/hero_illustration.webp',
  badgeText,
  badgeIcon = <Sparkles className="h-3.5 w-3.5 text-cyan-400" />,
  title,
  subtitle,
  motto,
  primaryAction,
  secondaryAction,
  slogan = 'Cùng nhau tạo nên phiên bản tốt hơn mỗi ngày',
  className = '',
}: CampusHeroBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#080d19] shadow-2xl transition-all duration-300 ${className}`}
      data-testid="campus-hero-banner"
    >
      {/* Background artwork layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-right bg-no-repeat opacity-90 sm:opacity-100"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: 'right 20% center',
        }}
      />

      {/* Cinematic directional dark gradient mask for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#080d19] via-[#080d19]/80 to-transparent sm:bg-gradient-to-r sm:from-[#080d19] sm:via-[#080d19]/90 sm:via-50% sm:to-transparent pointer-events-none" />

      {/* Ambient glowing highlights */}
      <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl z-[1]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl z-[1]" />

      {/* Main Content Box */}
      <div className="relative z-10 flex flex-col justify-between min-h-[240px] sm:min-h-[260px] lg:min-h-[280px] p-5 sm:p-7 lg:p-8">
        <div className="max-w-xl space-y-2.5">
          {/* Badge */}
          {badgeText && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-md">
              {badgeIcon}
              <span>{badgeText}</span>
            </div>
          )}

          {/* Headline Greeting */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-sm leading-tight">
            {title}
          </h1>

          {/* Student Motto / Supporting text */}
          {motto && (
            <p className="text-sm sm:text-base font-medium text-cyan-200/90 italic drop-shadow">
              &ldquo;{motto}&rdquo;
            </p>
          )}

          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-2 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Bottom Actions & Slogan Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 mt-2">
          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={primaryAction.onClick}
              className="h-11 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </Button>

            {secondaryAction && (
              <Button
                variant="outline"
                size="lg"
                onClick={secondaryAction.onClick}
                className="h-11 px-5 rounded-xl border-white/20 bg-slate-900/60 hover:bg-slate-800/80 text-white font-bold backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </Button>
            )}
          </div>

          {/* Right Slogan & Carousel controls (contract for future Admin promotion carousel) */}
          <div className="hidden md:flex flex-col items-end gap-1.5 text-right select-none">
            {slogan && (
              <p className="text-xs lg:text-sm text-cyan-100/80 font-medium italic tracking-wide max-w-xs drop-shadow">
                {slogan}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1 opacity-75 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-5 rounded-full bg-cyan-400" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  aria-label="Previous slide"
                  className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white border border-white/10 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/70 hover:text-white border border-white/10 transition-colors"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
