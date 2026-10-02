// Digital Campus v2: Canonical Left Navigation Sidebar (Approved Reference Design)
// src/components/layout/AppSidebar.tsx

import { NavLink } from 'react-router'
import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MAIN_NAV_ITEMS } from './navigation-config'

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  return (
    <aside
      aria-label="Thanh điều hướng chính"
      className={cn(
        'hidden lg:flex fixed left-0 top-0 w-[240px] xl:w-[256px] flex-col border-r border-border-subtle bg-surface h-screen z-40 select-none py-5 px-3.5 overflow-y-auto',
        className,
      )}
    >
      {/* ── Brand Logo (Vùng 1: Thiết kế mới hiện đại, không còn chữ 10A7) ── */}
      <NavLink
        to="/"
        className="flex items-center gap-3 px-2 py-2 mb-6 group rounded-2xl hover:bg-surface-overlay/80 transition-all duration-200"
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 via-indigo-500/15 to-purple-500/20 border border-sky-400/40 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:scale-105 group-hover:border-sky-400/70 transition-all duration-300">
          <GraduationCap className="h-5 w-5 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
          </span>
        </div>
        <div className="min-w-0">
          <span className="block text-base font-extrabold tracking-tight text-text-primary leading-tight">
            Digital Campus
          </span>
          <span className="block text-[11px] font-semibold text-sky-400/90 truncate mt-0.5 tracking-wide">
            GDTX Định Quán · 2026-2027
          </span>
        </div>
      </NavLink>

      {/* ── Primary Navigation List (5 Destinations) ── */}
      <nav aria-label="Khu vực hoạt động" className="space-y-1.5">
        {MAIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand',
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
                      'h-5 w-5 shrink-0 transition-transform group-hover:scale-110',
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
}
