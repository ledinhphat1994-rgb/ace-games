// src/features/hub/learning-semantics.ts
// Digital Campus v2: Milestone U2 & V4 — Learning Metric Semantics & State Contracts

import type { PhongSanh } from '@shared/protocol/campus'
import type { ClassChallenge } from '@shared/protocol/engagement'

/**
 * Invariant:
 * aggregate sum(room.soNguoi) represents total room occupancy / seats occupied,
 * NOT unique online users. Therefore:
 * - prohibitedLabel: "Học sinh online"
 * - truthful labels: "Đang tham gia", "Lượt trong phòng"
 */
export const LEARNING_OCCUPANCY_METRIC_CONFIG = {
  headerLabel: 'Đang tham gia',
  subLabel: 'Lượt trong phòng',
  prohibitedLabel: 'Học sinh online',
} as const

export interface LearningSubject {
  id: string
  label: string
  shortLabel: string
  keywords: string[]
  accentColor: string
}

export const LEARNING_SUBJECTS: LearningSubject[] = [
  { id: 'tat_ca', label: 'Tất cả môn', shortLabel: 'Tất cả', keywords: [], accentColor: 'cyan' },
  { id: 'toan', label: 'Toán học', shortLabel: 'Toán', keywords: ['toán', 'toan', 'math', 'đại số', 'hình học', 'giải tích'], accentColor: 'blue' },
  { id: 'tieng-anh', label: 'Tiếng Anh', shortLabel: 'Anh', keywords: ['anh', 'english', 'ielts', 'toeic', 'ngữ pháp', 'từ vựng'], accentColor: 'purple' },
  { id: 'ngu-van', label: 'Ngữ văn', shortLabel: 'Văn', keywords: ['văn', 'van', 'ngữ văn', 'văn học', 'nghị luận'], accentColor: 'rose' },
  { id: 'vat-li', label: 'Vật lí', shortLabel: 'Lý', keywords: ['lý', 'ly', 'vật lí', 'vat li', 'physics'], accentColor: 'amber' },
  { id: 'hoa-hoc', label: 'Hóa học', shortLabel: 'Hóa', keywords: ['hóa', 'hoa', 'chemistry'], accentColor: 'emerald' },
  { id: 'tin-hoc', label: 'Tin học', shortLabel: 'Tin', keywords: ['tin', 'it', 'code', 'lập trình', 'tin học', 'python', 'pascal'], accentColor: 'indigo' },
]

/**
 * Pure matcher for room subject
 */
export function matchRoomSubject(room: PhongSanh, subjectId: string): boolean {
  if (subjectId === 'tat_ca') return true
  if (room.monHoc && room.monHoc.toLowerCase() === subjectId.toLowerCase()) return true

  const subject = LEARNING_SUBJECTS.find((s) => s.id === subjectId)
  if (!subject || subject.keywords.length === 0) return false

  const nameLower = (room.ten || '').toLowerCase()
  const descLower = (room.moTa || '').toLowerCase()

  return subject.keywords.some((kw) => nameLower.includes(kw) || descLower.includes(kw))
}

/**
 * Pure challenge progress derivation
 */
export function deriveChallengeProgress(challenge: ClassChallenge | null | undefined): {
  percent: number
  isCompleted: boolean
  displayCurrent: string
  displayTarget: string
  summaryText: string
} {
  if (!challenge) {
    return {
      percent: 0,
      isCompleted: false,
      displayCurrent: '0',
      displayTarget: '0',
      summaryText: 'Chưa có thử thách tuần',
    }
  }

  const current = Math.max(0, Number(challenge.currentValue) || 0)
  const target = Math.max(1, Number(challenge.targetValue) || 1)
  const percent = Math.min(100, Math.round((current / target) * 100))
  const isCompleted = current >= target || challenge.status === 'completed'

  const unit = challenge.targetType === 'tasks_count' ? 'nhiệm vụ' : 'buổi học'

  return {
    percent,
    isCompleted,
    displayCurrent: `${current}`,
    displayTarget: `${target} ${unit}`,
    summaryText: isCompleted
      ? `Đã hoàn thành xuất sắc (${current}/${target} ${unit})!`
      : `Đã đạt ${current}/${target} ${unit} (${percent}%)`,
  }
}
