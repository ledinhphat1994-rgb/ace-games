export type NotificationType =
  | 'friend_request'
  | 'friend_accept'
  | 'study_invite'
  | 'study_invite_accepted'
  | 'achievement_unlocked'
  | 'moderation_notice'
  | 'system_announcement'

export interface NotificationItem {
  id: number
  recipientId: number
  type: NotificationType
  title: string
  body: string
  data?: {
    actorId?: number
    actorName?: string
    actorAvatar?: string | null
    requestId?: number
    roomId?: number
    roomTitle?: string
    invitationId?: string
    achievementKey?: string
    achievementTitle?: string
    rewardXp?: number
    [key: string]: unknown
  } | null
  readAt: number | null
  createdAt: number
}

export interface ListNotificationsResponse {
  ok: boolean
  notifications: NotificationItem[]
  unreadCount: number
  totalCount: number
  hasMore: boolean
}

export interface UnreadCountResponse {
  ok: boolean
  unreadCount: number
}
