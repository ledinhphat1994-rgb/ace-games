import { type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import type { HomeDestinationConfig } from './home-destinations'

export { type HomeDestinationConfig, HOME_DESTINATIONS } from './home-destinations'

export interface HomeDestinationItem extends HomeDestinationConfig {
  icon: ReactNode
  accentColor?: string
}

export function HomeDestinationCard({
  item,
  onClick,
}: {
  item: HomeDestinationItem
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border-default bg-[#0b101d] p-2.5 sm:p-4 cursor-pointer shadow-md sm:shadow-lg transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between min-h-[76px] sm:min-h-[116px]"
    >
      {/* Background artwork */}
      <div
        className="absolute right-0 top-0 bottom-0 w-3/5 bg-cover bg-right bg-no-repeat opacity-40 group-hover:opacity-75 transition-all duration-300 group-hover:scale-105 pointer-events-none"
        style={{ backgroundImage: `url(${item.artwork})` }}
      />
      {/* Smooth directional fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b101d] via-[#0b101d]/90 to-transparent pointer-events-none" />

      {/* Top Header: Icon + Arrow */}
      <div className="relative z-10 flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-border-default bg-surface-overlay text-brand group-hover:bg-cyan-500/15 group-hover:border-cyan-500/30 shadow-inner transition-all duration-300 group-hover:scale-105">
          {item.icon}
        </div>

        <div className="flex items-center gap-1.5">
          {item.badge && (
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] sm:text-xs font-bold tracking-wide uppercase bg-emerald-500/20 text-success border border-emerald-500/30">
              {item.badge}
            </span>
          )}
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-border-default bg-surface-overlay text-text-secondary group-hover:text-text-primary group-hover:bg-surface-overlay transition-all">
            <ArrowUpRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>

      {/* Bottom Title (Label-first, no explanatory subtitles) */}
      <div className="relative z-10 pt-1 sm:pt-2">
        <h3 className="text-sm sm:text-base font-black text-text-primary group-hover:text-brand transition-colors tracking-tight">
          {item.title}
        </h3>
        {item.subtitle && (
          <p className="text-[11px] sm:text-xs text-text-secondary font-medium line-clamp-1 mt-0.5">
            {item.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
