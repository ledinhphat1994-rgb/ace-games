// test/v4-learning-quality.test.ts
// Digital Campus v2: Milestone V4 — Learning Experience & Functional Quality Contracts

import { describe, expect, it, vi } from 'vitest'
import {
  LEARNING_OCCUPANCY_METRIC_CONFIG,
  LEARNING_SUBJECTS,
  matchRoomSubject,
  deriveChallengeProgress,
} from '../src/features/hub/learning-semantics'
import { deriveProgressState, type ProgressDataResponse } from '../src/components/progress/progress-state'
import {
  QuickStartSubmissionLock,
  quickStartLock,
} from '../src/features/hub/components/learning/quick-start-controller'
import type { PhongSanh } from '../shared/protocol/campus'
import type { ClassChallenge } from '../shared/protocol/engagement'

describe('V4 Learning Experience & Functional Quality Contracts', () => {
  // ── 1. Learning Occupancy Invariant ─────────────────────────────────────────
  it('1. LEARNING_OCCUPANCY_METRIC_CONFIG preserves truthful labels', () => {
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.headerLabel).toBe('Đang tham gia')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.subLabel).toBe('Lượt trong phòng')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.prohibitedLabel).toBe('Học sinh online')
  })

  // ── 2. LearningHeader Truthful Progress State Contracts ─────────────────────
  describe('2. LearningHeader Progress Truthfulness (deriveProgressState)', () => {
    it('A. LearningHeader authoritative zero: legitimate 0 streak and 0 XP renders success state, not error', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: false,
        data: {
          ok: true,
          profile: {
            accountId: 1,
            totalXp: 0,
            todayXp: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastStudyDate: null,
            unlockedAchievementsCount: 0,
            updatedAt: 1700000000000,
          },
        },
      })

      expect(state.type).toBe('success')
      if (state.type === 'success') {
        expect(state.currentStreak).toBe(0)
        expect(state.todayXp).toBe(0)
      }
    })

    it('B. LearningHeader authoritative non-zero: renders exact positive streak and XP', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: false,
        data: {
          ok: true,
          profile: {
            accountId: 2,
            totalXp: 450,
            todayXp: 35,
            currentStreak: 7,
            longestStreak: 12,
            lastStudyDate: '2026-09-23',
            unlockedAchievementsCount: 3,
            updatedAt: 1700000000000,
          },
        },
      })

      expect(state.type).toBe('success')
      if (state.type === 'success') {
        expect(state.currentStreak).toBe(7)
        expect(state.todayXp).toBe(35)
      }
    })

    it('C. LearningHeader API error: HTTP or network failure results in type="error", NEVER false zeros', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: true,
        error: new Error('Network timeout'),
        data: null,
      })

      expect(state.type).toBe('error')
      if (state.type === 'error') {
        expect(state.message).toContain('Network timeout')
      }
    })

    it('D. LearningHeader JSON ok:false: API returning 200 with ok=false results in type="error"', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: false,
        data: {
          ok: false,
          loi: 'Phiên đăng nhập đã hết hạn',
        },
      })

      expect(state.type).toBe('error')
      if (state.type === 'error') {
        expect(state.message).toContain('Phiên đăng nhập đã hết hạn')
      }
    })

    it('D2. LearningHeader missing profile: ok=true but missing profile payload results in type="error"', () => {
      const state = deriveProgressState({
        isLoading: false,
        isError: false,
        data: {
          ok: true,
        } as ProgressDataResponse,
      })

      expect(state.type).toBe('error')
    })
  })

  // ── 3. Challenge & Leaderboard API Body Failure Contracts ───────────────────
  describe('3. Challenge & Leaderboard Error vs Empty Contracts', () => {
    it('E. Challenge HTTP/body failure: ok=false in response throws and flags error, not empty', async () => {
      const parseChallengeResponse = (json: unknown) => {
        const payload = json as { ok?: boolean; loi?: string; challenge?: unknown }
        if (!payload || payload.ok !== true) {
          throw new Error(payload?.loi || 'Không thể tải thử thách học tập của lớp.')
        }
        return payload
      }

      // Valid failure payload:
      expect(() => parseChallengeResponse({ ok: false, loi: 'Lỗi máy chủ D1' })).toThrow('Lỗi máy chủ D1')
      // Malformed / empty object without ok:true
      expect(() => parseChallengeResponse({})).toThrow('Không thể tải thử thách học tập của lớp.')

      // Legitimate empty challenge must have ok:true with challenge: null
      const validEmpty = parseChallengeResponse({ ok: true, challenge: null })
      expect(validEmpty.ok).toBe(true)
      expect(validEmpty.challenge).toBeNull()
    })

    it('F. Leaderboard HTTP/body failure: ok=false in response throws and flags error, not empty', async () => {
      const parseLeaderboardResponse = (json: unknown) => {
        const payload = json as { ok?: boolean; loi?: string; items?: unknown }
        if (!payload || payload.ok === false || !Array.isArray(payload.items)) {
          throw new Error(payload?.loi || 'Không thể tải bảng thi đua tuần của lớp.')
        }
        return payload
      }

      // Valid failure payload:
      expect(() => parseLeaderboardResponse({ ok: false, loi: 'Bảng thi đua tạm ngưng' })).toThrow('Bảng thi đua tạm ngưng')
      // Missing items array:
      expect(() => parseLeaderboardResponse({ ok: true })).toThrow('Không thể tải bảng thi đua tuần của lớp.')

      // Legitimate empty leaderboard: ok=true with items: []
      const validEmpty = parseLeaderboardResponse({ ok: true, items: [] })
      expect(validEmpty.ok).toBe(true)
      expect(validEmpty.items).toEqual([])
    })
  })

  // ── 4. Subject Definitions Integrity & Matching ─────────────────────────────
  describe('4. Subject Definitions & Matching Semantics', () => {
    it('G. All subject definitions exist and IDs are unique (10 standard subjects + tat_ca)', () => {
      expect(LEARNING_SUBJECTS.length).toBe(11) // 1 'tat_ca' + 10 academic subjects

      const ids = new Set<string>()
      for (const subj of LEARNING_SUBJECTS) {
        expect(ids.has(subj.id)).toBe(false)
        ids.add(subj.id)
        expect(subj.label.length).toBeGreaterThan(0)
        expect(subj.shortLabel.length).toBeGreaterThan(0)
      }

      const expectedSubjects = [
        'tat_ca',
        'toan',
        'ngu-van',
        'tieng-anh',
        'vat-li',
        'hoa-hoc',
        'sinh-hoc',
        'lich-su',
        'dia-li',
        'tin-hoc',
        'gdcd',
      ]
      for (const exp of expectedSubjects) {
        expect(ids.has(exp)).toBe(true)
      }
    })

    const baseRoom: PhongSanh = {
      id: 1,
      ten: 'Phòng học',
      moTa: 'Phòng học chung',
      monHoc: null,
      soNguoi: 2,
      sucChua: 10,
      phamVi: 'truong',
      lopId: null,
      lopTen: null,
      coMatKhau: false,
      chuPhongTen: 'Nguyễn Văn A',
      dangPhat: null,
      taoLuc: 1700000000000,
    }

    it('H. Missing subjects matcher coverage: Sinh, Sử, Địa, GDCD match valid queries', () => {
      // 1. Sinh học
      expect(matchRoomSubject({ ...baseRoom, ten: 'Chuyên đề Sinh học 10 tế bào' }, 'sinh-hoc')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, moTa: 'Ôn tập Biology kỳ 1' }, 'sinh-hoc')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, ten: 'Phòng tự học môn sinh' }, 'sinh-hoc')).toBe(true)

      // 2. Lịch sử
      expect(matchRoomSubject({ ...baseRoom, ten: 'Lịch sử Việt Nam thế kỷ 20' }, 'lich-su')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, moTa: 'History review for midterms' }, 'lich-su')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, ten: 'Ôn tập môn sử' }, 'lich-su')).toBe(true)

      // 3. Địa lí
      expect(matchRoomSubject({ ...baseRoom, ten: 'Địa lí tự nhiên Việt Nam' }, 'dia-li')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, moTa: 'Bài tập Địa lý 10' }, 'dia-li')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, ten: 'Geography study group' }, 'dia-li')).toBe(true)

      // 4. GDCD / GDKT&PL
      expect(matchRoomSubject({ ...baseRoom, ten: 'Giáo dục kinh tế và pháp luật 10' }, 'gdcd')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, moTa: 'Ôn tập môn GDCD' }, 'gdcd')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, ten: 'Quyền và nghĩa vụ công dân' }, 'gdcd')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, ten: 'Chuyên đề GDKT&PL' }, 'gdcd')).toBe(true)
    })

    it('I. Keyword false-positive protection: guarded tokens avoid accidental matches', () => {
      // "sử dụng" does NOT match Lịch sử
      expect(matchRoomSubject({ ...baseRoom, ten: 'Hướng dẫn sử dụng phần mềm phòng học' }, 'lich-su')).toBe(false)

      // "học sinh" does NOT match Sinh học
      expect(matchRoomSubject({ ...baseRoom, ten: 'Danh sách học sinh lớp 10A7 ôn bài' }, 'sinh-hoc')).toBe(false)
      expect(matchRoomSubject({ ...baseRoom, moTa: 'Dành cho toàn bộ học sinh trong trường' }, 'sinh-hoc')).toBe(false)

      // "xử lý" or "quản lý" does NOT match Vật lí
      expect(matchRoomSubject({ ...baseRoom, ten: 'Quy trình xử lý tài liệu học tập' }, 'vat-li')).toBe(false)
      expect(matchRoomSubject({ ...baseRoom, ten: 'Ban quản lý lớp trực tuần' }, 'vat-li')).toBe(false)

      // "văn phòng" does NOT match Ngữ văn
      expect(matchRoomSubject({ ...baseRoom, ten: 'Trực văn phòng đoàn trường' }, 'ngu-van')).toBe(false)

      // "tự tin" does NOT match Tin học
      expect(matchRoomSubject({ ...baseRoom, ten: 'Rèn luyện sự tự tin khi thuyết trình' }, 'tin-hoc')).toBe(false)
    })

    it('I2. Explicit room.monHoc has higher authority than keyword matching', () => {
      // Room named "Toán" but explicitly tagged as "ngu-van"
      const crossRoom: PhongSanh = { ...baseRoom, ten: 'Toán học và thơ ca', monHoc: 'ngu-van' }
      expect(matchRoomSubject(crossRoom, 'ngu-van')).toBe(true)
      expect(matchRoomSubject(crossRoom, 'toan')).toBe(false)
    })
  })

  // ── 5. QuickStart In-flight Guard Against Double Submission ─────────────────
  describe('5. QuickStart Mutation Double Submission Guard (QuickStartSubmissionLock)', () => {
    it('J. Regression: Invariant AT MOST ONE POST /api/rooms while pending, closing/reopening dialog does NOT reset lock', async () => {
      const lock = new QuickStartSubmissionLock()
      let postCallCount = 0
      let rejectPost1: (err: unknown) => void = () => {}

      const pendingPromise = new Promise((_resolve, reject) => {
        rejectPost1 = reject
      })

      const mockFetchRooms = vi.fn().mockImplementation(() => {
        postCallCount++
        return pendingPromise
      })

      let modalOpen = true
      const setModalOpen = (open: boolean) => {
        modalOpen = open
      }

      // Step 1: User clicks Quick Start submit -> POST #1 begins and remains pending
      const execution1Promise = lock.execute(
        () => mockFetchRooms(),
        {
          onSuccess: () => { modalOpen = false },
          onError: () => {},
        }
      )

      expect(lock.isInFlight()).toBe(true)
      expect(lock.canDismiss()).toBe(false)
      expect(postCallCount).toBe(1)

      // Step 2: User attempts to close modal via X / ESC / overlay / Cancel button
      const dismissAllowed = lock.handleOpenChange(false, setModalOpen)
      expect(dismissAllowed).toBe(false)
      expect(modalOpen).toBe(true) // Modal dismissal is blocked
      expect(lock.isInFlight()).toBe(true) // In-flight lock is NEVER cleared by close attempt!

      // Step 3: Even if modal were somehow visually closed externally and then reopened
      modalOpen = false
      expect(lock.isInFlight()).toBe(true) // Lock strictly persists!

      // Reopening modal
      lock.handleOpenChange(true, setModalOpen)
      expect(modalOpen).toBe(true)
      expect(lock.isInFlight()).toBe(true)

      // Step 4: User clicks submit again before POST #1 settles
      const execution2Result = await lock.execute(
        () => mockFetchRooms(),
        {
          onSuccess: () => {},
          onError: () => {},
        }
      )

      // Assert Invariant: AT MOST ONE POST /api/rooms until request settles
      expect(execution2Result.executed).toBe(false)
      expect(postCallCount).toBe(1)
      expect(mockFetchRooms).toHaveBeenCalledTimes(1)

      // Step 5: POST #1 fails (rejects with network error)
      rejectPost1(new Error('Mạng bị gián đoạn khi kết nối D1'))
      const execution1Result = await execution1Promise

      expect(execution1Result.executed).toBe(true)
      expect(execution1Result.error).toBeDefined()
      expect(lock.isInFlight()).toBe(false) // Lock is ONLY released after the request settles
      expect(lock.canDismiss()).toBe(true)

      // Step 6: On failure, retry becomes possible; second attempt after settle is allowed
      const mockPostRetry = vi.fn().mockResolvedValue({ ok: true, room: { id: 202 } })
      const retryResult = await lock.execute(
        () => mockPostRetry(),
        {
          onSuccess: () => { modalOpen = false },
          onError: () => {},
        }
      )

      expect(retryResult.executed).toBe(true)
      expect(mockPostRetry).toHaveBeenCalledTimes(1)
      expect(modalOpen).toBe(false)
    })

    it('J2. Success Lifecycle: Success triggers callbacks exactly once, closes modal, and settles cleanly', async () => {
      const lock = new QuickStartSubmissionLock()
      let postCallCount = 0
      let modalOpen = true
      let navigatedRoomId: number | null = null

      const mockSuccessFetch = vi.fn().mockImplementation(async () => {
        postCallCount++
        return { ok: true, room: { id: 777, ten: 'Phòng học 10A7' } }
      })

      const result = await lock.execute(
        () => mockSuccessFetch(),
        {
          onSuccess: (data: { room: { id: number } }) => {
            navigatedRoomId = data.room.id
            modalOpen = false
          },
          onError: () => {},
        }
      )

      expect(result.executed).toBe(true)
      expect(postCallCount).toBe(1)
      expect(navigatedRoomId).toBe(777)
      expect(modalOpen).toBe(false)
      expect(lock.isInFlight()).toBe(false)
      expect(lock.canDismiss()).toBe(true)
    })

    it('J3. Rapid Concurrent Clicks: Promise.all simultaneous calls drop duplicate execution', async () => {
      const lock = new QuickStartSubmissionLock()
      let callCount = 0
      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++
        await new Promise((r) => setTimeout(r, 20))
        return { ok: true, room: { id: 999 } }
      })

      const [res1, res2] = await Promise.all([
        lock.execute(() => mockFetch(), { onSuccess: () => {}, onError: () => {} }),
        lock.execute(() => mockFetch(), { onSuccess: () => {}, onError: () => {} }),
      ])

      expect(res1.executed).toBe(true)
      expect(res2.executed).toBe(false)
      expect(callCount).toBe(1)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('J4. Module singleton quickStartLock preserves lock state across callers', () => {
      expect(quickStartLock).toBeInstanceOf(QuickStartSubmissionLock)
      expect(quickStartLock.isInFlight()).toBe(false)
      expect(quickStartLock.canDismiss()).toBe(true)
    })
  })

  // ── 6. Class Challenge Progress Derivation ──────────────────────────────────
  describe('6. Class Challenge Progress Derivation (deriveChallengeProgress)', () => {
    it('A. Null/undefined challenge returns clean zero defaults', () => {
      const result = deriveChallengeProgress(null)
      expect(result).toEqual({
        percent: 0,
        isCompleted: false,
        displayCurrent: '0',
        displayTarget: '0',
        summaryText: 'Chưa có thử thách tuần',
      })

      const resultUndef = deriveChallengeProgress(undefined)
      expect(resultUndef.percent).toBe(0)
    })

    it('B. In-progress sessions challenge calculates correct percentage and formatting', () => {
      const challenge: ClassChallenge = {
        id: 'ch-1',
        lopId: 10,
        title: 'Chinh phục 20 buổi học tuần này',
        description: 'Mỗi bạn hoàn thành ít nhất 2 buổi học',
        targetType: 'sessions_count',
        targetValue: 20,
        currentValue: 8,
        rewardXp: 100,
        startDate: '2026-09-22',
        endDate: '2026-09-28',
        status: 'active',
      }

      const result = deriveChallengeProgress(challenge)
      expect(result.percent).toBe(40)
      expect(result.isCompleted).toBe(false)
      expect(result.displayCurrent).toBe('8')
      expect(result.displayTarget).toBe('20 buổi học')
      expect(result.summaryText).toContain('8/20 buổi học (40%)')
    })

    it('C. Completed tasks challenge caps percentage at 100% and flags completed', () => {
      const challenge: ClassChallenge = {
        id: 'ch-2',
        lopId: 10,
        title: 'Cùng nhau giải 50 bài tập',
        description: 'Làm bài tập nhóm',
        targetType: 'tasks_count',
        targetValue: 50,
        currentValue: 55,
        rewardXp: 150,
        startDate: '2026-09-22',
        endDate: '2026-09-28',
        status: 'completed',
      }

      const result = deriveChallengeProgress(challenge)
      expect(result.percent).toBe(100)
      expect(result.isCompleted).toBe(true)
      expect(result.displayCurrent).toBe('55')
      expect(result.displayTarget).toBe('50 nhiệm vụ')
      expect(result.summaryText).toContain('Đã hoàn thành xuất sắc')
    })

    it('D. Zero target value falls back safely to target=1 without division by zero', () => {
      const zeroChallenge: ClassChallenge = {
        id: 'ch-3',
        lopId: 10,
        title: 'Thử thách đặc biệt',
        description: '',
        targetType: 'sessions_count',
        targetValue: 0,
        currentValue: 0,
        rewardXp: 50,
        startDate: '2026-09-22',
        endDate: '2026-09-28',
        status: 'active',
      }

      const result = deriveChallengeProgress(zeroChallenge)
      expect(result.percent).toBe(0)
      expect(Number.isFinite(result.percent)).toBe(true)
    })
  })
})
