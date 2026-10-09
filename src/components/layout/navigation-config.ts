// Digital Campus v2: Canonical Navigation Architecture & Configuration
// src/components/layout/navigation-config.ts

import type { LucideIcon } from 'lucide-react'
import { Home, BookOpen, Gamepad2, Users, Trophy, ShoppingBag } from 'lucide-react'

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
  hidden?: boolean
}

export interface SidebarNavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
  exact?: boolean
  hidden?: boolean
}

/**
 * Canonical Navigation Destinations (Approved Reference Design)
 * 1. Trang chủ (Home)
 * 2. Học tập (Learn)
 * 3. Game (Arena)
 * 4. Cộng đồng (Community) - Tạm thời ẩn theo yêu cầu người dùng
 * 5. Bảng xếp hạng (Rankings)
 * 6. Cửa hàng vật phẩm (Shop)
 */
export const MAIN_NAV_ITEMS: SidebarNavItem[] = [
  { to: '/', label: 'Trang chủ', shortLabel: 'Trang chủ', icon: Home, exact: true },
  { to: '/arena', label: 'Đấu trường Game', shortLabel: 'Game', icon: Gamepad2 },
  { to: '/leaderboard', label: 'Bảng xếp hạng', shortLabel: 'Xếp hạng', icon: Trophy },
  { to: '/shop', label: 'Cửa hàng vật phẩm', shortLabel: 'Cửa hàng', icon: ShoppingBag },
  { to: '/learn', label: 'Học tập', shortLabel: 'Học tập', icon: BookOpen, hidden: true },
  { to: '/community', label: 'Cộng đồng', shortLabel: 'Cộng đồng', icon: Users, hidden: true },
]

export const SIDEBAR_PRIMARY_NAV: SidebarNavItem[] = [
  { to: '/', label: 'Trang chủ', icon: Home, exact: true },
  { to: '/arena', label: 'Đấu trường Game', icon: Gamepad2 },
  { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
  { to: '/shop', label: 'Cửa hàng vật phẩm', icon: ShoppingBag },
  { to: '/learn', label: 'Học tập', icon: BookOpen, hidden: true },
  { to: '/community', label: 'Cộng đồng', icon: Users, hidden: true },
]

export const SIDEBAR_SECONDARY_NAV: SidebarNavItem[] = [
  { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
  { to: '/shop', label: 'Cửa hàng vật phẩm', icon: ShoppingBag },
]

/**
 * Backward compatibility alias for legacy tests
 */
export const DESKTOP_NAV_LINKS: DesktopNavLink[] = [
  { to: '/arena', label: 'Game' },
  { to: '/leaderboard', label: 'Xếp hạng' },
  { to: '/shop', label: 'Cửa hàng' },
  { to: '/learn', label: 'Học tập' },
  { to: '/community', label: 'Cộng đồng' },
]

export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { to: '/', label: 'Trang chủ', shortLabel: 'Trang chủ', icon: Home, exact: true },
  { to: '/arena', label: 'Game', shortLabel: 'Game', icon: Gamepad2 },
  { to: '/leaderboard', label: 'Xếp hạng', shortLabel: 'Xếp hạng', icon: Trophy },
  { to: '/shop', label: 'Cửa hàng', shortLabel: 'Cửa hàng', icon: ShoppingBag },
  { to: '/learn', label: 'Học tập', shortLabel: 'Học tập', icon: BookOpen, hidden: true },
  { to: '/community', label: 'Cộng đồng', shortLabel: 'Cộng đồng', icon: Users, hidden: true },
]

export const NAV_ITEMS = MOBILE_NAV_ITEMS
