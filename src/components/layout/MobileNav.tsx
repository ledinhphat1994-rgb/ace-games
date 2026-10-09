import { memo } from 'react'
import { NavLink } from 'react-router'
import { MOBILE_NAV_ITEMS, NAV_ITEMS, type MobileNavItem } from './navigation-config'

export { MOBILE_NAV_ITEMS, NAV_ITEMS }
export type { MobileNavItem }

export const MobileNav = memo(function MobileNav() {
  return (
    <nav
      aria-label="Điều hướng chính di động"
      className={[
        'fixed bottom-0 inset-x-0 z-40 lg:hidden',
        'border-t border-border-subtle bg-surface/95',
        'pb-[env(safe-area-inset-bottom)]',
      ].join(' ')}
    >
      <div className="flex h-[60px] landscape:h-[44px] items-end landscape:items-center justify-around px-1 pb-1 landscape:pb-0">
        {NAV_ITEMS.filter((item) => !item.hidden).map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                [
                  'flex flex-1 flex-col landscape:flex-row items-center justify-end landscape:justify-center min-h-[52px] landscape:min-h-[40px] pb-1 landscape:pb-0 gap-0.5 landscape:gap-1.5',
                  'text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand',
                  'active:scale-95 select-none',
                  isActive
                    ? 'text-brand font-semibold'
                    : 'text-text-secondary hover:text-text-primary',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={[
                      'flex h-8 w-10 landscape:h-6.5 landscape:w-7 items-center justify-center rounded-xl transition-[background-color,color,transform] duration-150',
                      isActive
                        ? 'bg-brand/15 text-brand scale-105'
                        : 'text-text-tertiary',
                    ].join(' ')}
                  >
                    <Icon className="h-[18px] w-[18px] landscape:h-3.5 landscape:w-3.5" />
                  </div>
                  <span className="text-[11px] landscape:text-[10px] leading-tight tracking-tight truncate max-w-full px-0.5">
                    {item.shortLabel || item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
})
