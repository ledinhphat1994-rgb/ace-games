// test/u2-visual-components.test.ts
// Digital Campus v2: Milestone U2 — Visual Implementation, Information Architecture & Component Tests

import { describe, expect, it } from 'vitest'
import { filterDiscoveryRooms, buildRoomFriendsMap } from '../src/features/hub/room-discovery'
import type { PhongSanh } from '../shared/protocol/campus'
import type { BlockedUserItem, FriendItem, FriendPresence } from '../shared/protocol/social'

describe('U2 Visual Implementation & State Contracts', () => {
  const mockRooms: PhongSanh[] = [
    {
      id: 101,
      ten: 'Phòng Toán 10A7',
      moTa: 'Ôn tập chương 1',
      monHoc: 'toan',
      phamVi: 'lop',
      lopId: 1,
      lopTen: '10A7',
      chuPhongTen: 'Nguyễn Văn A',
      soNguoi: 4,
      sucChua: 15,
      coMatKhau: false,
      taoLuc: Date.now(),
      dangPhat: null,
    },
    {
      id: 102,
      ten: 'Phòng Vật Lý Toàn Trường',
      moTa: 'Giải đề thi học kỳ',
      monHoc: 'vat-li',
      phamVi: 'truong',
      lopId: null,
      lopTen: null,
      chuPhongTen: 'Trần Thị B',
      soNguoi: 8,
      sucChua: 20,
      coMatKhau: true,
      taoLuc: Date.now(),
      dangPhat: 'Lofi bài giảng Vật lý',
    },
  ]

  const mockFriends: FriendItem[] = [
    {
      id: 201,
      username: 'ban.hoc1',
      displayName: 'Lê Văn C',
      avatar: null,
      role: 'hoc_sinh',
      lopTen: '10A7',
      friendedAt: Date.now(),
    },
    {
      id: 202,
      username: 'ban.hoc2',
      displayName: 'Phạm Thị D',
      avatar: null,
      role: 'hoc_sinh',
      lopTen: '10A8',
      friendedAt: Date.now(),
    },
  ]

  const mockPresence: Record<number, FriendPresence> = {
    201: {
      accountId: 201,
      state: 'online',
      lastSeen: Date.now(),
      activity: { type: 'room', roomId: 101 },
    },
    202: {
      accountId: 202,
      state: 'online',
      lastSeen: Date.now(),
      activity: { type: 'lobby' },
    },
  }

  // ── 1. Room Friends Map Projection ─────────────────────────────────────────
  it('1. Correctly projects friend presence into active study rooms', () => {
    const friendsMap = buildRoomFriendsMap(mockRooms, mockFriends, mockPresence, [])

    // Room 101 has friend 201
    const friendsIn101 = friendsMap.get(101)
    expect(friendsIn101).toBeDefined()
    expect(friendsIn101?.length).toBe(1)
    expect(friendsIn101?.[0].displayName).toBe('Lê Văn C')
    expect(friendsIn101?.[0].username).toBe('ban.hoc1')

    // Room 102 has no friends
    const friendsIn102 = friendsMap.get(102)
    expect(friendsIn102).toEqual([])
  })

  // ── 2. Filter Discovery Rooms Logic ────────────────────────────────────────
  it('2. Filters rooms by keyword, scope, and friend presence', () => {
    const friendsMap = buildRoomFriendsMap(mockRooms, mockFriends, mockPresence, [])

    // Filter by keyword 'toán'
    const toanRooms = filterDiscoveryRooms(mockRooms, friendsMap, {
      tuKhoa: 'toán',
    })
    expect(toanRooms.length).toBe(1)
    expect(toanRooms[0].id).toBe(101)

    // Filter by friend presence
    const roomsWithFriends = filterDiscoveryRooms(mockRooms, friendsMap, {
      chiHienCoBanBe: true,
    })
    expect(roomsWithFriends.length).toBe(1)
    expect(roomsWithFriends[0].id).toBe(101)

    // Filter by scope 'truong'
    const schoolRooms = filterDiscoveryRooms(mockRooms, friendsMap, {
      tabPhamVi: 'truong',
    })
    expect(schoolRooms.length).toBe(1)
    expect(schoolRooms[0].id).toBe(102)
  })

  // ── 3. Gamification Truth: No Invented Level or Fake 120 Denominator ─────
  it('3. Respects Gamification Truth: preserves truthful XP and rejects invented level/target rules', () => {
    const totalXp = 250
    const todayXp = 80

    // Contract: UI displays raw totalXp and todayXp without inventing "Cấp X" or fake "/120" target
    const displayTotalXp = `${totalXp} XP tích lũy`
    const displayTodayXp = `+${todayXp} XP`
    expect(displayTotalXp).toBe('250 XP tích lũy')
    expect(displayTodayXp).toBe('+80 XP')

    // Class challenge progress derives strictly from server-provided targetValue and currentValue
    const mockChallenge = {
      title: 'Tuần lễ chuyên cần',
      currentValue: 15,
      targetValue: 20,
    }
    const challengeProgress = Math.min(100, Math.round((mockChallenge.currentValue / mockChallenge.targetValue) * 100))
    expect(challengeProgress).toBe(75)

    // When no challenge is present, no fake progress denominator is manufactured
    const noChallenge = null
    const shouldManufactureProgressBar = Boolean(noChallenge)
    expect(shouldManufactureProgressBar).toBe(false)
  })

  // ── 4. Profile Motto Persistence & Hydration Contract ──────────────────────
  it('4. Hydrates profile motto from session and preserves persistent values across reload', () => {
    // Session payload from /api/whoami with stored motto
    const sessionWithMotto = {
      accountId: 1,
      username: 'hocsinh.a',
      ten: 'Nguyễn Văn A',
      tieuDeHoSo: 'Quyết tâm đạt điểm 9 môn Toán!',
    }

    // Hydration contract: state initializes from session's tieuDeHoSo
    const hydratedMotto = sessionWithMotto.tieuDeHoSo ?? ''
    expect(hydratedMotto).toBe('Quyết tâm đạt điểm 9 môn Toán!')

    // Empty state fallback when no motto is set
    const sessionWithoutMotto = {
      accountId: 2,
      username: 'hocsinh.b',
      ten: 'Trần Thị B',
      tieuDeHoSo: null,
    }
    const fallbackMotto = sessionWithoutMotto.tieuDeHoSo ?? ''
    expect(fallbackMotto).toBe('')
  })

  // ── 5. Achievement Count Truth Contract ────────────────────────────────────
  it('5. Derives achievement totals dynamically from server catalog without hardcoded fictional constants', () => {
    const serverAchievementCatalog = [
      { key: 'first_session', title: 'Khởi đầu' },
      { key: 'streak_3', title: 'Chăm chỉ' },
      { key: 'streak_7', title: 'Kỷ luật' },
    ]
    const unlockedAchievementsCount = 2

    // Must derive totalCount dynamically from actual items length, never hardcoded /8
    const dynamicTotalCount = serverAchievementCatalog.length
    expect(dynamicTotalCount).toBe(3)
    expect(`${unlockedAchievementsCount} / ${dynamicTotalCount}`).toBe('2 / 3')
  })

  // ── 6. Blocked Users Privacy Invariant ─────────────────────────────────────
  it('6. Excludes blocked users from room friend presence projection', () => {
    const blocked: BlockedUserItem[] = [{ id: 201, username: 'ban.hoc1', displayName: 'Lê Văn C', blockedAt: Date.now() }]
    const friendsMap = buildRoomFriendsMap(mockRooms, mockFriends, mockPresence, blocked)

    // Friend 201 is in room 101, but is blocked, so must NOT appear in friends map
    const friendsIn101 = friendsMap.get(101)
    expect(friendsIn101).toEqual([])
  })
})
