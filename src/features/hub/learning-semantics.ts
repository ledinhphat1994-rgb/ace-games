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
  { id: 'toan', label: 'Toán học', shortLabel: 'Toán', keywords: ['toán', 'toan', 'math', 'đại số', 'hình học', 'giải tích', 'môn toán', 'toán 10', 'toán 11', 'toán 12'], accentColor: 'blue' },
  { id: 'ngu-van', label: 'Ngữ văn', shortLabel: 'Văn', keywords: ['ngữ văn', 'ngu van', 'văn học', 'van hoc', 'nghị luận', 'môn văn', 'văn 10', 'văn 11', 'văn 12', 'tiếng việt', 'học văn'], accentColor: 'rose' },
  { id: 'tieng-anh', label: 'Tiếng Anh', shortLabel: 'Anh', keywords: ['tiếng anh', 'tieng anh', 'english', 'ielts', 'toeic', 'anh văn', 'môn anh', 'anh 10', 'anh 11', 'anh 12'], accentColor: 'purple' },
  { id: 'vat-li', label: 'Vật lí', shortLabel: 'Lý', keywords: ['vật lí', 'vật lý', 'vat li', 'vat ly', 'physics', 'môn lý', 'lý 10', 'lý 11', 'lý 12'], accentColor: 'amber' },
  { id: 'hoa-hoc', label: 'Hóa học', shortLabel: 'Hóa', keywords: ['hóa học', 'hoa hoc', 'hoá học', 'chemistry', 'môn hóa', 'hóa 10', 'hóa 11', 'hóa 12'], accentColor: 'emerald' },
  { id: 'sinh-hoc', label: 'Sinh học', shortLabel: 'Sinh', keywords: ['sinh học', 'sinh hoc', 'biology', 'môn sinh', 'sinh 10', 'sinh 11', 'sinh 12'], accentColor: 'green' },
  { id: 'lich-su', label: 'Lịch sử', shortLabel: 'Sử', keywords: ['lịch sử', 'lich su', 'history', 'môn sử', 'sử 10', 'sử 11', 'sử 12'], accentColor: 'orange' },
  { id: 'dia-li', label: 'Địa lí', shortLabel: 'Địa', keywords: ['địa lí', 'địa lý', 'dia li', 'dia ly', 'geography', 'môn địa', 'địa 10', 'địa 11', 'địa 12'], accentColor: 'yellow' },
  { id: 'tin-hoc', label: 'Tin học', shortLabel: 'Tin', keywords: ['tin học', 'tin hoc', 'lập trình', 'lap trinh', 'coding', 'python', 'pascal', 'computer science', 'môn tin', 'tin 10', 'tin 11', 'tin 12'], accentColor: 'indigo' },
  { id: 'gdcd', label: 'GDCD / GDKT&PL', shortLabel: 'GDCD', keywords: ['gdcd', 'kinh tế và pháp luật', 'gdkt&pl', 'gdktpl', 'pháp luật', 'công dân', 'môn gdcd', 'kinh tế pháp luật'], accentColor: 'teal' },
]

/**
 * Pure matcher for room subject
 */
export function matchRoomSubject(room: PhongSanh, subjectId: string): boolean {
  if (subjectId === 'tat_ca') return true
  if (room.monHoc) {
    return room.monHoc.toLowerCase() === subjectId.toLowerCase()
  }

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
