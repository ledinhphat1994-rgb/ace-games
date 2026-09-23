import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'

export interface CampusHeroBannerAction {
  label: string
  onClick: () => void
  icon?: ReactNode
}

import { CAMPUS_HERO_BANNER_CONTRACT } from './campus-hero-contract'
export { CAMPUS_HERO_BANNER_CONTRACT }

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
  badgeIcon = <Sparkles className="h-3 w-3 text-cyan-400" />,
  title,
  subtitle,
  motto,
  primaryAction,
  secondaryAction,
  slogan,
  className = '',
}: CampusHeroBannerProps) {
  // Prefer subtitle, fallback to motto, kept concise
  const supportingText = subtitle || motto

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#080d19] shadow-2xl transition-all ${className}`}
      data-testid="campus-hero-banner"
    >
      {/* Background artwork layer */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-right bg-no-repeat opacity-40 sm:opacity-85 pointer-events-none"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: 'right 15% center',
        }}
      />

      {/* Directional gradient mask to ensure text punch & legibility */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#080d19] via-[#080d19]/80 to-transparent sm:bg-gradient-to-r sm:from-[#080d19] sm:via-[#080d19]/85 sm:to-transparent pointer-events-none" />


      {/* Hero Content */}
      <div className="relative z-10 flex flex-col justify-between min-h-[145px] sm:min-h-[200px] p-4 sm:p-7 lg:p-8">
        <div className="max-w-xl space-y-1.5 sm:space-y-2">
          {/* Subtle minimal badge if provided */}
          {badgeText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold tracking-wide backdrop-blur-md">
              {badgeIcon}
              <span>{badgeText}</span>
            </div>
          )}

          {/* Strong, energetic headline */}
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-md leading-tight">
            {title}
          </h1>

          {/* Single concise supporting line */}
          {supportingText && (
            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-lg line-clamp-1">
              {supportingText}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 sm:pt-4 mt-0.5 sm:mt-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Button
              size="default"
              onClick={primaryAction.onClick}
              className="h-8 sm:h-10 px-3.5 sm:px-5 rounded-lg sm:rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] gap-1.5 text-xs sm:text-sm"
            >
              {primaryAction.icon || <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span>{primaryAction.label}</span>
            </Button>

            {secondaryAction && (
              <Button
                variant="outline"
                size="default"
                onClick={secondaryAction.onClick}
                className="h-8 sm:h-10 px-3 sm:px-4 rounded-lg sm:rounded-xl border-white/20 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] gap-1.5 text-xs sm:text-sm"
              >
                {secondaryAction.icon}
                <span>{secondaryAction.label}</span>
              </Button>
            )}
          </div>

          {slogan && (
            <div className="hidden lg:block text-right select-none" data-testid="hero-slogan">
              <span className="text-xs text-slate-400/80 font-medium italic">
                {slogan}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
