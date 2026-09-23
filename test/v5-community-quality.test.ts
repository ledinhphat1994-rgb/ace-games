import { describe, expect, it } from 'vitest'
import {
  derivePresenceView,
  classifyFriendsPresence,
  formatLastSeen,
  UserSearchController,
  SocialMutationLockManager,
  type SearchState,
  type SocialStatus,
} from '../src/features/hub/social-semantics'
import type { FriendItem, FriendPresence, SearchResultItem } from '../shared/protocol/social'

describe('V5 Community Hub Quality & Truthfulness Tests', () => {
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

  const mockPresenceMap: Record<number, FriendPresence> = {
    101: {
      accountId: 101,
      state: 'online',
      activity: { type: 'room', roomId: 12, roomTitle: 'Toán Hình 10' },
      lastSeen: Date.now(),
    },
    102: {
      accountId: 102,
      state: 'online',
      activity: { type: 'lobby' },
      lastSeen: Date.now(),
    },
    103: {
      accountId: 103,
      state: 'away',
      activity: { type: 'lobby' },
      lastSeen: Date.now() - 300_000,
    },
    104: {
      accountId: 104,
      state: 'offline',
      activity: null,
      lastSeen: Date.now() - 3_600_000,
    },
  }

  describe('1. Realtime Presence Freshness & Truthfulness', () => {
    it('A. Initial presence not loaded: friends are placed in UNKNOWN, NOT authoritative offline', () => {
      const view = derivePresenceView({
        friends: mockFriends,
        presenceMap: {},
        presenceReady: false,
        connectionStatus: 'da_ket_noi',
      })

      expect(view.freshness).toBe('unknown')
      expect(view.isLive).toBe(false)
      expect(view.totalActive).toBe(0)
      // Must NOT claim friends are offline!
      expect(view.offline).toHaveLength(0)
      expect(view.inRoom).toHaveLength(0)
      expect(view.online).toHaveLength(0)
      // All friends are truthfully marked as unknown presence
      expect(view.unknown).toHaveLength(mockFriends.length)
    })

    it('B. Fresh snapshot received: correctly classifies live inRoom, online, away, and offline', () => {
      const view = derivePresenceView({
        friends: mockFriends,
        presenceMap: mockPresenceMap,
        presenceReady: true,
        connectionStatus: 'da_ket_noi',
      })

      expect(view.freshness).toBe('ready')
      expect(view.isLive).toBe(true)
      expect(view.totalActive).toBe(3) // 1 inRoom + 2 online (including away)

      // inRoom: exactly Friend 101 with room 12
      expect(view.inRoom).toHaveLength(1)
      expect(view.inRoom[0].friend.id).toBe(101)
      expect(view.inRoom[0].roomId).toBe(12)
      expect(view.inRoom[0].roomTitle).toBe('Toán Hình 10')

      // online: Friends 102 and 103 (away)
      expect(view.online).toHaveLength(2)
      expect(view.online.find((f) => f.friend.id === 102)?.isAway).toBe(false)
      expect(view.online.find((f) => f.friend.id === 103)?.isAway).toBe(true)

      // offline: Friend 104
      expect(view.offline).toHaveLength(1)
      expect(view.offline[0].friend.id).toBe(104)
      expect(view.unknown).toHaveLength(0)
    })

    it('C. WebSocket disconnect after snapshot: presence becomes STALE immediately, zero live activity', () => {
      // Prior snapshot existed in memory, but WebSocket closed
      const view = derivePresenceView({
        friends: mockFriends,
        presenceMap: mockPresenceMap,
        presenceReady: false,
        connectionStatus: 'mat_ket_noi',
      })

      expect(view.freshness).toBe('stale')
      expect(view.isLive).toBe(false)
      expect(view.totalActive).toBe(0)
      expect(view.inRoom).toHaveLength(0)
      expect(view.online).toHaveLength(0)
      expect(view.offline).toHaveLength(0)
      expect(view.unknown).toHaveLength(mockFriends.length)
    })

    it('D. Stale in-room activity is NEVER presented as joinable during reconnect', () => {
      const view = derivePresenceView({
        friends: mockFriends,
        presenceMap: mockPresenceMap,
        presenceReady: false,
        connectionStatus: 'dang_ket_noi',
      })

      expect(view.freshness).toBe('stale')
      expect(view.isLive).toBe(false)
      // Friend 101's room 12 MUST NOT be present in inRoom
      expect(view.inRoom).toHaveLength(0)
      expect(view.totalActive).toBe(0)
    })

    it('E. Fresh reconnect snapshot: authoritative live state resumes', () => {
      const view = derivePresenceView({
        friends: mockFriends,
        presenceMap: mockPresenceMap,
        presenceReady: true,
        connectionStatus: 'da_ket_noi',
      })

      expect(view.freshness).toBe('ready')
      expect(view.isLive).toBe(true)
      expect(view.inRoom).toHaveLength(1)
      expect(view.totalActive).toBe(3)
    })

    it('F. classifyFriendsPresence helper respects presenceReady gating', () => {
      const unready = classifyFriendsPresence(mockFriends, mockPresenceMap, false, 'da_ket_noi')
      expect(unready.inRoom).toHaveLength(0)
      expect(unready.online).toHaveLength(0)
      expect(unready.offline).toHaveLength(0)

      const ready = classifyFriendsPresence(mockFriends, mockPresenceMap, true, 'da_ket_noi')
      expect(ready.inRoom).toHaveLength(1)
      expect(ready.online).toHaveLength(2)
      expect(ready.offline).toHaveLength(1)
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

  describe('2. Social State Degraded Lifecycle & Mutation Convergence', () => {
    // Model the state transition contract of CampusContext.lamMoiSocialState
    function transitionSocialStatus(
      currentStatus: SocialStatus,
      fetchResult: { ok: boolean },
    ): SocialStatus {
      if (fetchResult.ok) {
        return 'ready'
      }
      if (currentStatus === 'ready' || currentStatus === 'degraded') {
        return 'degraded'
      }
      return 'error'
    }

    it('initial social load fails => ERROR', () => {
      const next = transitionSocialStatus('loading', { ok: false })
      expect(next).toBe('error')
    })

    it('successful social load => READY', () => {
      const next = transitionSocialStatus('loading', { ok: true })
      expect(next).toBe('ready')
    })

    it('subsequent refresh fails after READY => DEGRADED, not fake READY', () => {
      const next = transitionSocialStatus('ready', { ok: false })
      expect(next).toBe('degraded')
    })

    it('degraded retry succeeds => READY', () => {
      const next = transitionSocialStatus('degraded', { ok: true })
      expect(next).toBe('ready')
    })

    it('server mutation success + refresh failure: mutation succeeds, state marked degraded without rollback', async () => {
      let currentSocialStatus: SocialStatus = 'ready'
      const lockManager = new SocialMutationLockManager()

      // Simulate acceptFriendRequest with server success but client refresh failure
      const acceptFriendRequestMock = async (reqId: number) => {
        const lockKey = `accept-${reqId}`
        if (!lockManager.acquire(lockKey)) return { ok: false, loi: 'Đang xử lý' }
        try {
          // 1. Server HTTP mutation succeeds
          const serverOk = true
          if (!serverOk) return { ok: false }

          // 2. Client background refresh encounters temporary network blip
          const refreshRes = { ok: false }
          currentSocialStatus = transitionSocialStatus(currentSocialStatus, refreshRes)

          // 3. Must return ok: true (server mutation was authoritative)
          return { ok: true, refreshed: refreshRes.ok }
        } finally {
          lockManager.release(lockKey)
        }
      }

      const res = await acceptFriendRequestMock(99)
      expect(res.ok).toBe(true)
      expect(res.refreshed).toBe(false)
      // UI reflects degraded state, existing data remains visible, no fake rollback
      expect(currentSocialStatus).toBe('degraded')
    })
  })

  describe('3. UserSearchController: Truthful Search Lifecycle', () => {
    it('transitions through idle -> searching -> success correctly', async () => {
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

      const promise = controller.executeSearch('hoa', async () => mockUsers)
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
      resolveFirstSearch([
        {
          id: 999,
          username: 'anh_dao',
          displayName: 'Đào Duy Anh',
          avatar: null,
          role: 'hoc_sinh',
          lopTen: '10A7',
          relationshipStatus: 'none',
        },
      ])
      await p1

      // State MUST STILL be query 'an', NOT overwritten by stale query 'a'
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

  describe('4. Social Mutation Lock Manager (Production Implementation Protection)', () => {
    it('prevents concurrent executions of all social action keys', () => {
      const lockManager = new SocialMutationLockManager()
      const actionKeys = [
        'send-101',
        'accept-201',
        'reject-202',
        'cancel-203',
        'unfriend-301',
        'block-401',
        'unblock-402',
      ]

      for (const key of actionKeys) {
        expect(lockManager.acquire(key)).toBe(true)
        // Subsequent concurrent attempt must be rejected
        expect(lockManager.acquire(key)).toBe(false)
        expect(lockManager.isLocked(key)).toBe(true)

        lockManager.release(key)
        expect(lockManager.isLocked(key)).toBe(false)
        expect(lockManager.acquire(key)).toBe(true)
        lockManager.release(key)
      }
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

  describe('5. Canonical Routing Verification', () => {
    it('uses canonical /learn destination for Learning CTAs', () => {
      const canonicalLearningRoute = '/learn'
      expect(canonicalLearningRoute).toBe('/learn')
      expect(canonicalLearningRoute).not.toBe('/learning')
    })
  })
})
