// test/ui-10-release-qa-quality.test.ts
// Digital Campus v2: Milestone UI-10 — Responsive + Theme + Final Polish / Release QA Invariants Suite

import { describe, expect, it } from 'vitest'

import appHeaderCode from '../src/components/layout/AppHeader.tsx?raw'
import appSidebarCode from '../src/components/layout/AppSidebar.tsx?raw'
import appShellCode from '../src/components/layout/AppShell.tsx?raw'
import campusSearchCode from '../src/components/layout/CampusSearch.tsx?raw'
import campusHeroCode from '../src/components/layout/CampusHero.tsx?raw'
import navigationConfigCode from '../src/components/layout/navigation-config.ts?raw'
import mobileNavCode from '../src/components/layout/MobileNav.tsx?raw'
import themeProviderCode from '../src/app/theme.tsx?raw'
import { env } from 'cloudflare:test'
const indexCssCode = (env as any).INDEX_CSS as string
import buttonCode from '../src/components/ui/button.tsx?raw'
import dialogCode from '../src/components/ui/dialog.tsx?raw'
import sheetCode from '../src/components/ui/sheet.tsx?raw'
import chatSheetCode from '../src/components/layout/CampusChatSheet.tsx?raw'
import profileDialogCode from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import communityPageCode from '../src/features/hub/CommunityPage.tsx?raw'
import leaderboardPageCode from '../src/features/hub/LeaderboardPage.tsx?raw'
import homePageCode from '../src/features/hub/HomePage.tsx?raw'
import learningPageCode from '../src/features/hub/LearningPage.tsx?raw'
import docStageCode from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import mainCode from '../src/main.tsx?raw'

describe('UI-10 Cross-Product Quality & Release QA Invariants', () => {
  // ── 1. Canonical Ownership & Primary Navigation ───────────────────────────
  describe('1. Canonical Information Architecture & Navigation', () => {
    it('defines exactly the 5 approved canonical destinations in MAIN_NAV_ITEMS', () => {
      expect(navigationConfigCode).toContain("to: '/'")
      expect(navigationConfigCode).toContain("to: '/learn'")
      expect(navigationConfigCode).toContain("to: '/arena'")
      expect(navigationConfigCode).toContain("to: '/community'")
      expect(navigationConfigCode).toContain("to: '/leaderboard'")
    })

    it('prohibits Chat, Friends, or Profile from primary navigation config', () => {
      expect(navigationConfigCode).not.toContain("to: '/chat'")
      expect(navigationConfigCode).not.toContain("to: '/friends'")
      expect(navigationConfigCode).not.toContain("label: 'Tin nhắn'")
      expect(navigationConfigCode).not.toContain("label: 'Hồ sơ'")
    })

    it('preserves canonical routing redirects for legacy routes in main.tsx', () => {
      expect(mainCode).toContain("{ path: 'learning', element: <Navigate to=\"/learn\" replace /> }")
      expect(mainCode).toContain("{ path: 'rankings', element: <Navigate to=\"/leaderboard\" replace /> }")
      expect(mainCode).toContain("{ path: 'profile', element: <Navigate to=\"/me\" replace /> }")
    })

    it('verifies dead CampusHub.tsx is purged from the codebase', () => {
      expect(mainCode).not.toContain('CampusHub')
      expect(appShellCode).not.toContain('CampusHub')
    })
  })

  // ── 2. Theme Architecture & First-Class Light Mode ───────────────────────
  describe('2. Dark / Light / System Theme Consistency', () => {
    it('ThemeProvider supports light, dark, and system preferences with auto system sync', () => {
      expect(themeProviderCode).toContain("ThemePreference = 'light' | 'dark' | 'system'")
      expect(themeProviderCode).toContain("matchMedia('(prefers-color-scheme: dark)')")
      expect(themeProviderCode).toContain("document.documentElement.classList.toggle('dark'")
      expect(themeProviderCode).toContain("document.documentElement.classList.toggle('light'")
      expect(themeProviderCode).toContain('document.documentElement.dataset.theme = resolved')
      expect(themeProviderCode).toContain('document.documentElement.style.colorScheme = resolved')
    })

    it('index.css defines distinct light mode tokens with adequate surface contrast', () => {
      expect(indexCssCode).toContain('--canvas: #f8fafc;')
      expect(indexCssCode).toContain('--surface: #ffffff;')
      expect(indexCssCode).toContain('--text-primary: #0f172a;')
      expect(indexCssCode).toContain('--text-secondary: #475569;')
      expect(indexCssCode).toContain('--border-default: rgba(0, 0, 0, 0.09);')
    })

    it('index.css ensures light mode achievement color has high contrast against white', () => {
      // Light mode uses deep amber (#d97706) for >= 4.5:1 ratio
      expect(indexCssCode).toContain('--achievement: #d97706;')
      // Dark mode uses glowing amber (#f59e0b)
      expect(indexCssCode).toContain('--achievement: #f59e0b;')
    })

    it('sonner toasts use semantic design tokens instead of hardcoded white opacities', () => {
      expect(indexCssCode).toContain('[data-sonner-toast] {')
      expect(indexCssCode).toContain('background: var(--surface-raised) !important;')
      expect(indexCssCode).toContain('border: 1px solid var(--border-strong) !important;')
      expect(indexCssCode).not.toContain('color: #ffffff !important;')
    })

    it('sheet close button uses semantic tokens instead of hardcoded white', () => {
      expect(sheetCode).toContain('text-text-secondary hover:text-text-primary')
      expect(sheetCode).not.toContain('text-white/80')
    })

    it('document stage docname includes semantic text-text-primary alongside baseline text-white', () => {
      expect(docStageCode).toContain('text-text-primary')
      expect(docStageCode).toContain('truncate text-xs font-semibold text-white')
    })
  })

  // ── 3. Responsive Layout & Viewport Safety ────────────────────────────────
  describe('3. Responsive Reflow & Viewport Invariants', () => {
    it('AppShell main container reserves safe-area bottom space for fixed mobile navigation', () => {
      expect(appShellCode).toContain('pb-[calc(88px+env(safe-area-inset-bottom))]')
    })

    it('MobileNav respects env(safe-area-inset-bottom)', () => {
      expect(mobileNavCode).toContain('pb-[env(safe-area-inset-bottom)]')
    })

    it('dialogs and popups enforce maximum bounds relative to viewport dimensions', () => {
      // Dialog content
      expect(dialogCode).toContain('max-h-[calc(100svh-2rem)]')
      expect(dialogCode).toContain('max-w-[calc(100%-2rem)]')
      // User Profile popover
      expect(profileDialogCode).toContain('max-w-[calc(100vw-24px)]')
    })

    it('button primitive incorporates pointer-coarse size expansion for mobile touch targets', () => {
      expect(buttonCode).toContain('pointer-coarse:min-h-11')
      expect(buttonCode).toContain('pointer-coarse:size-11')
    })

    it('AppHeader provides mobile brand icon when desktop sidebar is hidden', () => {
      expect(appHeaderCode).toContain('lg:hidden')
      expect(appHeaderCode).toContain('Digital Campus')
    })

    it('CampusChatSheet implements mobile conversation drill-down navigation', () => {
      expect(chatSheetCode).toContain("mobileView === 'thread' ? 'hidden sm:flex' : 'flex'")
      expect(chatSheetCode).toContain("mobileView === 'list' ? 'hidden sm:flex' : 'flex'")
    })
  })

  // ── 4. Pointer Interception & Zero Overlap ────────────────────────────────
  describe('4. Zero Accidental Pointer Interception & Overlays', () => {
    it('CampusHero artwork and gradients have pointer-events-none', () => {
      expect(campusHeroCode).toContain('pointer-events-none absolute inset-0 -z-20')
      expect(campusHeroCode).toContain('pointer-events-none absolute inset-0 -z-10')
    })

    it('CampusSearch desktop input search icon has pointer-events-none', () => {
      expect(campusSearchCode).toContain('pointer-events-none')
    })
  })

  // ── 5. Data Truth & Anti-Fabrication Invariants ───────────────────────────
  describe('5. Label Truth & Elimination of Misleading UI', () => {
    it('CampusSearch trigger placeholder truthfully reflects search capabilities', () => {
      expect(campusSearchCode).toContain('Tìm kiếm phòng học, trò chơi, bạn học...')
      expect(campusSearchCode).not.toContain('bài viết')
    })

    it('CommunityPage contains zero fake dynamic feed cards or fabricated events', () => {
      expect(communityPageCode).not.toContain('CampusFeed')
      expect(communityPageCode).not.toContain('Nhóm nổi bật')
      expect(communityPageCode).not.toContain('Sự kiện trường học')
    })

    it('LeaderboardPage contains zero fake scores or fake timeframe buttons', () => {
      expect(leaderboardPageCode).not.toContain('score: 1250')
      expect(leaderboardPageCode).not.toContain("id: 'week'")
      expect(leaderboardPageCode).not.toContain("id: 'month'")
    })

    it('HomePage uses authoritative data for rooms, friends presence, and real chat messages', () => {
      expect(homePageCode).toContain('buildRoomFriendsMap')
      expect(homePageCode).toContain('activeRoomsPreview')
      expect(homePageCode).toContain('onlineFriends')
      expect(homePageCode).toContain('recentMessagesPreview')
    })

    it('LearningPage provides authoritative lobby readiness state and honest empty state', () => {
      expect(learningPageCode).toContain('deriveLobbyState')
      expect(learningPageCode).toContain('learning-empty-rooms')
      expect(learningPageCode).toContain('learning-lobby-reconnecting')
    })
  })

  // ── 6. Accessibility & Keyboard Navigation ────────────────────────────────
  describe('6. Accessibility & Keyboard Navigation', () => {
    it('AppSidebar and AppHeader use accessible landmarks and labels', () => {
      expect(appSidebarCode).toContain('aria-label="Thanh điều hướng chính"')
      expect(appSidebarCode).toContain('aria-label="Khu vực hoạt động"')
      expect(appHeaderCode).toContain('<header')
    })

    it('Leaderboard category buttons use ARIA tablist and tab semantics', () => {
      expect(leaderboardPageCode).toContain('role="tablist"')
      expect(leaderboardPageCode).toContain('role="tab"')
      expect(leaderboardPageCode).toContain('aria-selected=')
    })

    it('CampusSearch supports Ctrl+K / Cmd+K global keyboard shortcut', () => {
      expect(campusSearchCode).toContain("e.key.toLowerCase() === 'k'")
      expect(campusSearchCode).toContain('e.ctrlKey || e.metaKey')
    })
  })
})
