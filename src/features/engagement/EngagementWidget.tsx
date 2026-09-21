import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Flame,
  Star,
  Trophy,
  Award,
  Target,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  EngagementProfile,
  ClassChallenge,
  FriendStudyActivityItem,
} from '@shared/protocol/engagement'
import { ClassLeaderboardModal } from './ClassLeaderboardModal'
import { AchievementsModal } from './AchievementsModal'
import { ClassChallengeModal } from './ClassChallengeModal'

interface EngagementWidgetProps {
  className?: string
}

export function EngagementWidget({ className = '' }: EngagementWidgetProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showChallenge, setShowChallenge] = useState(false)

  // Profile engagement (Streak, XP)
  const { data: profileData, isLoading: loadingProfile } = useQuery<{
    ok: boolean
    profile: EngagementProfile
  }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải thông tin chuyên cần.')
      return res.json()
    },
    staleTime: 30_000,
  })

  // Class Challenge
  const { data: challengeData } = useQuery<{
    ok: boolean
    lopTen: string | null
    challenge: ClassChallenge | null
  }>({
    queryKey: ['engagement', 'challenges'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/challenges')
      if (!res.ok) return { ok: false, lopTen: null, challenge: null }
      return res.json()
    },
    staleTime: 60_000,
  })

  // Friend Study Activity
  const { data: friendsData } = useQuery<{
    ok: boolean
    friends: FriendStudyActivityItem[]
    activeFriendsCount: number
  }>({
    queryKey: ['engagement', 'friends', 'activity'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/friends/activity')
      if (!res.ok) return { ok: false, friends: [], activeFriendsCount: 0 }
      return res.json()
    },
    staleTime: 45_000,
  })

  const profile = profileData?.profile
  const challenge = challengeData?.challenge
  const activeFriends = friendsData?.friends || []
  const activeFriendsCount = friendsData?.activeFriendsCount || 0

  const todayXp = profile?.todayXp ?? 0

  return (
    <>
      <Card
        className={`border border-border/80 bg-gradient-to-r from-card/90 via-card/95 to-primary/5 shadow-sm backdrop-blur-md overflow-hidden ${className}`}
      >
        <CardContent className="p-4 sm:p-5">
          {loadingProfile ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Skeleton className="h-12 w-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Streak & XP highlights */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {/* Streak Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning border border-warning/25 shadow-inner">
                    <Flame className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-foreground">
                        {profile?.currentStreak ?? 0} Ngày
                      </span>
                      <span className="text-xs text-muted-foreground">chuỗi</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Kỷ lục: {profile?.longestStreak ?? 0} ngày
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-border/60 hidden sm:block" />

                {/* XP Progress */}
                <div className="flex items-center gap-3 min-w-[170px]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25 shadow-inner">
                    <Star className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        {profile?.totalXp ?? 0} XP
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Hôm nay: <strong className="text-primary font-bold">+{todayXp}</strong> XP
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
                      {todayXp > 0
                        ? `+${todayXp} XP từ hoạt động hôm nay`
                        : 'Tham gia học tập để tích lũy XP'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLeaderboard(true)}
                  className="h-8 text-xs gap-1.5 border-border/70 hover:bg-warning/10 hover:border-warning/30 hover:text-warning transition-colors"
                >
                  <Trophy className="h-3.5 w-3.5 text-warning" />
                  <span>Xếp hạng tuần</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAchievements(true)}
                  className="h-8 text-xs gap-1.5 border-border/70 hover:bg-social/10 hover:border-social/30 hover:text-social transition-colors"
                >
                  <Award className="h-3.5 w-3.5 text-social" />
                  <span>Huy hiệu</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5">
                    {profile?.unlockedAchievementsCount ?? 0}
                  </Badge>
                </Button>

                {challenge && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChallenge(true)}
                    className="h-8 text-xs gap-1.5 border-success/30 bg-success/5 text-success hover:bg-success/10 transition-colors"
                  >
                    <Target className="h-3.5 w-3.5 text-success" />
                    <span>Thử thách lớp</span>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-0.5 bg-success/20 text-success">
                      {challenge.currentValue}/{challenge.targetValue}
                    </Badge>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Friend Study Activity Banner (if any friend active) */}
          {activeFriendsCount > 0 && (
            <div className="mt-3.5 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">
                  <strong className="text-foreground font-semibold">
                    {activeFriends[0]?.displayName}
                  </strong>
                  {activeFriendsCount > 1
                    ? ` và ${activeFriendsCount - 1} bạn khác đang duy trì chuỗi học tập hôm nay`
                    : ' đang duy trì chuỗi học tập hôm nay'}
                </span>
              </div>
              <span className="text-[11px] text-primary/80 font-medium shrink-0 ml-2">
                Học cùng bạn bè ✨
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ClassLeaderboardModal
        open={showLeaderboard}
        onOpenChange={setShowLeaderboard}
      />
      <AchievementsModal
        open={showAchievements}
        onOpenChange={setShowAchievements}
      />
      <ClassChallengeModal
        open={showChallenge}
        onOpenChange={setShowChallenge}
      />
    </>
  )
}
