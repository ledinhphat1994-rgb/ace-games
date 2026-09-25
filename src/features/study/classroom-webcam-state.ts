// src/features/study/classroom-webcam-state.ts
// Digital Campus v2: Milestone U2 — Classroom Webcam State Derivation (Data-Truth)

import { getInitials } from '@/lib/utils'

// Dùng chung với danh sách bạn bè; giữ export ở đây cho các nơi đang import từ module này.
export { getInitials }

export interface ClassroomMember {
  key: string
  ten: string
  avatar?: string
  mic?: boolean
  isHost?: boolean
  canModerate?: boolean
}

export interface DerivedWebcamParticipant {
  key: string
  name: string
  role: 'Chủ phòng' | 'Quản trị' | 'Thành viên'
  isHost: boolean
  isMe: boolean
  isSpeaking: boolean
  micOn?: boolean
  avatar?: string
  initials: string
}

/**
 * Derives webcam participant list 1:1 exclusively from real room members.
 * Invariant:
 * - members.length === 0 => returns [] (zero fake webcams)
 * - members.length === 1 => exactly one representation
 * - NO DEFAULT_PARTICIPANTS
 * - NO fictional names (Thầy Lê Đình Phát, Nguyễn Văn Minh, etc.)
 * - NO generated human faces assigned to real identities
 */
export function deriveWebcamParticipants(
  members: ClassroomMember[] = [],
  hostKey?: string | null,
  currentActorKey?: string,
  speakingActors: string[] = [],
): DerivedWebcamParticipant[] {
  if (!members || members.length === 0) {
    return []
  }

  return members.map((member) => {
    const isHost = member.key === hostKey || Boolean(member.isHost)
    const isMe = member.key === currentActorKey
    const isSpeaking = speakingActors.includes(member.key) || (isMe && speakingActors.includes('local'))
    const role: 'Chủ phòng' | 'Quản trị' | 'Thành viên' = isHost
      ? 'Chủ phòng'
      : member.canModerate
        ? 'Quản trị'
        : 'Thành viên'

    return {
      key: member.key,
      name: member.ten,
      role,
      isHost,
      isMe,
      isSpeaking,
      micOn: typeof member.mic === 'boolean' ? member.mic : undefined,
      avatar: member.avatar && member.avatar.trim().length > 0 ? member.avatar : undefined,
      initials: getInitials(member.ten),
    }
  })
}
