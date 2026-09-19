import { z } from 'zod'

export interface EngagementProfile {
  accountId: number
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
  totalXp: number
  todayXp: number
  unlockedAchievementsCount: number
  updatedAt: number
}

export interface AchievementDefinition {
  key: string
  title: string
  description: string
  category: 'session' | 'streak' | 'task' | 'social' | 'challenge'
  icon: string
  rewardXp: number
}

export interface UserAchievementItem extends AchievementDefinition {
  unlocked: boolean
  unlockedAt: number | null
}

export interface ClassLeaderboardItem {
  rank: number
  accountId: number
  displayName: string
  avatar: string | null
  weeklyXp: number
  currentStreak: number
  isCurrentUser: boolean
}

export interface ClassChallenge {
  id: string
  lopId: number
  title: string
  description: string
  targetType: 'sessions_count' | 'tasks_count'
  targetValue: number
  currentValue: number
  rewardXp: number
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'expired'
  participantCount?: number
  hasContributed?: boolean
}

export type StudyInvitationStatus = 'pending' | 'accepted' | 'dismissed' | 'expired'

export interface StudyInvitation {
  id: string
  senderId: number
  senderName: string
  senderAvatar: string | null
  recipientId: number
  roomId: number
  roomTitle: string
  status: StudyInvitationStatus
  createdAt: number
  expiresAt: number
}

export interface FriendStudyActivityItem {
  friendId: number
  displayName: string
  avatar: string | null
  status: 'studying_now' | 'studied_recently' | 'active_streak'
  currentStreak: number
  lastStudyDate: string | null
  activityDetail?: string
}

export const SendStudyInviteSchema = z.object({
  recipientId: z.number().int().positive(),
  roomId: z.number().int().positive(),
  roomTitle: z.string().min(1).max(100),
})
export type SendStudyInviteInput = z.infer<typeof SendStudyInviteSchema>
