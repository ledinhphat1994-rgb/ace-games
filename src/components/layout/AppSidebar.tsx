import { memo } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { MAIN_NAV_ITEMS } from './navigation-config'

interface AppSidebarProps {
  className?: string
}

export const AppSidebar = memo(function AppSidebar({ className }: AppSidebarProps) {
  return (
    <aside
      aria-label="Thanh điều hướng chính"
      className={cn(
        'hidden lg:flex fixed left-0 top-16 bottom-0 w-[240px] xl:w-[256px] flex-col border-r border-border-subtle bg-surface/95 backdrop-blur-md z-30 select-none py-3 px-3.5 overflow-y-auto',
        className,
      )}
    >
      {/* ── Primary Navigation List (5 Destinations) ── */}
      <nav aria-label="Khu vực hoạt động" className="space-y-1.5 pt-1 relative z-10">
        {MAIN_NAV_ITEMS.filter((item) => !item.hidden).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  isActive
                    ? 'bg-brand/15 text-brand border border-brand/30 shadow-[0_0_16px_rgba(56,189,248,0.18)]'
                    : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary border border-transparent',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform duration-150 group-hover:scale-110',
                      isActive ? 'text-brand' : 'text-text-tertiary group-hover:text-text-secondary',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Clean whitespace spacer ── */}
      <div className="flex-1" />
    </aside>
  )
})
