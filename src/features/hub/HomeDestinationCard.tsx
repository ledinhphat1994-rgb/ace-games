import { type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

export interface HomeDestinationItem {
  id: string
  title: string
  subtitle: string
  tags: string[]
  artwork: string
  href: string
  icon: ReactNode
  accentColor: 'blue' | 'green' | 'purple'
}

export function HomeDestinationCard({
  item,
  onClick,
}: {
  item: HomeDestinationItem
  onClick: () => void
}) {
  const accentStyles = {
    blue: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      glow: 'group-hover:shadow-cyan-500/10',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
      tagBg: 'bg-cyan-950/40 text-cyan-300/80 border-cyan-500/20',
      arrowBg: 'group-hover:bg-cyan-500 group-hover:text-slate-950',
    },
    green: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      glow: 'group-hover:shadow-emerald-500/10',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
      tagBg: 'bg-emerald-950/40 text-emerald-300/80 border-emerald-500/20',
      arrowBg: 'group-hover:bg-emerald-500 group-hover:text-slate-950',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/50',
      glow: 'group-hover:shadow-purple-500/10',
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
      tagBg: 'bg-purple-950/40 text-purple-300/80 border-purple-500/20',
      arrowBg: 'group-hover:bg-purple-500 group-hover:text-slate-950',
    },
  }[item.accentColor]

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
      className={`group relative overflow-hidden rounded-2xl border ${accentStyles.border} bg-[#0b101d] p-4 cursor-pointer shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${accentStyles.glow} flex flex-col justify-between min-h-[140px]`}
    >
      {/* Background artwork on the right */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1/2 bg-cover bg-right bg-no-repeat opacity-60 group-hover:opacity-85 transition-opacity duration-300 pointer-events-none"
        style={{ backgroundImage: `url(${item.artwork})` }}
      />
      {/* Dark gradient fade from left over the art */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b101d] via-[#0b101d]/90 to-transparent pointer-events-none" />

      {/* Card Header: Icon + Title + Arrow */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${accentStyles.iconBg} shadow-inner transition-transform duration-300 group-hover:scale-105`}
          >
            {item.icon}
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {item.subtitle}
            </p>
          </div>
        </div>

        {/* Circular Arrow Button */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all duration-300 ${accentStyles.arrowBg}`}
        >
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>

      {/* Card Footer: Sub-tags pills */}
      <div className="relative z-10 flex flex-wrap items-center gap-1.5 pt-3">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${accentStyles.tagBg}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
