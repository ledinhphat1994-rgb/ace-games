import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Flame,
  Trophy,
  Award,
  Target,
  ChevronRight,
  Zap,
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
  const totalXp = profile?.totalXp ?? 0

  return (
    <>
      <Card
        className={`border border-border/80 bg-gradient-to-r from-card/95 via-card to-primary/5 shadow-sm backdrop-blur-md overflow-hidden transition-all hover:border-border ${className}`}
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
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
              {/* Left & Middle: Streak & Truthful XP Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
                {/* Streak Stats */}
                <div className="flex items-center gap-3.5 shrink-0">
                  {/* Streak Flame Container */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-inner">
                    <Flame className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black tracking-tight text-foreground">
                        {profile?.currentStreak ?? 0} Ngày
                      </span>
                      <Badge
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-bold px-1.5 py-0"
                      >
                        Chuỗi
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Kỷ lục: {profile?.longestStreak ?? 0} ngày
                    </p>
                  </div>
                </div>

                <div className="h-8 w-px bg-border/60 hidden sm:block shrink-0" />

                {/* Truthful XP Summary & Challenge Context */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/20 text-primary">
                        <Zap className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-extrabold text-foreground truncate">
                        {totalXp} XP tích lũy
                      </span>
                    </div>

                    <span className="text-[11px] font-medium text-muted-foreground shrink-0">
                      Hôm nay: <strong className="text-primary font-bold">+{todayXp}</strong> XP
                    </span>
                  </div>

                  {challenge && challenge.targetValue > 0 ? (
                    <>
                      <div className="relative">
                        <Progress
                          value={Math.min(100, Math.round((challenge.currentValue / challenge.targetValue) * 100))}
                          className="h-2 bg-muted/60"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 truncate">
                        Thử thách lớp: <span className="font-semibold text-foreground/90">{challenge.title}</span> ({challenge.currentValue}/{challenge.targetValue})
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/80 truncate pt-0.5">
                      {todayXp > 0
                        ? `Đã nhận +${todayXp} XP từ các hoạt động học tập hôm nay`
                        : 'Tham gia học tập hoặc giải đố để tích lũy XP trong ngày'}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Supporting modal triggers + Primary "Xem tiến trình" CTA */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40 shrink-0">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLeaderboard(true)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Bảng xếp hạng chuyên cần tuần"
                  >
                    <Trophy className="h-3.5 w-3.5 mr-1 text-amber-500" />
                    <span>Xếp hạng</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAchievements(true)}
                    className="h-8 px-2.5 text-xs text-muted-foreground hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                    title="Danh hiệu & Huy hiệu học tập"
                  >
                    <Award className="h-3.5 w-3.5 mr-1 text-purple-400" />
                    <span>Huy hiệu</span>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
                      {profile?.unlockedAchievementsCount ?? 0}
                    </Badge>
                  </Button>

                  {challenge && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChallenge(true)}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title={`Thử thách lớp: ${challenge.title}`}
                    >
                      <Target className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                      <span className="hidden sm:inline">Thử thách</span>
                    </Button>
                  )}
                </div>

                {/* Primary CTA */}
                <Button
                  size="sm"
                  onClick={() => navigate('/me?tab=progress')}
                  className="h-8 px-3 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
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
