// src/features/study/classroom-webcam-state.ts
// Digital Campus v2: Milestone U2 — Classroom Webcam State Derivation (Data-Truth)

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

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return 'HS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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
