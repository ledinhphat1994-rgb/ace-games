// Digital Campus v2: Canonical Navigation Architecture & Configuration
// src/components/layout/navigation-config.ts

import type { LucideIcon } from 'lucide-react'
import { Home, BookOpen, Gamepad2, Users, Trophy } from 'lucide-react'

export interface DesktopNavLink {
  to: string
  label: string
  exact?: boolean
}

export interface MobileNavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
  exact?: boolean
}

export interface SidebarNavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
  exact?: boolean
}

/**
 * Canonical Navigation Destinations (Approved Reference Design)
 * 1. Trang chủ (Home)
 * 2. Học tập (Learn)
 * 3. Game (Arena)
 * 4. Cộng đồng (Community)
 * 5. Bảng xếp hạng (Rankings)
 */
export const MAIN_NAV_ITEMS: SidebarNavItem[] = [
  { to: '/', label: 'Trang chủ', shortLabel: 'Trang chủ', icon: Home, exact: true },
  { to: '/learn', label: 'Học tập', shortLabel: 'Học tập', icon: BookOpen },
  { to: '/arena', label: 'Game', shortLabel: 'Game', icon: Gamepad2 },
  { to: '/community', label: 'Cộng đồng', shortLabel: 'Cộng đồng', icon: Users },
  { to: '/rankings', label: 'Bảng xếp hạng', shortLabel: 'Xếp hạng', icon: Trophy },
]

export const SIDEBAR_PRIMARY_NAV: SidebarNavItem[] = [
  { to: '/', label: 'Trang chủ', icon: Home, exact: true },
  { to: '/learn', label: 'Học tập', icon: BookOpen },
  { to: '/arena', label: 'Game', icon: Gamepad2 },
  { to: '/community', label: 'Cộng đồng', icon: Users },
]

export const SIDEBAR_SECONDARY_NAV: SidebarNavItem[] = [
  { to: '/rankings', label: 'Bảng xếp hạng', icon: Trophy },
]

/**
 * Backward compatibility alias for legacy tests
 */
export const DESKTOP_NAV_LINKS: DesktopNavLink[] = [
  { to: '/learn', label: 'Học tập' },
  { to: '/arena', label: 'Game' },
  { to: '/community', label: 'Cộng đồng' },
]

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { to: '/', label: 'Trang chủ', icon: Home, exact: true },
  { to: '/learn', label: 'Học tập', icon: BookOpen },
  { to: '/arena', label: 'Game', icon: Gamepad2 },
  { to: '/community', label: 'Cộng đồng', icon: Users },
]

export const NAV_ITEMS = MOBILE_NAV_ITEMS
