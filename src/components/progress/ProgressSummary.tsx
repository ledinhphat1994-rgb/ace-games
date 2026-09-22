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
  const currentStreak = profile?.currentStreak ?? 0

  if (loadingProfile) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-[#0c1322]/80 p-3.5 backdrop-blur-md ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1322]/85 p-3 sm:p-3.5 backdrop-blur-md shadow-lg transition-all ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Streak & XP Badges */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Streak pill with animated warm glow */}
            <div
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 px-3 py-1.5 shadow-sm"
              title={`Chuỗi học tập hiện tại: ${currentStreak} ngày`}
            >
              <Flame className="h-4 w-4 text-amber-400 fill-amber-400/20" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-amber-300">{currentStreak}</span>
                <span className="text-[11px] font-semibold text-amber-200/80">ngày</span>
              </div>
            </div>

            {/* Total XP pill */}
            <div
              className="flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-3 py-1.5 shadow-sm"
              title={`Tổng điểm kinh nghiệm: ${totalXp} XP (+${todayXp} hôm nay)`}
            >
              <Zap className="h-4 w-4 text-cyan-400 fill-cyan-400/20" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-cyan-300">{totalXp}</span>
                <span className="text-[11px] font-semibold text-cyan-200/80">XP</span>
              </div>
              {todayXp > 0 && (
                <span className="hidden md:inline text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/25">
                  +{todayXp}
                </span>
              )}
            </div>
          </div>

          {/* Middle: Challenge Progress (if active) */}
          {challenge && challenge.targetValue > 0 && (
            <div className="flex-1 min-w-0 max-w-xs hidden lg:block space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 truncate">{challenge.title}</span>
                <span className="text-slate-400 font-mono">
                  {challenge.currentValue}/{challenge.targetValue}
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.round((challenge.currentValue / challenge.targetValue) * 100))}
                className="h-1.5 bg-slate-800"
              />
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeaderboard(true)}
              className="h-8 px-2.5 text-xs font-semibold text-slate-300 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg gap-1.5"
              title="Bảng xếp hạng chuyên cần"
            >
              <Trophy className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden xs:inline">Xếp hạng</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAchievements(true)}
              className="h-8 px-2.5 text-xs font-semibold text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg gap-1.5"
              title="Danh hiệu & Huy hiệu"
            >
              <Award className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden xs:inline">Huy hiệu</span>
              {profile && profile.unlockedAchievementsCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-purple-500/40 bg-purple-500/20 text-purple-300">
                  {profile.unlockedAchievementsCount}
                </Badge>
              )}
            </Button>

            {challenge && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChallenge(true)}
                className="h-8 px-2.5 text-xs font-semibold text-slate-300 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg gap-1.5"
                title={`Thử thách: ${challenge.title}`}
              >
                <Target className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Thử thách</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => navigate('/me?tab=progress')}
              className="h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs gap-1 shadow-sm transition-all"
            >
              <span>Tiến trình</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </div>
        </div>
      </div>

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
