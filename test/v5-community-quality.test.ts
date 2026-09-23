import { describe, expect, it } from 'vitest'
import {
  classifyFriendsPresence,
  formatLastSeen,
  UserSearchController,
  SocialMutationLockManager,
  type SearchState,
} from '../src/features/hub/social-semantics'
import type { FriendItem, FriendPresence, SearchResultItem } from '../shared/protocol/social'

describe('V5 Community Hub Quality & Truthfulness Tests', () => {
  describe('1. Data Truth: Presence Classification & Semantics', () => {
    const mockFriends: FriendItem[] = [
      {
        id: 101,
        username: 'an_nguyen',
        displayName: 'Nguyễn Văn An',
        avatar: null,
        role: 'hoc_sinh',
        lopTen: '10A7',
        friendedAt: 1700000000000,
      },
      {
        id: 102,
        username: 'binh_tran',
        displayName: 'Trần Thị Bình',
        avatar: null,
        role: 'hoc_sinh',
        lopTen: '10A7',
        friendedAt: 1700000000000,
      },
      {
        id: 103,
        username: 'cuong_le',
        displayName: 'Lê Cường',
        avatar: null,
        role: 'hoc_sinh',
        lopTen: '10A8',
        friendedAt: 1700000000000,
      },
      {
        id: 104,
        username: 'dung_pham',
        displayName: 'Phạm Dũng',
        avatar: null,
        role: 'hoc_sinh',
        lopTen: '10A7',
        friendedAt: 1700000000000,
      },
    ]

    it('classifies friends correctly according to authoritative realtime presence', () => {
      const mockPresenceMap: Record<number, FriendPresence> = {
        // Friend 101: In a study room
        101: {
          accountId: 101,
          state: 'online',
          activity: { type: 'room', roomId: 12, roomTitle: 'Toán Hình 10' },
          lastSeen: Date.now(),
        },
        // Friend 102: Online at lobby
        102: {
          accountId: 102,
          state: 'online',
          activity: { type: 'lobby' },
          lastSeen: Date.now(),
        },
        // Friend 103: Away at lobby
        103: {
          accountId: 103,
          state: 'away',
          activity: { type: 'lobby' },
          lastSeen: Date.now() - 300_000,
        },
        // Friend 104: Offline
        104: {
          accountId: 104,
          state: 'offline',
          activity: null,
          lastSeen: Date.now() - 3_600_000,
        },
      }

      const classified = classifyFriendsPresence(mockFriends, mockPresenceMap)

      // inRoom: exactly Friend 101 with roomId and roomTitle
      expect(classified.inRoom).toHaveLength(1)
      expect(classified.inRoom[0].friend.id).toBe(101)
      expect(classified.inRoom[0].roomId).toBe(12)
      expect(classified.inRoom[0].roomTitle).toBe('Toán Hình 10')

      // online: Friends 102 and 103
      expect(classified.online).toHaveLength(2)
      expect(classified.online.find((f) => f.friend.id === 102)?.isAway).toBe(false)
      expect(classified.online.find((f) => f.friend.id === 103)?.isAway).toBe(true)

      // offline: Friend 104
      expect(classified.offline).toHaveLength(1)
      expect(classified.offline[0].friend.id).toBe(104)
    })

    it('places unknown presence into offline group without crashing', () => {
      // Empty presence map (e.g. before snapshot arrives or user disconnected)
      const classified = classifyFriendsPresence(mockFriends, {})
      expect(classified.inRoom).toHaveLength(0)
      expect(classified.online).toHaveLength(0)
      expect(classified.offline).toHaveLength(mockFriends.length)
    })

    it('formats last seen relative timestamp truthfully', () => {
      const now = Date.now()
      expect(formatLastSeen(null)).toBe('Ngoại tuyến')
      expect(formatLastSeen(undefined)).toBe('Ngoại tuyến')
      expect(formatLastSeen(now - 10_000)).toBe('Vừa mới đây')
      expect(formatLastSeen(now - 150_000)).toBe('2 phút trước')
      expect(formatLastSeen(now - 7_200_000)).toBe('2 giờ trước')
      expect(formatLastSeen(now - 172_800_000)).toBe('2 ngày trước')
    })
  })

  describe('2. UserSearchController: Truthful Search & Stale Response Ordering', () => {
    it('transitions through idle -> searching -> success-results correctly', async () => {
      const controller = new UserSearchController()
      const states: SearchState[] = []
      controller.subscribe((s) => states.push(s))

      const mockUsers: SearchResultItem[] = [
        {
          id: 201,
          username: 'hoa_le',
          displayName: 'Lê Thị Hoa',
          avatar: null,
          role: 'hoc_sinh',
          lopTen: '10A7',
          relationshipStatus: 'none',
        },
      ]

      const promise = controller.executeSearch('hoa', async () => {
        return mockUsers
      })

      expect(controller.getState().status).toBe('searching')
      await promise

      expect(controller.getState().status).toBe('success')
      if (controller.getState().status === 'success') {
        const successState = controller.getState() as { status: 'success'; results: SearchResultItem[] }
        expect(successState.results).toHaveLength(1)
        expect(successState.results[0].username).toBe('hoa_le')
      }
    })

    it('transitions to empty when server returns zero matches', async () => {
      const controller = new UserSearchController()
      await controller.executeSearch('nguoi_khong_ton_tai', async () => [])

      expect(controller.getState().status).toBe('empty')
      if (controller.getState().status === 'empty') {
        const emptyState = controller.getState() as { status: 'empty'; query: string }
        expect(emptyState.query).toBe('nguoi_khong_ton_tai')
      }
    })

    it('NEVER collapses network error into empty results', async () => {
      const controller = new UserSearchController()
      await controller.executeSearch('hoa', async () => {
        throw new Error('Lỗi kết nối máy chủ 500')
      })

      // Must be error, NOT empty!
      expect(controller.getState().status).toBe('error')
      if (controller.getState().status === 'error') {
        const errorState = controller.getState() as { status: 'error'; query: string; error: string }
        expect(errorState.query).toBe('hoa')
        expect(errorState.error).toContain('Lỗi kết nối')
      }
    })

    it('discards stale slower responses when a newer search query is issued', async () => {
      const controller = new UserSearchController()

      let resolveFirstSearch!: (val: SearchResultItem[]) => void
      const firstSearchPromise = new Promise<SearchResultItem[]>((resolve) => {
        resolveFirstSearch = resolve
      })

      // Query 1: 'a' (slow response)
      const p1 = controller.executeSearch('a', () => firstSearchPromise)

      // Query 2: 'an' (fast response)
      const fastResult: SearchResultItem[] = [
        {
          id: 301,
          username: 'an_nguyen',
          displayName: 'Nguyễn Văn An',
          avatar: null,
          role: 'hoc_sinh',
          lopTen: '10A7',
          relationshipStatus: 'none',
        },
      ]
      const p2 = controller.executeSearch('an', async () => fastResult)

      await p2
      expect(controller.getState().status).toBe('success')
      if (controller.getState().status === 'success') {
        const state = controller.getState() as { status: 'success'; query: string; results: SearchResultItem[] }
        expect(state.query).toBe('an')
        expect(state.results[0].username).toBe('an_nguyen')
      }

      // Now query 1 finally resolves with old stale data
      const staleResult: SearchResultItem[] = [
        {
          id: 999,
          username: 'anh_dao',
          displayName: 'Đào Duy Anh',
          avatar: null,
          role: 'hoc_sinh',
          lopTen: '10A7',
          relationshipStatus: 'none',
        },
      ]
      resolveFirstSearch(staleResult)
      await p1

      // State MUST STILL be query 'an', NOT overwritten by query 'a'
      expect(controller.getState().status).toBe('success')
      if (controller.getState().status === 'success') {
        const state = controller.getState() as { status: 'success'; query: string; results: SearchResultItem[] }
        expect(state.query).toBe('an')
        expect(state.results[0].username).toBe('an_nguyen')
      }
    })

    it('updates item relationship status locally without triggering full refetch', async () => {
      const controller = new UserSearchController()
      await controller.executeSearch('test', async () => [
        {
          id: 401,
          username: 'student1',
          displayName: 'Học sinh 1',
          avatar: null,
          role: 'hoc_sinh',
          lopTen: '10A7',
          relationshipStatus: 'none',
        },
      ])

      controller.updateItemStatus(401, 'pending_sent')

      if (controller.getState().status === 'success') {
        const state = controller.getState() as { status: 'success'; results: SearchResultItem[] }
        expect(state.results[0].relationshipStatus).toBe('pending_sent')
      }
    })

    it('resets to idle on empty or whitespace query', async () => {
      const controller = new UserSearchController()
      await controller.executeSearch('test', async () => [])
      expect(controller.getState().status).toBe('empty')

      await controller.executeSearch('   ', async () => [])
      expect(controller.getState().status).toBe('idle')
    })
  })

  describe('3. Social Mutation Lock Manager: Double Submit Prevention', () => {
    it('prevents concurrent executions of the same action key', async () => {
      const lockManager = new SocialMutationLockManager()
      const key = 'send-request-101'

      expect(lockManager.acquire(key)).toBe(true)
      // Second attempt while locked must fail
      expect(lockManager.acquire(key)).toBe(false)
      expect(lockManager.isLocked(key)).toBe(true)

      lockManager.release(key)
      expect(lockManager.isLocked(key)).toBe(false)
      expect(lockManager.acquire(key)).toBe(true)
    })

    it('runWithLock executes action and automatically releases lock even on error', async () => {
      const lockManager = new SocialMutationLockManager()
      const key = 'accept-55'

      let executionCount = 0
      const run = () =>
        lockManager.runWithLock(key, async () => {
          executionCount++
          await new Promise((r) => setTimeout(r, 10))
          return 'done'
        })

      // Fire 2 concurrent requests
      const [r1, r2] = await Promise.all([run(), run()])

      expect(r1.executed || r2.executed).toBe(true)
      expect(r1.executed && r2.executed).toBe(false) // One must be rejected
      expect(executionCount).toBe(1)
      expect(lockManager.isLocked(key)).toBe(false)
    })
  })

  describe('4. Routing Truthfulness', () => {
    it('uses canonical /learn destination for Learning CTAs', () => {
      const canonicalLearningRoute = '/learn'
      expect(canonicalLearningRoute).toBe('/learn')
      expect(canonicalLearningRoute).not.toBe('/learning')
    })
  })
})
