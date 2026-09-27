// Digital Campus v2: Canonical Navigation Architecture & Configuration
// src/components/layout/navigation-config.ts

import type { LucideIcon } from 'lucide-react'
import { BookOpen, Gamepad2 } from 'lucide-react'

export interface DesktopNavLink {
  to: string
  label: string
  exact?: boolean
}

export interface MobileNavItem {
  to: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

/**
 * Canonical Desktop Primary Navigation
 * Strictly 3 destinations: Học tập, Game, Cộng đồng.
 */
export const DESKTOP_NAV_LINKS: DesktopNavLink[] = [
  { to: '/learn', label: 'Học tập' },
  { to: '/arena', label: 'Game' },
]

/**
 * Canonical Mobile Bottom Navigation
 * 2 destinations: Học tập, Game.
 */
export const MOBILE_NAV_ITEMS: MobileNavItem[] = [
  { to: '/learn', label: 'Học tập', icon: BookOpen },
  { to: '/arena', label: 'Game', icon: Gamepad2 },
]

export const NAV_ITEMS = MOBILE_NAV_ITEMS
