// src/features/hub/learning-semantics.ts
// Digital Campus v2: Milestone U2 & V4 — Learning Metric Semantics & State Contracts

import type { PhongSanh } from '@shared/protocol/campus'
import type { ClassChallenge } from '@shared/protocol/engagement'
import type { RoomFriendInfo } from './room-discovery'
import { chonPhongVaoNhanh } from './room-discovery'

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

/**
 * Strict Room Join Target Parser
 * Strictly validates and extracts room ID from:
 * - Pure integer digits: "42"
 * - Room prefix: "phong-42"
 * - Relative room path: "/room/phong-42" or "room/phong-42"
 * - Absolute room URL: "http(s)://.../room/phong-42"
 *
 * Strictly rejects:
 * - Trailing/leading alphanumeric mixes (e.g., "42abc", "abc42")
 * - Zero and negative IDs
 * - Unrelated URLs and malformed strings
 */
export interface ParseJoinTargetResult {
  ok: boolean
  roomId?: number
  error?: string
}

export function parseRoomJoinTarget(
  input: string,
  currentOrigin?: string,
): ParseJoinTargetResult {
  const raw = input.trim()
  if (!raw) {
    return { ok: false, error: 'Vui lòng nhập ID hoặc liên kết phòng.' }
  }

  // 1. Full URL (e.g., https://campus.edu.vn/room/phong-42) - Must be same-origin
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const url = new URL(raw)
      const trustedOrigin =
        currentOrigin || (typeof window !== 'undefined' && window.location ? window.location.origin : undefined)

      if (!trustedOrigin || url.origin.toLowerCase() !== trustedOrigin.toLowerCase()) {
        return {
          ok: false,
          error: 'Chỉ chấp nhận liên kết phòng học từ trang hiện tại (cùng tên miền).',
        }
      }

      const match = url.pathname.match(/^\/room\/phong-(\d+)$/)
      if (match) {
        const id = Number(match[1])
        if (id > 0) return { ok: true, roomId: id }
      }
      return { ok: false, error: 'Liên kết không hợp lệ. Vui lòng nhập liên kết phòng học (VD: /room/phong-42).' }
    } catch {
      return { ok: false, error: 'Địa chỉ liên kết URL không hợp lệ.' }
    }
  }

  // 2. Relative route path (e.g., /room/phong-42 or room/phong-42)
  const relMatch = raw.match(/^\/?room\/phong-(\d+)$/)
  if (relMatch) {
    const id = Number(relMatch[1])
    if (id > 0) return { ok: true, roomId: id }
    return { ok: false, error: 'ID phòng phải là số nguyên dương.' }
  }

  // 3. phong-42 prefix
  const prefixMatch = raw.match(/^phong-(\d+)$/)
  if (prefixMatch) {
    const id = Number(prefixMatch[1])
    if (id > 0) return { ok: true, roomId: id }
    return { ok: false, error: 'ID phòng phải là số nguyên dương.' }
  }

  // 4. Pure positive integer (strict: only digits 0-9)
  const numMatch = raw.match(/^(\d+)$/)
  if (numMatch) {
    const id = Number(numMatch[1])
    if (id > 0) return { ok: true, roomId: id }
    return { ok: false, error: 'ID phòng phải là số nguyên dương.' }
  }

  return {
    ok: false,
    error: 'Mục tiêu không hợp lệ. Vui lòng nhập số ID phòng (VD: 42, phong-42) hoặc liên kết phòng.',
  }
}

/**
 * Lobby Readiness State Derivation
 * Lifecycle:
 * - Before authoritative snapshot or during initial connection: 'loading'
 * - While connection is broken / reconnecting: 'reconnecting'
 * - Once authoritative snapshot arrives: 'ready'
 */
export type LobbyReadinessState =
  | { status: 'loading' }
  | { status: 'reconnecting' }
  | { status: 'ready'; rooms: PhongSanh[] }

export function deriveLobbyState(params: {
  trangThai: string
  campusSnapshotReady: boolean
  rooms: PhongSanh[]
}): LobbyReadinessState {
  if (params.trangThai === 'mat_ket_noi') {
    return { status: 'reconnecting' }
  }
  if (!params.campusSnapshotReady || params.trangThai === 'dang_ket_noi') {
    return { status: 'loading' }
  }
  return { status: 'ready', rooms: params.rooms }
}

/**
 * Pure filter for active rooms in lobby by query (room name, host name, subject)
 */
export function filterLobbyRooms(rooms: PhongSanh[], query: string): PhongSanh[] {
  const q = query.trim().toLowerCase()
  if (!q) return rooms
  return rooms.filter((room) => {
    const matchName = (room.ten || '').toLowerCase().includes(q)
    const matchHost = (room.chuPhongTen || '').toLowerCase().includes(q)
    const matchSubject = (room.monHoc || '').toLowerCase().includes(q)
    return matchName || matchHost || matchSubject
  })
}

export interface ActiveFriendStudyResult {
  friend: RoomFriendInfo
  room: PhongSanh
}

/**
 * Derive active friend study continuation.
 * Invariant: Fail-closed.
 * Only returns a friend-study continuation when:
 * 1. presenceReady === true
 * 2. trangThai === 'da_ket_noi'
 * 3. The friend is present in a room that exists in authoritative `rooms`.
 */
export function deriveActiveFriendStudy(params: {
  rooms: PhongSanh[]
  roomFriendsMap: Map<number, RoomFriendInfo[]>
  presenceReady?: boolean
  trangThai?: string
}): ActiveFriendStudyResult | null {
  if (params.presenceReady !== true || params.trangThai !== 'da_ket_noi') {
    return null
  }
  for (const room of params.rooms) {
    const friendsInRoom = params.roomFriendsMap.get(room.id)
    if (friendsInRoom && friendsInRoom.length > 0) {
      return {
        friend: friendsInRoom[0],
        room,
      }
    }
  }
  return null
}

/**
 * Derive quick-join room target.
 * Invariant:
 * Only returns a room when:
 * 1. lobbyStatus === 'ready'
 * 2. chonPhongVaoNhanh returns a valid public room with capacity (< sucChua) and no password.
 */
export function deriveQuickJoinRoom(params: {
  lobbyStatus: string
  rooms: PhongSanh[]
  roomFriendsMap: Map<number, RoomFriendInfo[]>
}): PhongSanh | null {
  if (params.lobbyStatus !== 'ready') return null
  return chonPhongVaoNhanh(params.rooms, params.roomFriendsMap)
}
