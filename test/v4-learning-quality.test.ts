// test/v4-learning-quality.test.ts
// Digital Campus v2: Milestone V4 — Learning Experience & Functional Quality Contracts

import { describe, expect, it } from 'vitest'
import {
  LEARNING_OCCUPANCY_METRIC_CONFIG,
  LEARNING_SUBJECTS,
  matchRoomSubject,
  deriveChallengeProgress,
} from '../src/features/hub/learning-semantics'
import type { PhongSanh } from '../shared/protocol/campus'
import type { ClassChallenge } from '../shared/protocol/engagement'

describe('V4 Learning Experience & Functional Quality Contracts', () => {
  // ── 1. Learning Occupancy Invariant ─────────────────────────────────────────
  it('1. LEARNING_OCCUPANCY_METRIC_CONFIG preserves truthful labels', () => {
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.headerLabel).toBe('Đang tham gia')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.subLabel).toBe('Lượt trong phòng')
    expect(LEARNING_OCCUPANCY_METRIC_CONFIG.prohibitedLabel).toBe('Học sinh online')
  })

  // ── 2. Subject Definitions Integrity ────────────────────────────────────────
  it('2. Learning subjects include core high school subjects with unique IDs', () => {
    expect(LEARNING_SUBJECTS.length).toBeGreaterThanOrEqual(6)

    const ids = new Set<string>()
    for (const subj of LEARNING_SUBJECTS) {
      expect(ids.has(subj.id)).toBe(false)
      ids.add(subj.id)
      expect(subj.label.length).toBeGreaterThan(0)
      expect(subj.shortLabel.length).toBeGreaterThan(0)
    }

    expect(ids.has('tat_ca')).toBe(true)
    expect(ids.has('toan')).toBe(true)
    expect(ids.has('tieng-anh')).toBe(true)
    expect(ids.has('ngu-van')).toBe(true)
  })

  // ── 3. Subject Matching Semantics ───────────────────────────────────────────
  describe('3. Subject Matching Semantics (matchRoomSubject)', () => {
    const baseRoom: PhongSanh = {
      id: 1,
      ten: 'Phòng học tổng hợp',
      moTa: 'Cùng nhau học bài',
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

    it('A. "tat_ca" matches any room unconditionally', () => {
      expect(matchRoomSubject(baseRoom, 'tat_ca')).toBe(true)
      expect(matchRoomSubject({ ...baseRoom, monHoc: 'toan' }, 'tat_ca')).toBe(true)
    })

    it('B. Explicit monHoc matches subject ID exactly (case-insensitive)', () => {
      const mathRoom: PhongSanh = { ...baseRoom, monHoc: 'toan' }
      expect(matchRoomSubject(mathRoom, 'toan')).toBe(true)
      expect(matchRoomSubject(mathRoom, 'tieng-anh')).toBe(false)

      const englishRoom: PhongSanh = { ...baseRoom, monHoc: 'tieng-anh' }
      expect(matchRoomSubject(englishRoom, 'tieng-anh')).toBe(true)
    })

    it('C. Keyword fallback matches room title', () => {
      const room1: PhongSanh = { ...baseRoom, ten: 'Giải bài tập Toán 10 nâng cao' }
      expect(matchRoomSubject(room1, 'toan')).toBe(true)
      expect(matchRoomSubject(room1, 'ngu-van')).toBe(false)

      const room2: PhongSanh = { ...baseRoom, ten: 'Luyện đề IELTS Reading & Speaking' }
      expect(matchRoomSubject(room2, 'tieng-anh')).toBe(true)

      const room3: PhongSanh = { ...baseRoom, ten: 'Ôn tập Nghị luận văn học' }
      expect(matchRoomSubject(room3, 'ngu-van')).toBe(true)

      const room4: PhongSanh = { ...baseRoom, ten: 'Lập trình Python cơ bản' }
      expect(matchRoomSubject(room4, 'tin-hoc')).toBe(true)
    })

    it('D. Keyword fallback matches room description', () => {
      const room: PhongSanh = { ...baseRoom, ten: 'Phòng học nhóm 1', moTa: 'Thảo luận đề thi Vật lí kì 1' }
      expect(matchRoomSubject(room, 'vat-li')).toBe(true)
    })
  })

  // ── 4. Class Challenge Progress Derivation ──────────────────────────────────
  describe('4. Class Challenge Progress Derivation (deriveChallengeProgress)', () => {
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
