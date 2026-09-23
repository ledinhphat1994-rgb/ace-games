// test/pqa-ab-navigation-learning.test.ts
// Digital Campus v2: Milestone PQA-A + PQA-B Verification Suite
// Primary Navigation Simplification & Learning Room Lobby Quality Contracts

import { describe, expect, it } from 'vitest'
import {
  DESKTOP_NAV_LINKS,
  MOBILE_NAV_ITEMS,
  NAV_ITEMS,
  type DesktopNavLink,
  type MobileNavItem,
} from '../src/components/layout/navigation-config'
import type { PhongSanh } from '../shared/protocol/campus'
import appHeaderRaw from '../src/components/layout/AppHeader.tsx?raw'
import mobileNavRaw from '../src/components/layout/MobileNav.tsx?raw'
import learningPageRaw from '../src/features/hub/LearningPage.tsx?raw'
import mainRaw from '../src/main.tsx?raw'

describe('PQA-A: Primary Navigation Simplification Contracts', () => {
  // ── 1. Desktop Primary Navigation ──────────────────────────────────────────
  describe('1. Desktop Primary Navigation', () => {
    it('A. Contains exactly 3 primary destinations', () => {
      expect(DESKTOP_NAV_LINKS).toHaveLength(3)
    })

    it('B. Destinations are strictly Học tập (/learn), Game (/arena), Cộng đồng (/community)', () => {
      expect(DESKTOP_NAV_LINKS[0]).toEqual({ to: '/learn', label: 'Học tập' })
      expect(DESKTOP_NAV_LINKS[1]).toEqual({ to: '/arena', label: 'Game' })
      expect(DESKTOP_NAV_LINKS[2]).toEqual({ to: '/community', label: 'Cộng đồng' })
    })

    it('C. Prohibits Home (Trang chủ) and Personal/Profile (Cá nhân) from primary navigation', () => {
      const paths = DESKTOP_NAV_LINKS.map((item: DesktopNavLink) => item.to)
      const labels = DESKTOP_NAV_LINKS.map((item: DesktopNavLink) => item.label.toLowerCase())

      expect(paths).not.toContain('/')
      expect(paths).not.toContain('/me')
      expect(paths).not.toContain('/profile')
      expect(labels).not.toContain('trang chủ')
      expect(labels).not.toContain('cá nhân')
      expect(labels).not.toContain('bạn bè')
    })

    it('D. AppHeader brand logo links canonically to /learn', () => {
      expect(appHeaderRaw).toContain('NavLink to="/learn"')
    })

    it('E. AppHeader has no global search input form (moved into /learn lobby)', () => {
      expect(appHeaderRaw).not.toContain('role="search"')
      expect(appHeaderRaw).not.toContain('handleSearchSubmit')
    })

    it('F. AppHeader does not contain separate FriendsDrawer button (friends belong to Community)', () => {
      expect(appHeaderRaw).not.toContain('<FriendsDrawer')
    })
  })

  // ── 2. Mobile Bottom Navigation ────────────────────────────────────────────
  describe('2. Mobile Bottom Navigation', () => {
    it('A. Contains exactly 3 primary destinations', () => {
      expect(MOBILE_NAV_ITEMS).toHaveLength(3)
      expect(NAV_ITEMS).toHaveLength(3)
    })

    it('B. Destinations are strictly Học tập (/learn), Game (/arena), Cộng đồng (/community)', () => {
      const items = MOBILE_NAV_ITEMS.map((item: MobileNavItem) => ({ to: item.to, label: item.label }))
      expect(items).toEqual([
        { to: '/learn', label: 'Học tập' },
        { to: '/arena', label: 'Game' },
        { to: '/community', label: 'Cộng đồng' },
      ])
    })

    it('C. Prohibits Trang chủ and Cá nhân from mobile navigation', () => {
      const paths = MOBILE_NAV_ITEMS.map((item: MobileNavItem) => item.to)
      const labels = MOBILE_NAV_ITEMS.map((item: MobileNavItem) => item.label.toLowerCase())

      expect(paths).not.toContain('/')
      expect(paths).not.toContain('/me')
      expect(paths).not.toContain('/profile')
      expect(labels).not.toContain('trang chủ')
      expect(labels).not.toContain('cá nhân')
      expect(labels).not.toContain('bạn bè')
    })

    it('D. MobileNav raw source has no Home or User icon imports', () => {
      expect(mobileNavRaw).not.toContain('Home,')
      expect(mobileNavRaw).not.toContain('User,')
    })
  })

  // ── 3. Routing & Canonical Redirection Contracts ───────────────────────────
  describe('3. Canonical Routing & Backward Compatibility Contracts', () => {
    it('A. Root route / redirects immediately to /learn', () => {
      expect(mainRaw).toContain('{ index: true, element: <Navigate to="/learn" replace /> }')
    })

    it('B. Legacy /learning route redirects canonically to /learn', () => {
      expect(mainRaw).toContain('{ path: \'learning\', element: <Navigate to="/learn" replace /> }')
    })

    it('C. Legacy /profile route redirects canonically to /me', () => {
      expect(mainRaw).toContain('{ path: \'profile\', element: <Navigate to="/me" replace /> }')
    })

    it('D. /me route mounts ProfilePage for safety and account access', () => {
      expect(mainRaw).toContain('{ path: \'me\', element: <ProfilePage /> }')
    })

    it('E. /arena mounts GameArenaPage and /community mounts CommunityPage', () => {
      expect(mainRaw).toContain('{ path: \'arena\', element: <GameArenaPage /> }')
      expect(mainRaw).toContain('{ path: \'community\', element: <CommunityPage /> }')
    })
  })
})

describe('PQA-B: Learning Room Lobby Quality & Truthfulness Contracts', () => {
  // ── 4. UI Simplification Contracts (Removal of decorative widgets) ─────────
  describe('4. UI Simplification & Anti-Dashboard Governance', () => {
    it('A. SubjectFilterStrip is removed from primary LearningPage', () => {
      expect(learningPageRaw).not.toContain('<SubjectFilterStrip')
      expect(learningPageRaw).not.toContain('import { SubjectFilterStrip')
    })

    it('B. ClassChallengeCard is removed from primary LearningPage', () => {
      expect(learningPageRaw).not.toContain('<ClassChallengeCard')
      expect(learningPageRaw).not.toContain('import { ClassChallengeCard')
    })

    it('C. ClassLeaderboardCard is removed from primary LearningPage', () => {
      expect(learningPageRaw).not.toContain('<ClassLeaderboardCard')
      expect(learningPageRaw).not.toContain('import { ClassLeaderboardCard')
    })

    it('D. Streak and XP hero metrics are removed from primary LearningPage', () => {
      expect(learningPageRaw).not.toContain('<LearningHeader')
      expect(learningPageRaw).not.toContain('import { LearningHeader')
    })

    it('E. Lobby statistics widget is removed from primary LearningPage', () => {
      expect(learningPageRaw).not.toContain('LobbyOccupancyStat')
      expect(learningPageRaw).not.toContain('headerLabel')
    })
  })

  // ── 5. Room Code & Direct Join Sanitization Logic ──────────────────────────
  describe('5. Join Room ID / Code Sanitization Logic', () => {
    function sanitizeJoinRoomInput(input: string): { ok: boolean; roomId?: number; error?: string } {
      const clean = input.trim().replace(/^phong-/, '')
      if (!clean) {
        return { ok: false, error: 'Vui lòng nhập ID hoặc mã số phòng học.' }
      }
      const num = parseInt(clean, 10)
      if (isNaN(num) || num <= 0) {
        return { ok: false, error: 'Mã phòng không hợp lệ. Vui lòng nhập số ID phòng (VD: 1, 42).' }
      }
      return { ok: true, roomId: num }
    }

    it('A. Correctly accepts standard numeric IDs', () => {
      expect(sanitizeJoinRoomInput('1')).toEqual({ ok: true, roomId: 1 })
      expect(sanitizeJoinRoomInput('42')).toEqual({ ok: true, roomId: 42 })
      expect(sanitizeJoinRoomInput(' 108 ')).toEqual({ ok: true, roomId: 108 })
    })

    it('B. Correctly strips optional "phong-" prefix', () => {
      expect(sanitizeJoinRoomInput('phong-42')).toEqual({ ok: true, roomId: 42 })
      expect(sanitizeJoinRoomInput(' phong-99 ')).toEqual({ ok: true, roomId: 99 })
    })

    it('C. Rejects empty, non-numeric, or negative inputs with clear error messages', () => {
      expect(sanitizeJoinRoomInput('')).toEqual({
        ok: false,
        error: 'Vui lòng nhập ID hoặc mã số phòng học.',
      })
      expect(sanitizeJoinRoomInput('   ')).toEqual({
        ok: false,
        error: 'Vui lòng nhập ID hoặc mã số phòng học.',
      })
      expect(sanitizeJoinRoomInput('abc')).toEqual({
        ok: false,
        error: 'Mã phòng không hợp lệ. Vui lòng nhập số ID phòng (VD: 1, 42).',
      })
      expect(sanitizeJoinRoomInput('-5')).toEqual({
        ok: false,
        error: 'Mã phòng không hợp lệ. Vui lòng nhập số ID phòng (VD: 1, 42).',
      })
      expect(sanitizeJoinRoomInput('0')).toEqual({
        ok: false,
        error: 'Mã phòng không hợp lệ. Vui lòng nhập số ID phòng (VD: 1, 42).',
      })
    })
  })

  // ── 6. In-Lobby Search & Filtering Logic ────────────────────────────────────
  describe('6. In-Lobby Room Search & Filtering Truthfulness', () => {
    const mockRooms: PhongSanh[] = [
      {
        id: 1,
        ten: 'Ôn tập Toán Hình chương 2',
        chuPhongTen: 'Nguyễn Văn An',
        phamVi: 'truong',
        lopId: null,
        lopTen: null,
        soNguoi: 3,
        sucChua: 20,
        coMatKhau: false,
        monHoc: 'toan',
        moTa: 'Giải bài tập tam giác đồng dạng',
        dangPhat: null,
        taoLuc: 1700000000000,
      },
      {
        id: 2,
        ten: 'Thảo luận Văn học 10A7',
        chuPhongTen: 'Trần Thị Bình',
        phamVi: 'lop',
        lopId: 10,
        lopTen: '10A7',
        soNguoi: 5,
        sucChua: 15,
        coMatKhau: true,
        monHoc: 'ngu-van',
        moTa: 'Phân tích truyện ngắn',
        dangPhat: null,
        taoLuc: 1700000000000,
      },
      {
        id: 3,
        ten: 'Học nhóm Tiếng Anh Unit 5',
        chuPhongTen: 'Lê Hoàng Nam',
        phamVi: 'truong',
        lopId: null,
        lopTen: null,
        soNguoi: 2,
        sucChua: 10,
        coMatKhau: false,
        monHoc: 'tieng-anh',
        moTa: 'Grammar practice',
        dangPhat: null,
        taoLuc: 1700000000000,
      },
    ]

    function filterRooms(rooms: PhongSanh[], query: string): PhongSanh[] {
      const q = query.trim().toLowerCase()
      if (!q) return rooms
      return rooms.filter((room) => {
        const matchName = room.ten.toLowerCase().includes(q)
        const matchHost = room.chuPhongTen.toLowerCase().includes(q)
        const matchSubject = (room.monHoc || '').toLowerCase().includes(q)
        return matchName || matchHost || matchSubject
      })
    }

    it('A. Returns all rooms when search query is empty', () => {
      expect(filterRooms(mockRooms, '')).toHaveLength(3)
      expect(filterRooms(mockRooms, '   ')).toHaveLength(3)
    })

    it('B. Filters accurately by room name', () => {
      const result = filterRooms(mockRooms, 'Toán Hình')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it('C. Filters accurately by host name', () => {
      const result = filterRooms(mockRooms, 'Bình')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })

    it('D. Filters accurately by subject keyword', () => {
      const result = filterRooms(mockRooms, 'tieng-anh')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(3)
    })

    it('E. Returns truthful empty array when no rooms match query', () => {
      const result = filterRooms(mockRooms, 'hoa-hoc')
      expect(result).toHaveLength(0)
    })
  })
})
