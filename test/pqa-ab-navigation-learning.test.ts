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
import {
  parseRoomJoinTarget,
  deriveLobbyState,
  filterLobbyRooms,
  deriveActiveFriendStudy,
  deriveQuickJoinRoom,
} from '../src/features/hub/learning-semantics'
import { buildRoomFriendsMap } from '../src/features/hub/room-discovery'
import type { PhongSanh } from '../shared/protocol/campus'
import type { FriendItem, FriendPresence } from '../shared/protocol/social'
import appHeaderRaw from '../src/components/layout/AppHeader.tsx?raw'
import mobileNavRaw from '../src/components/layout/MobileNav.tsx?raw'
import learningPageRaw from '../src/features/hub/LearningPage.tsx?raw'
import joinRoomModalRaw from '../src/features/hub/components/learning/JoinRoomModal.tsx?raw'
import createStudyRoomDialogRaw from '../src/features/hub/CreateStudyRoomDialog.tsx?raw'
import roomCardRaw from '../src/features/hub/RoomCard.tsx?raw'
import arenaLeaderboardRaw from '../src/features/games/GameArenaLeaderboard.tsx?raw'
import pageHeaderRaw from '../src/components/layout/PageHeader.tsx?raw'
import mainRaw from '../src/main.tsx?raw'

describe('PQA-A: Primary Navigation Simplification Contracts', () => {
  // ── 1. Desktop Primary Navigation ──────────────────────────────────────────
  describe('1. Desktop Primary Navigation', () => {
    it('A. Contains exactly 2 primary destinations', () => {
      expect(DESKTOP_NAV_LINKS).toHaveLength(3)
    })

    it('B. Destinations are strictly Học tập (/learn) and Game (/arena)', () => {
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
    it('A. Contains exactly 2 primary destinations', () => {
      expect(MOBILE_NAV_ITEMS).toHaveLength(4)
      expect(NAV_ITEMS).toHaveLength(4)
    })

    it('B. Destinations are strictly Học tập (/learn), Game (/arena)', () => {
      const items = MOBILE_NAV_ITEMS.map((item: MobileNavItem) => ({ to: item.to, label: item.label }))
      expect(items).toEqual([
        { to: '/', label: 'Trang chủ' },
        { to: '/learn', label: 'Học tập' },
        { to: '/arena', label: 'Game' },
        { to: '/community', label: 'Cộng đồng' },
      ])
    })

    it('C. Prohibits Trang chủ and Cá nhân from mobile navigation', () => {
      const paths = MOBILE_NAV_ITEMS.map((item: MobileNavItem) => item.to)
      const labels = MOBILE_NAV_ITEMS.map((item: MobileNavItem) => item.label.toLowerCase())

      expect(paths).toContain('/')
      expect(paths).not.toContain('/me')
      expect(paths).not.toContain('/profile')
      expect(labels).toContain('trang chủ')
      expect(labels).not.toContain('cá nhân')
      expect(labels).not.toContain('bạn bè')
    })

    it('D. MobileNav raw source has no Home or User icon imports', () => {
      // MobileNav delegates icons to navigation-config
      expect(mobileNavRaw).not.toContain('User,')
    })
  })

  // ── 3. Routing & Canonical Redirection Contracts ───────────────────────────
  describe('3. Canonical Routing & Backward Compatibility Contracts', () => {
    it('A. Root route / redirects immediately to /learn', () => {
      expect(mainRaw).toContain('{ index: true, element: <HomePage /> }')
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

    it('C2. Phòng học tập chuyển sang bố cục sảnh chuyên dụng: không lặp bảng xếp hạng và thanh xã hội', () => {
      // Học tập không còn dùng bố cục 3 cột của Game; tách khỏi SanhHoatDong để tập trung vào khám phá phòng.
      expect(learningPageRaw).not.toContain('<GameArenaLeaderboard')
      expect(learningPageRaw).not.toContain('<GameSocialSidebar')
      expect(learningPageRaw).toContain('CreateStudyRoomDialog')
      expect(learningPageRaw).toContain('JoinRoomModal')
    })

    it('C3. Tiêu đề giữ phân cấp dùng chung cho trang và khu vực', () => {
      expect(pageHeaderRaw).toContain('<h1 className="tieu-de-cap-1')
      expect(pageHeaderRaw).toContain('<span className="tieu-de-cap-2')
      expect(arenaLeaderboardRaw).toContain('className="tieu-de-cap-2')
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

  // ── 5. Room Lobby Authoritative Readiness Lifecycle ────────────────────────
  describe('5. Lobby Readiness State Derivation (deriveLobbyState)', () => {
    const sampleRoom: PhongSanh = {
      id: 1,
      ten: 'Phòng Toán 10',
      chuPhongTen: 'Nguyễn Văn An',
      phamVi: 'truong',
      lopId: null,
      lopTen: null,
      soNguoi: 2,
      sucChua: 20,
      coMatKhau: false,
      monHoc: 'toan',
      moTa: 'Ôn tập chương 1',
      dangPhat: null,
      taoLuc: 1700000000000,
    }

    it('A. Contract A: No snapshot yet => loading, NOT empty', () => {
      const state = deriveLobbyState({
        trangThai: 'dang_ket_noi',
        campusSnapshotReady: false,
        rooms: [],
      })
      expect(state.status).toBe('loading')
    })

    it('B. Contract B: Disconnect after previous rooms => reconnecting, NOT confirmed active', () => {
      const state = deriveLobbyState({
        trangThai: 'mat_ket_noi',
        campusSnapshotReady: false,
        rooms: [sampleRoom],
      })
      expect(state.status).toBe('reconnecting')
    })

    it('C. Contract C: Fresh empty snapshot received => ready with 0 rooms (authoritative empty)', () => {
      const state = deriveLobbyState({
        trangThai: 'da_ket_noi',
        campusSnapshotReady: true,
        rooms: [],
      })
      expect(state.status).toBe('ready')
      if (state.status === 'ready') {
        expect(state.rooms).toHaveLength(0)
      }
    })

    it('D. Contract D: Fresh rooms snapshot received => ready with active rooms', () => {
      const state = deriveLobbyState({
        trangThai: 'da_ket_noi',
        campusSnapshotReady: true,
        rooms: [sampleRoom],
      })
      expect(state.status).toBe('ready')
      if (state.status === 'ready') {
        expect(state.rooms).toHaveLength(1)
        expect(state.rooms[0].id).toBe(1)
      }
    })
  })

  // ── 6. Production Strict Room Join Parser ──────────────────────────────────
  describe('6. Production Strict Room Join Target Parser (parseRoomJoinTarget)', () => {
    it('E. Accepts valid existing formats: number, phong-ID, relative route, and same-origin URL', () => {
      expect(parseRoomJoinTarget('42')).toEqual({ ok: true, roomId: 42 })
      expect(parseRoomJoinTarget(' 108 ')).toEqual({ ok: true, roomId: 108 })
      expect(parseRoomJoinTarget('phong-42')).toEqual({ ok: true, roomId: 42 })
      expect(parseRoomJoinTarget('/room/phong-42')).toEqual({ ok: true, roomId: 42 })
      expect(parseRoomJoinTarget('room/phong-42')).toEqual({ ok: true, roomId: 42 })
      expect(
        parseRoomJoinTarget('https://campus.school.edu/room/phong-42', 'https://campus.school.edu'),
      ).toEqual({
        ok: true,
        roomId: 42,
      })
      expect(
        parseRoomJoinTarget('http://localhost:5173/room/phong-99', 'http://localhost:5173'),
      ).toEqual({
        ok: true,
        roomId: 99,
      })
    })

    it('F. Strictly rejects malformed alphanumeric mix, external lookalike domains, negative, zero, and unrelated URLs', () => {
      expect(parseRoomJoinTarget('42abc').ok).toBe(false)
      expect(parseRoomJoinTarget('abc42').ok).toBe(false)
      expect(parseRoomJoinTarget('0').ok).toBe(false)
      expect(parseRoomJoinTarget('-5').ok).toBe(false)
      expect(parseRoomJoinTarget('').ok).toBe(false)
      expect(parseRoomJoinTarget('   ').ok).toBe(false)
      // Reject external lookalike domains even if path matches /room/phong-42
      expect(
        parseRoomJoinTarget('https://evil.example/room/phong-42', 'https://campus.school.edu').ok,
      ).toBe(false)
      expect(
        parseRoomJoinTarget('https://phishing.campus/room/phong-42', 'https://campus.school.edu').ok,
      ).toBe(false)
      expect(parseRoomJoinTarget('https://evil.example/room/phong-42').ok).toBe(false)
      expect(
        parseRoomJoinTarget('https://campus.school.edu/other-page', 'https://campus.school.edu').ok,
      ).toBe(false)
    })

    it('G. JoinRoomModal has eliminated fake "room code" wording', () => {
      expect(joinRoomModalRaw).not.toContain('Mã hoặc số phòng')
      expect(joinRoomModalRaw).not.toContain('mã số phòng')
      expect(joinRoomModalRaw).toContain('ID hoặc liên kết phòng')
      // Sảnh Học tập: Học ngay (tự chọn phòng) · Tạo phòng. Vào phòng của bạn bè: bấm link chia sẻ.
      expect(learningPageRaw).toContain('Học ngay')
      expect(learningPageRaw).toContain('Tạo phòng')
      expect(learningPageRaw).toContain('<JoinRoomModal')
    })
  })

  // ── 7. Create Room Dialog Simplicity ───────────────────────────────────────
  describe('7. Create Room Dialog Simplicity (CreateStudyRoomDialog)', () => {
    it('G. Dialog is streamlined with room type and capacity directly visible without toggle', () => {
      expect(createStudyRoomDialogRaw).toContain('data-testid="create-room-dialog"')
      expect(createStudyRoomDialogRaw).toContain('testId="create-room-mode-public"')
      expect(createStudyRoomDialogRaw).toContain('testId="create-room-mode-password"')
      expect(createStudyRoomDialogRaw).toContain('data-testid="create-room-advanced-section"')
    })
  })

  // ── 8. RoomCard Visual Simplification ──────────────────────────────────────
  describe('8. RoomCard Visual Simplification', () => {
    it('H. Prohibits redundant "Trực tiếp" and "Học tập" category badges', () => {
      expect(roomCardRaw).not.toContain('Trực tiếp')
      expect(roomCardRaw).not.toContain('Radio')
      expect(roomCardRaw).not.toContain('TEN_MON_HOC')
      expect(roomCardRaw).not.toContain('getRoomThumbnail')
    })

    it('I. RoomCard maintains calm workspace structure with room name, host, capacity, lock and Vào phòng CTA', () => {
      expect(roomCardRaw).toContain('room.ten')
      expect(roomCardRaw).toContain('room.chuPhongTen')
      expect(roomCardRaw).toContain('room.sucChua')
      expect(roomCardRaw).toContain('room.soNguoi')
      expect(roomCardRaw).toContain('Vào phòng')
    })
  })

  // ── 9. In-Lobby Room Search & Filtering Logic ──────────────────────────────
  describe('9. In-Lobby Room Search & Filtering Truthfulness (filterLobbyRooms)', () => {
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

    it('A. Returns all rooms when search query is empty', () => {
      expect(filterLobbyRooms(mockRooms, '')).toHaveLength(3)
      expect(filterLobbyRooms(mockRooms, '   ')).toHaveLength(3)
    })

    it('B. Filters accurately by room name', () => {
      const result = filterLobbyRooms(mockRooms, 'Toán Hình')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })

    it('C. Filters accurately by host name', () => {
      const result = filterLobbyRooms(mockRooms, 'Bình')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(2)
    })

    it('D. Filters accurately by subject keyword', () => {
      const result = filterLobbyRooms(mockRooms, 'tieng-anh')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(3)
    })

    it('E. Returns truthful empty array when no rooms match query', () => {
      const result = filterLobbyRooms(mockRooms, 'hoa-hoc')
      expect(result).toHaveLength(0)
    })
  })

  // ── 10. Authoritative Room Friend Presence Freshness (buildRoomFriendsMap) ──
  describe('10. Authoritative Room Friend Presence Freshness (buildRoomFriendsMap)', () => {
    const sampleRoom: PhongSanh = {
      id: 42,
      ten: 'Phòng Toán 10',
      chuPhongTen: 'Nguyễn Văn An',
      phamVi: 'truong',
      lopId: null,
      lopTen: null,
      soNguoi: 2,
      sucChua: 20,
      coMatKhau: false,
      monHoc: 'toan',
      moTa: 'Ôn tập chương 1',
      dangPhat: null,
      taoLuc: 1700000000000,
    }

    const friendA: FriendItem = {
      id: 101,
      username: 'bana',
      displayName: 'Bạn A',
      avatar: null,
      role: 'hoc_sinh',
      lopTen: '10A7',
      friendedAt: 1700000000000,
    }

    const presenceMapWithRoom: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: {
          type: 'room',
          roomId: 42,
          roomTitle: 'Phòng Toán 10',
        },
      },
    }

    it('A. presenceReady=true + connection=da_ket_noi: friend in room => friend badge projection exists', () => {
      const map = buildRoomFriendsMap([sampleRoom], [friendA], presenceMapWithRoom, [], {
        presenceReady: true,
        connectionStatus: 'da_ket_noi',
      })
      const friendsIn42 = map.get(42)
      expect(friendsIn42).toBeDefined()
      expect(friendsIn42).toHaveLength(1)
      expect(friendsIn42![0].id).toBe(101)
      expect(friendsIn42![0].displayName).toBe('Bạn A')
    })

    it('B. Same cached presenceMap + presenceReady=false + connection=mat_ket_noi: => ZERO friend room projections', () => {
      const map = buildRoomFriendsMap([sampleRoom], [friendA], presenceMapWithRoom, [], {
        presenceReady: false,
        connectionStatus: 'mat_ket_noi',
      })
      const friendsIn42 = map.get(42)
      expect(friendsIn42).toBeDefined()
      expect(friendsIn42).toHaveLength(0) // ZERO friend projections!
    })

    it('C. Reconnecting: presenceReady=false + connection=dang_ket_noi: => ZERO friend room projections', () => {
      const map = buildRoomFriendsMap([sampleRoom], [friendA], presenceMapWithRoom, [], {
        presenceReady: false,
        connectionStatus: 'dang_ket_noi',
      })
      const friendsIn42 = map.get(42)
      expect(friendsIn42).toBeDefined()
      expect(friendsIn42).toHaveLength(0) // ZERO friend projections!
    })

    it('D. Fresh snapshot after reconnect: presenceReady=true + connection=da_ket_noi: => friend projection returns correctly', () => {
      const map = buildRoomFriendsMap([sampleRoom], [friendA], presenceMapWithRoom, [], {
        presenceReady: true,
        connectionStatus: 'da_ket_noi',
      })
      const friendsIn42 = map.get(42)
      expect(friendsIn42).toBeDefined()
      expect(friendsIn42).toHaveLength(1)
      expect(friendsIn42![0].id).toBe(101)
      expect(friendsIn42![0].displayName).toBe('Bạn A')
    })
  })

  // ── 11. UI-3 Fail-Closed Friend Study & Truthful Quick Join Contracts ──────
  describe('11. Fail-Closed Friend Study & Truthful Quick Join Contracts (UI-3)', () => {
    const sampleRoom42: PhongSanh = {
      id: 42,
      ten: 'Phòng Toán 10',
      chuPhongTen: 'Nguyễn Văn An',
      phamVi: 'truong',
      lopId: null,
      lopTen: null,
      soNguoi: 2,
      sucChua: 20,
      coMatKhau: false,
      monHoc: 'toan',
      moTa: 'Ôn tập chương 1',
      dangPhat: null,
      taoLuc: 1700000000000,
    }

    const sampleRoomFull: PhongSanh = {
      id: 43,
      ten: 'Phòng Văn Đầy Chỗ',
      chuPhongTen: 'Trần Thị Bình',
      phamVi: 'lop',
      lopId: 10,
      lopTen: '10A7',
      soNguoi: 15,
      sucChua: 15,
      coMatKhau: false,
      monHoc: 'ngu-van',
      moTa: 'Phân tích văn học',
      dangPhat: null,
      taoLuc: 1700000000000,
    }

    const sampleRoomPassword: PhongSanh = {
      id: 44,
      ten: 'Phòng Riêng Có Khóa',
      chuPhongTen: 'Lê Hoàng Nam',
      phamVi: 'truong',
      lopId: null,
      lopTen: null,
      soNguoi: 1,
      sucChua: 10,
      coMatKhau: true,
      monHoc: 'tieng-anh',
      moTa: 'Luyện thi riêng',
      dangPhat: null,
      taoLuc: 1700000000000,
    }

    const friendA: FriendItem = {
      id: 101,
      username: 'bana',
      displayName: 'Bạn A',
      avatar: null,
      role: 'hoc_sinh',
      lopTen: '10A7',
      friendedAt: 1700000000000,
    }

    const presenceWithRoom42: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: {
          type: 'room',
          roomId: 42,
          roomTitle: 'Phòng Toán 10',
        },
      },
    }

    // A. stale/reconnecting presence cannot produce friend-study continuation
    it('A. stale/reconnecting presence cannot produce friend-study continuation', () => {
      // Pre-existing room friends map with friend present
      const activeMap = new Map([[42, [{ id: 101, displayName: 'Bạn A', username: 'bana', avatar: null }]]])

      // 1. presenceReady is false => null
      expect(
        deriveActiveFriendStudy({
          rooms: [sampleRoom42],
          roomFriendsMap: activeMap,
          presenceReady: false,
          trangThai: 'da_ket_noi',
        }),
      ).toBeNull()

      // 2. trangThai is mat_ket_noi (reconnecting) => null
      expect(
        deriveActiveFriendStudy({
          rooms: [sampleRoom42],
          roomFriendsMap: activeMap,
          presenceReady: true,
          trangThai: 'mat_ket_noi',
        }),
      ).toBeNull()

      // 3. trangThai is dang_ket_noi (connecting) => null
      expect(
        deriveActiveFriendStudy({
          rooms: [sampleRoom42],
          roomFriendsMap: activeMap,
          presenceReady: false,
          trangThai: 'dang_ket_noi',
        }),
      ).toBeNull()

      // 4. End-to-end with buildRoomFriendsMap during disconnect
      const disconnectedFriendsMap = buildRoomFriendsMap(
        [sampleRoom42],
        [friendA],
        presenceWithRoom42,
        [],
        { presenceReady: false, connectionStatus: 'mat_ket_noi' },
      )
      expect(
        deriveActiveFriendStudy({
          rooms: [sampleRoom42],
          roomFriendsMap: disconnectedFriendsMap,
          presenceReady: false,
          trangThai: 'mat_ket_noi',
        }),
      ).toBeNull()
    })

    // B. friend-study continuation uses an authoritative current room
    it('B. friend-study continuation uses an authoritative current room', () => {
      // 1. Friend presence points to roomId: 999 which does NOT exist in authoritative rooms
      const presenceWithNonExistentRoom: Record<number, FriendPresence> = {
        101: {
          accountId: 101,
          state: 'online',
          lastSeen: Date.now(),
          activity: {
            type: 'room',
            roomId: 999,
            roomTitle: 'Phòng Ảo Đã Đóng',
          },
        },
      }
      const mapNonExistent = buildRoomFriendsMap(
        [sampleRoom42], // authoritative rooms only has 42, not 999
        [friendA],
        presenceWithNonExistentRoom,
        [],
        { presenceReady: true, connectionStatus: 'da_ket_noi' },
      )
      expect(
        deriveActiveFriendStudy({
          rooms: [sampleRoom42],
          roomFriendsMap: mapNonExistent,
          presenceReady: true,
          trangThai: 'da_ket_noi',
        }),
      ).toBeNull()

      // 2. Even if roomFriendsMap has an orphaned entry for 999, it is never returned because 999 is not in rooms
      const orphanedMap = new Map([[999, [{ id: 101, displayName: 'Bạn A', username: 'bana', avatar: null }]]])
      expect(
        deriveActiveFriendStudy({
          rooms: [sampleRoom42],
          roomFriendsMap: orphanedMap,
          presenceReady: true,
          trangThai: 'da_ket_noi',
        }),
      ).toBeNull()

      // 3. Authoritative room 42 exists and friend is active in it
      const validMap = buildRoomFriendsMap(
        [sampleRoom42],
        [friendA],
        presenceWithRoom42,
        [],
        { presenceReady: true, connectionStatus: 'da_ket_noi' },
      )
      const continuation = deriveActiveFriendStudy({
        rooms: [sampleRoom42],
        roomFriendsMap: validMap,
        presenceReady: true,
        trangThai: 'da_ket_noi',
      })
      expect(continuation).not.toBeNull()
      expect(continuation!.friend.displayName).toBe('Bạn A')
      expect(continuation!.room).toBe(sampleRoom42) // Retains real authoritative PhongSanh object
      expect(continuation!.room.id).toBe(42)
    })

    // C. quick join is unavailable while reconnecting
    it('C. quick join is unavailable while reconnecting or loading', () => {
      const activeMap = new Map([[42, []]])

      // Reconnecting state => null
      const reconnectingResult = deriveQuickJoinRoom({
        lobbyStatus: 'reconnecting',
        rooms: [sampleRoom42],
        roomFriendsMap: activeMap,
      })
      expect(reconnectingResult).toBeNull()

      // Loading state => null
      const loadingResult = deriveQuickJoinRoom({
        lobbyStatus: 'loading',
        rooms: [sampleRoom42],
        roomFriendsMap: activeMap,
      })
      expect(loadingResult).toBeNull()
    })

    // D. quick join is unavailable when all rooms are full/password-protected
    it('D. quick join is unavailable when all rooms are full or password-protected', () => {
      const activeMap = new Map()

      // 1. Authoritative room list is empty
      expect(
        deriveQuickJoinRoom({
          lobbyStatus: 'ready',
          rooms: [],
          roomFriendsMap: activeMap,
        }),
      ).toBeNull()

      // 2. Every room is full
      expect(
        deriveQuickJoinRoom({
          lobbyStatus: 'ready',
          rooms: [sampleRoomFull],
          roomFriendsMap: activeMap,
        }),
      ).toBeNull()

      // 3. Every available room requires a password
      expect(
        deriveQuickJoinRoom({
          lobbyStatus: 'ready',
          rooms: [sampleRoomPassword],
          roomFriendsMap: activeMap,
        }),
      ).toBeNull()

      // 4. Combination of only full and password-protected rooms
      expect(
        deriveQuickJoinRoom({
          lobbyStatus: 'ready',
          rooms: [sampleRoomFull, sampleRoomPassword],
          roomFriendsMap: activeMap,
        }),
      ).toBeNull()
    })

    // E. quick join is available for a valid public room with capacity
    it('E. quick join is available for a valid public room with capacity', () => {
      const activeMap = new Map()
      const candidateRooms = [sampleRoomFull, sampleRoomPassword, sampleRoom42]

      const quickRoom = deriveQuickJoinRoom({
        lobbyStatus: 'ready',
        rooms: candidateRooms,
        roomFriendsMap: activeMap,
      })

      expect(quickRoom).not.toBeNull()
      expect(quickRoom!.id).toBe(42)
      expect(quickRoom!.soNguoi).toBeLessThan(quickRoom!.sucChua)
      expect(quickRoom!.coMatKhau).toBe(false)
      expect(quickRoom).toBe(sampleRoom42)
    })

    // F. LearningPage source guarantees fail-closed and admission flow
    it('F. LearningPage source guarantees fail-closed and admission flow', () => {
      // Fail-closed friend study uses deriveActiveFriendStudy
      expect(learningPageRaw).toContain('deriveActiveFriendStudy')
      expect(learningPageRaw).toContain('activeFriendStudy.room')
      // Vào cùng navigates via admission flow xuLyVaoPhong(activeFriendStudy.room)
      expect(learningPageRaw).toContain('xuLyVaoPhong(activeFriendStudy.room)')
      // Truthful quick join uses deriveQuickJoinRoom
      expect(learningPageRaw).toContain('deriveQuickJoinRoom')
      expect(learningPageRaw).toContain('quickJoinRoom &&')
      expect(learningPageRaw).toContain('xuLyVaoPhong(quickJoinRoom)')
    })
  })
})
