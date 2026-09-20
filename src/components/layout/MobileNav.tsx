import { NavLink } from 'react-router'
import { BookOpen, Gamepad2, Home, User, Users } from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: typeof Home
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Trang chủ', icon: Home, exact: true },
  { to: '/learn', label: 'Học tập', icon: BookOpen },
  { to: '/arena', label: 'Game', icon: Gamepad2 },
  { to: '/community', label: 'Cộng đồng', icon: Users },
  { to: '/me', label: 'Cá nhân', icon: User },
]

export function MobileNav() {
  return (
    <nav
      aria-label="Điều hướng chính di động"
      className={[
        'fixed bottom-0 inset-x-0 z-40 md:hidden',
        'border-t border-border-subtle glass',
        'pb-[env(safe-area-inset-bottom)]',
      ].join(' ')}
    >
      <div className="flex h-[60px] items-end justify-around px-1 pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                [
                  'flex flex-1 flex-col items-center justify-end min-h-[52px] pb-1 gap-0.5',
                  'text-[10px] font-medium transition-all duration-150',
                  'active:scale-95 select-none',
                  isActive
                    ? 'text-brand font-semibold'
                    : 'text-text-tertiary hover:text-text-secondary',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={[
                      'flex h-8 w-10 items-center justify-center rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-brand/15 text-brand scale-105'
                        : 'text-text-tertiary',
                    ].join(' ')}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="leading-none tracking-tight">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
