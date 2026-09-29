import { z } from 'zod'

export type PresenceState = 'online' | 'away' | 'offline'

export interface UserActivity {
  type: 'room' | 'lobby'
  roomId?: number
  roomTitle?: string
}

export interface FriendPresence {
  accountId: number
  state: PresenceState
  lastSeen: number
  activity: UserActivity | null
}

export interface SocialProfile {
  id: number
  username: string
  displayName: string
  avatar: string | null
  role: string
  lopTen: string | null
}

/**
 * Hồ sơ công khai khi bấm vào ảnh một người (chat, tìm kiếm). Chỉ thông tin an toàn để cả trường xem:
 * không có tên đăng nhập, mật khẩu, thiết bị, email. Quan hệ bạn bè lấy từ SocialState của người xem, không nằm ở đây.
 */
export interface HoSoNguoiDung {
  id: number
  displayName: string
  avatar: string | null
  role: string
  lopTen: string | null
  /** Châm ngôn học tập người dùng tự đặt (≤ 150 ký tự). */
  tieuDeHoSo: string | null
  /** Tổng XP học tập; cấp độ tính từ đây. */
  totalXp: number
}

export interface FriendItem extends SocialProfile {
  friendedAt: number
}

export interface FriendRequestItem {
  id: number
  sender?: SocialProfile
  receiver?: SocialProfile
  createdAt: number
}

export interface BlockedUserItem {
  id: number
  username: string
  displayName: string
  blockedAt: number
}

export interface SocialState {
  friends: FriendItem[]
  incomingRequests: FriendRequestItem[]
  outgoingRequests: FriendRequestItem[]
  blockedUsers: BlockedUserItem[]
}

export type RelationshipStatus = 'self' | 'friend' | 'pending_sent' | 'pending_received' | 'none' | 'blocked'

export interface SearchResultItem extends SocialProfile {
  relationshipStatus: RelationshipStatus
}

export const LenhSocial = z.discriminatedUnion('type', [
  z.object({ type: z.literal('presence.away'), away: z.boolean() }),
  z.object({
    type: z.literal('activity.set'),
    activity: z
      .object({
        type: z.enum(['room', 'lobby']),
        roomId: z.number().int().positive().optional(),
        roomTitle: z.string().max(200).optional(),
      })
      .nullable(),
  }),
])
export type LenhSocial = z.infer<typeof LenhSocial>

export type GoiSocial =
  | { type: 'social.presence_snapshot'; friends: FriendPresence[] }
  | { type: 'social.presence_update'; presence: FriendPresence }
  | { type: 'social.request_received'; request: FriendRequestItem }
  | { type: 'social.request_resolved'; requestId: number }
  | { type: 'social.friend_added'; friend: FriendItem; presence: FriendPresence }
  | { type: 'social.friend_removed'; friendId: number }
  | { type: 'social.blocked'; targetId: number }
  | {
      type: 'social.study_invite'
      invitation: {
        id: string
        senderId: number
        senderName: string
        senderAvatar: string | null
        roomId: number
        roomTitle: string
        expiresAt: number
      }
    }
