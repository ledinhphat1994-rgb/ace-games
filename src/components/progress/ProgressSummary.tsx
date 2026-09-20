import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Flame,
  Star,
  Trophy,
  Award,
  Target,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  EngagementProfile,
  ClassChallenge,
} from '@shared/protocol/engagement'
import { ClassLeaderboardModal } from '@/features/engagement/ClassLeaderboardModal'
import { AchievementsModal } from '@/features/engagement/AchievementsModal'
import { ClassChallengeModal } from '@/features/engagement/ClassChallengeModal'

interface ProgressSummaryProps {
  className?: string
}

export function ProgressSummary({
  className = '',
}: ProgressSummaryProps) {
  const navigate = useNavigate()
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

  const profile = profileData?.profile
  const challenge = challengeData?.challenge

  const todayXp = profile?.todayXp ?? 0
  const maxDailyXp = 120
  const dailyProgress = Math.min(100, Math.round((todayXp / maxDailyXp) * 100))

  return (
    <>
      <Card
        className={`border border-border/80 bg-gradient-to-r from-card/95 via-card to-primary/5 shadow-sm backdrop-blur-md overflow-hidden ${className}`}
      >
        <CardContent className="p-4 sm:p-5">
          {loadingProfile ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Skeleton className="h-11 w-11 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-9 w-full sm:w-48 rounded-xl" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Streak & Daily XP Progress */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                {/* Streak Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 shadow-inner">
                    <Flame className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-foreground">
                        {profile?.currentStreak ?? 0} Ngày
                      </span>
                      <span className="text-xs text-muted-foreground">chuỗi</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Kỷ lục: {profile?.longestStreak ?? 0} ngày
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border/60 hidden sm:block" />

                {/* XP Progress */}
                <div className="flex items-center gap-3 min-w-[200px] flex-1 sm:flex-initial">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/25 shadow-inner">
                    <Star className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        {profile?.totalXp ?? 0} XP
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Mục tiêu hôm nay: {todayXp}/{maxDailyXp}
                      </span>
                    </div>
                    <Progress value={dailyProgress} className="h-1.5 mt-1.5 bg-muted" />
                  </div>
                </div>
              </div>

              {/* Right: Consolidated CTA and subtle supporting actions */}
              <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                {/* Secondary modal actions as subtle icons / badges */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLeaderboard(true)}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  title="Bảng xếp hạng chuyên cần tuần"
                >
                  <Trophy className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  <span className="hidden sm:inline">Xếp hạng</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAchievements(true)}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                  title="Danh hiệu & Huy hiệu học tập"
                >
                  <Award className="h-3.5 w-3.5 mr-1 text-purple-500" />
                  <span className="hidden sm:inline">Huy hiệu</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
                    {profile?.unlockedAchievementsCount ?? 0}/8
                  </Badge>
                </Button>

                {challenge && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChallenge(true)}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    title={`Thử thách lớp: ${challenge.title}`}
                  >
                    <Target className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    <span className="hidden sm:inline">Thử thách</span>
                  </Button>
                )}

                {/* Primary CTA: "Xem tiến trình" */}
                <Button
                  size="sm"
                  onClick={() => navigate('/me?tab=progress')}
                  className="h-8 px-3 text-xs font-semibold gap-1 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                >
                  <span>Xem tiến trình</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supporting Modals */}
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
