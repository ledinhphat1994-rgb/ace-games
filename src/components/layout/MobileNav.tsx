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
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border/80 bg-[#0a0f18]/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center min-h-[44px] py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary/15 text-primary scale-105'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="mt-0.5 leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
