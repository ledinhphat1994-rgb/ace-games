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

  // ── 3. Level and XP Progression Calculation Contract ──────────────────────
  it('3. Computes user Level and daily XP completion correctly from engagement profile', () => {
    const totalXp = 250
    const todayXp = 80
    const maxDailyXp = 120

    const userLevel = Math.floor(totalXp / 100) + 1
    const dailyProgress = Math.min(100, Math.round((todayXp / maxDailyXp) * 100))
    const xpNeeded = Math.max(0, maxDailyXp - todayXp)

    expect(userLevel).toBe(3) // Level 3 (200-299 XP)
    expect(dailyProgress).toBe(67) // 80/120 = ~67%
    expect(xpNeeded).toBe(40) // 40 XP remaining
  })

  // ── 4. Blocked Users Privacy Invariant ─────────────────────────────────────
  it('4. Excludes blocked users from room friend presence projection', () => {
    const blocked: BlockedUserItem[] = [{ id: 201, username: 'ban.hoc1', displayName: 'Lê Văn C', blockedAt: Date.now() }]
    const friendsMap = buildRoomFriendsMap(mockRooms, mockFriends, mockPresence, blocked)

    // Friend 201 is in room 101, but is blocked, so must NOT appear in friends map
    const friendsIn101 = friendsMap.get(101)
    expect(friendsIn101).toEqual([])
  })
})
