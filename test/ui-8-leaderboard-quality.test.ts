import { describe, it, expect } from 'vitest'
import leaderboardRaw from '../src/features/hub/LeaderboardPage.tsx?raw'
import mainRaw from '../src/main.tsx?raw'
import navConfigRaw from '../src/components/layout/navigation-config.ts?raw'
import homePageRaw from '../src/features/hub/HomePage.tsx?raw'
import gameLobbyRaw from '../src/features/games/GameLobbyView.tsx?raw'

describe('UI-8 Leaderboard — Rankings & Recognition Quality & Data Truth', () => {
  // ── 1. Canonical Route Alignment ──
  it('1. /leaderboard is the canonical route in main.tsx and navigation-config', () => {
    expect(mainRaw).toContain("{ path: 'leaderboard', element: <LeaderboardPage /> }")
    expect(mainRaw).toContain("{ path: 'rankings', element: <Navigate to=\"/leaderboard\" replace /> }")
    expect(navConfigRaw).toContain("{ to: '/leaderboard', label: 'Bảng xếp hạng'")
    expect(homePageRaw).toContain("to: '/leaderboard'")
    expect(gameLobbyRaw).toContain('to="/leaderboard"')
  })

  // ── 2. Data Truth & No Fabrication ──
  it('2. Zero fabricated fallback users or scores in LeaderboardPage', () => {
    // Must NOT contain fake scores or fake user fallbacks
    expect(leaderboardRaw).not.toContain('score: 1250')
    expect(leaderboardRaw).not.toContain("badge: 'Tích cực'")
    expect(leaderboardRaw).not.toContain("badge: 'Thủ khoa'")
    expect(leaderboardRaw).not.toContain("badge: 'Xuất sắc'")
    expect(leaderboardRaw).not.toContain("badge: 'Vô địch'")
    expect(leaderboardRaw).not.toContain("badge: 'Cao thủ'")
    expect(leaderboardRaw).not.toContain('Diamond League')
    expect(leaderboardRaw).not.toContain('+3 positions')
    expect(leaderboardRaw).not.toContain('Top 5%')
  })

  it('3. No fake timeframe filters claiming to filter cumulative backend queries', () => {
    // The old fake buttons that never sent time parameters to the backend must be gone
    expect(leaderboardRaw).not.toContain("id: 'week', label: 'Tuần này'")
    expect(leaderboardRaw).not.toContain("id: 'month', label: 'Tháng này'")
  })

  // ── 3. Authoritative APIs & Verified Scores ──
  it('4. Uses authoritative endpoints for School Study and Server-Verified Game Highscores', () => {
    expect(leaderboardRaw).toContain('/api/engagement/leaderboard/school')
    expect(leaderboardRaw).toContain('/api/engagement/leaderboard')
    expect(leaderboardRaw).toContain("verifiedOnly=1")
  })

  // ── 4. Real Categories ──
  it('5. Supports real authoritative categories matching the platform games and study', () => {
    expect(leaderboardRaw).toContain("'hoc_tap'")
    expect(leaderboardRaw).toContain("'chess'")
    expect(leaderboardRaw).toContain("'xiangqi'")
    expect(leaderboardRaw).toContain("'caro_15'")
    expect(leaderboardRaw).toContain("'solo_snake'")
    expect(leaderboardRaw).toContain("'solo_memory'")
  })

  // ── 5. Podium & Ranking List ──
  it('6. Podium renders conditionally only with real entries (entries.length >= 3)', () => {
    expect(leaderboardRaw).toContain('showPodium = entries.length >= 3')
    expect(leaderboardRaw).toContain('data-testid="leaderboard-podium"')
    expect(leaderboardRaw).toContain('data-testid="ranking-list"')
    expect(leaderboardRaw).toContain('data-testid="ranking-row"')
  })

  // ── 6. Profile Integration ──
  it('7. Reuses canonical HoSoNguoiDungDialog for real user profiles', () => {
    expect(leaderboardRaw).toContain('import { HoSoNguoiDungDialog')
    expect(leaderboardRaw).toContain('<HoSoNguoiDungDialog')
  })

  // ── 7. Current User Highlighting ──
  it('8. Distinguishes authenticated user row with brand styling without altering rank', () => {
    expect(leaderboardRaw).toContain('isCurrentUser')
    expect(leaderboardRaw).toContain('bg-brand/10')
  })

  // ── 8. Real Avatars ──
  it('9. Reuses canonical AnhNguoiDung component for user avatars', () => {
    expect(leaderboardRaw).toContain('import { AnhNguoiDung }')
    expect(leaderboardRaw).toContain('<AnhNguoiDung')
  })

  // ── 9. Accessibility & Responsiveness ──
  it('10. Accessible semantics with tablist, tab, aria-selected, and refresh button', () => {
    expect(leaderboardRaw).toContain('role="tablist"')
    expect(leaderboardRaw).toContain('role="tab"')
    expect(leaderboardRaw).toContain('aria-selected=')
    expect(leaderboardRaw).toContain('aria-label="Làm mới bảng xếp hạng"')
  })

  // ── 10. Card Stability & Zero Layout Shift (Peer Card Uniformity & Fixed Stage Card) ──
  it('11. Enforces uniform tabs for Category cards and locked min-height for main stage card', () => {
    // 1. Vùng 2 category tabs must use uniform border and motion without stutter
    expect(leaderboardRaw).toContain('data-testid="category-tabs"')
    expect(leaderboardRaw).toContain('overflow-x-auto')
    expect(leaderboardRaw).toContain('border-2')
    expect(leaderboardRaw).toContain('transition-colors duration-150')
    expect(leaderboardRaw).not.toContain('transition-all')

    // 2. Main stage card container must lock minimum height and provide fixed header
    expect(leaderboardRaw).toContain('min-h-[580px]')
    expect(leaderboardRaw).toContain('Bảng vinh danh')
  })
})
