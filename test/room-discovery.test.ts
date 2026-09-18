import { describe, expect, it } from 'vitest'
import type { PhongSanh } from '../shared/protocol/campus'
import type { BlockedUserItem, FriendItem, FriendPresence } from '../shared/protocol/social'
import {
  buildRoomFriendsMap,
  filterDiscoveryRooms,
  sortDiscoveryRooms,
} from '../src/features/hub/room-discovery'

function createRoom(id: number, ten: string, soNguoi = 0, phamVi: 'truong' | 'lop' = 'truong', lopId: number | null = null, taoLuc = 1000): PhongSanh {
  return {
    id,
    ten,
    moTa: 'Mô tả phòng',
    monHoc: 'toan',
    phamVi,
    lopId,
    lopTen: lopId ? `Lớp ${lopId}` : null,
    chuPhongTen: 'Chủ phòng A',
    coMatKhau: false,
    sucChua: 10,
    soNguoi,
    dangPhat: null,
    taoLuc,
  }
}

function createFriend(id: number, username: string, displayName: string): FriendItem {
  return {
    id,
    username,
    displayName,
    avatar: null,
    role: 'hoc_sinh',
    lopTen: '10A7',
    friendedAt: Date.now(),
  }
}

describe('Activity / Room Discovery v1 — Pure Projection & Ordering', () => {
  const room1 = createRoom(1, 'Phòng Toán Đại Số', 2, 'truong', null, 100)
  const room2 = createRoom(2, 'Phòng Hình Học', 0, 'truong', null, 200)
  const room3 = createRoom(3, 'Phòng Tiếng Anh 10A7', 1, 'lop', 7, 300)

  const friendA = createFriend(101, 'friend_a', 'An Nguyễn')
  const friendB = createFriend(102, 'friend_b', 'Bình Trần')
  const friendC = createFriend(103, 'friend_c', 'Cường Lê')

  it('friend in room -> mapped exactly once', () => {
    const presenceMap: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1, roomTitle: 'Phòng Toán Đại Số' },
      },
    }

    const map = buildRoomFriendsMap([room1, room2], [friendA], presenceMap)
    const friendsInRoom1 = map.get(1)
    expect(friendsInRoom1).toHaveLength(1)
    expect(friendsInRoom1?.[0].id).toBe(101)
    expect(friendsInRoom1?.[0].displayName).toBe('An Nguyễn')

    expect(map.get(2)).toHaveLength(0)
  })

  it('multiple friends in same room -> mapped together, deterministically sorted, no duplicates', () => {
    const presenceMap: Record<number, FriendPresence> = {
      102: {
        accountId: 102,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1 },
      },
      101: {
        accountId: 101,
        state: 'away',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1 },
      },
      103: {
        accountId: 103,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1 },
      },
    }

    const map = buildRoomFriendsMap([room1], [friendB, friendA, friendC], presenceMap)
    const inRoom1 = map.get(1) ?? []
    expect(inRoom1).toHaveLength(3)
    // Deterministic sort by displayName (An -> Bình -> Cường)
    expect(inRoom1.map((f) => f.displayName)).toEqual(['An Nguyễn', 'Bình Trần', 'Cường Lê'])
  })

  it('friend changes rooms -> mapped to new room and removed from old room', () => {
    const initialPresence: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1 },
      },
    }
    const map1 = buildRoomFriendsMap([room1, room2], [friendA], initialPresence)
    expect(map1.get(1)).toHaveLength(1)
    expect(map1.get(2)).toHaveLength(0)

    // Friend A moves to room 2
    const updatedPresence: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 2 },
      },
    }
    const map2 = buildRoomFriendsMap([room1, room2], [friendA], updatedPresence)
    expect(map2.get(1)).toHaveLength(0)
    expect(map2.get(2)).toHaveLength(1)
    expect(map2.get(2)?.[0].id).toBe(101)
  })

  it('offline friend -> removed / excluded from projection map', () => {
    const offlinePresence: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'offline',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1 },
      },
    }
    const map = buildRoomFriendsMap([room1], [friendA], offlinePresence)
    expect(map.get(1)).toHaveLength(0)
  })

  it('blocked / unfriended friend -> removed from projection map', () => {
    const presenceMap: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1 },
      },
      102: {
        accountId: 102,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 1 },
      },
    }
    const blocked: BlockedUserItem[] = [
      { id: 101, username: 'friend_a', displayName: 'An Nguyễn', blockedAt: Date.now() },
    ]

    // 101 is in friends list, but also in blocked -> MUST be excluded
    // 102 is NOT in friends list (unfriended) -> MUST be excluded
    const map = buildRoomFriendsMap([room1], [friendA], presenceMap, blocked)
    expect(map.get(1)).toHaveLength(0)
  })

  it('unknown / stale roomId in presence -> safely ignored', () => {
    const presenceMap: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'room', roomId: 99999 }, // room does not exist
      },
    }
    const map = buildRoomFriendsMap([room1, room2], [friendA], presenceMap)
    expect(map.get(1)).toHaveLength(0)
    expect(map.get(2)).toHaveLength(0)
    expect(map.has(99999)).toBe(false)
  })

  it('non-room activity (lobby / null) -> ignored', () => {
    const presenceMap: Record<number, FriendPresence> = {
      101: {
        accountId: 101,
        state: 'online',
        lastSeen: Date.now(),
        activity: { type: 'lobby' },
      },
      102: {
        accountId: 102,
        state: 'online',
        lastSeen: Date.now(),
        activity: null,
      },
    }
    const map = buildRoomFriendsMap([room1], [friendA, friendB], presenceMap)
    expect(map.get(1)).toHaveLength(0)
  })

  describe('Discovery Ordering', () => {
    it('sorts rooms: friends first -> active non-empty -> empty rooms', () => {
      const roomEmpty = createRoom(10, 'Phòng Trống', 0, 'truong', null, 500)
      const roomActive = createRoom(20, 'Phòng Đang Học', 3, 'truong', null, 400)
      const roomWithFriend = createRoom(30, 'Phòng Có Bạn', 1, 'truong', null, 300)

      const friendMap = new Map([
        [10, []],
        [20, []],
        [30, [{ id: 101, displayName: 'An', username: 'an', avatar: null }]],
      ])

      const sorted = sortDiscoveryRooms([roomEmpty, roomActive, roomWithFriend], friendMap)
      expect(sorted.map((r) => r.id)).toEqual([30, 20, 10])
    })

    it('tie-breaker: more friends first within priority 1', () => {
      const room1Friend = createRoom(1, 'Phòng 1 Bạn', 2, 'truong', null, 100)
      const room2Friends = createRoom(2, 'Phòng 2 Bạn', 2, 'truong', null, 100)

      const friendMap = new Map([
        [1, [{ id: 101, displayName: 'An', username: 'an', avatar: null }]],
        [
          2,
          [
            { id: 102, displayName: 'Bình', username: 'binh', avatar: null },
            { id: 103, displayName: 'Cường', username: 'cuong', avatar: null },
          ],
        ],
      ])

      const sorted = sortDiscoveryRooms([room1Friend, room2Friends], friendMap)
      expect(sorted.map((r) => r.id)).toEqual([2, 1])
    })
  })

  describe('Discovery Filtering', () => {
    const friendMap = new Map([
      [1, [{ id: 101, displayName: 'An', username: 'an', avatar: null }]],
      [2, []],
      [3, []],
    ])

    it('chiHienCoBanBe = true -> only returns rooms with visible friends', () => {
      const filtered = filterDiscoveryRooms([room1, room2, room3], friendMap, {
        chiHienCoBanBe: true,
      })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe(1)
    })

    it('chiHienCoBanBe composes with scope filter and keyword search', () => {
      // Room 1 matches chiHienCoBanBe and tabPhamVi='truong'
      const res1 = filterDiscoveryRooms([room1, room2, room3], friendMap, {
        chiHienCoBanBe: true,
        tabPhamVi: 'truong',
      })
      expect(res1).toHaveLength(1)
      expect(res1[0].id).toBe(1)

      // Room 1 is 'truong', searching with tabPhamVi='lop' should return empty
      const res2 = filterDiscoveryRooms([room1, room2, room3], friendMap, {
        chiHienCoBanBe: true,
        tabPhamVi: 'lop',
        userLopId: 7,
      })
      expect(res2).toHaveLength(0)

      // Search keyword matching
      const res3 = filterDiscoveryRooms([room1, room2, room3], friendMap, {
        chiHienCoBanBe: true,
        tuKhoa: 'Đại Số',
      })
      expect(res3).toHaveLength(1)

      const res4 = filterDiscoveryRooms([room1, room2, room3], friendMap, {
        chiHienCoBanBe: true,
        tuKhoa: 'Không Tồn Tại',
      })
      expect(res4).toHaveLength(0)
    })
  })
})
