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
      {/* ── Brand Logo ── */}
      <NavLink
        to="/"
        className="flex items-center gap-3 px-2 py-1.5 mb-6 group rounded-2xl hover:bg-surface-overlay/60 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 border border-brand/30 text-brand shadow-[0_0_16px_rgba(56,189,248,0.2)] group-hover:scale-105 group-hover:bg-brand/25 transition-all duration-200">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="block text-base font-bold tracking-tight text-text-primary leading-tight">
            Digital Campus
          </span>
          <span className="block text-[11px] font-medium text-text-tertiary truncate mt-0.5">
            Lớp 10A7 · 2026-2027
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
