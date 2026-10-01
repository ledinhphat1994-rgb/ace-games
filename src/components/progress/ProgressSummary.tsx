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
  AlertCircle,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type {
  ClassChallenge,
} from '@shared/protocol/engagement'
import { ClassLeaderboardModal } from '@/features/engagement/ClassLeaderboardModal'
import { AchievementsModal } from '@/features/engagement/AchievementsModal'
import { ClassChallengeModal } from '@/features/engagement/ClassChallengeModal'
import {
  deriveProgressState,
  type ProgressDataResponse,
} from './progress-state'

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
  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<ProgressDataResponse>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải thông tin chuyên cần.')
      const json = (await res.json()) as ProgressDataResponse
      if (!json || json.ok === false) {
        throw new Error(json?.loi || json?.message || 'Không thể tải thông tin chuyên cần.')
      }
      return json
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

  const progressState = deriveProgressState({
    isLoading: loadingProfile,
    isError: isProfileError,
    data: profileData,
    error: profileError,
  })

  // 1. LOADING VIEW STATE
  if (progressState.type === 'loading') {
    return (
      <div
        data-testid="progress-summary-loading"
        className={`rounded-xl sm:rounded-2xl border border-border-default bg-[#0c1322]/80 p-2.5 sm:p-3.5 backdrop-blur-md ${className}`}
      >
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 sm:h-8 w-28 sm:w-36 rounded-lg sm:rounded-xl" />
          <Skeleton className="h-7 sm:h-8 w-24 sm:w-32 rounded-lg sm:rounded-xl" />
        </div>
      </div>
    )
  }

  // 2. ERROR VIEW STATE (Truthful compact error banner, no fake zeros)
  if (progressState.type === 'error') {
    return (
      <div
        data-testid="progress-summary-error"
        className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-rose-500/25 bg-[#0c1322]/85 p-2 sm:p-2.5 backdrop-blur-md shadow-md transition-all ${className}`}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 text-xs text-destructive font-medium truncate">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            <span className="truncate">Không tải được tiến trình</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchProfile()}
            className="h-7 px-2.5 rounded-lg text-xs font-semibold text-destructive hover:text-text-primary hover:bg-rose-500/20 gap-1.5 shrink-0"
          >
            <RotateCw className="h-3 w-3" />
            <span>Thử lại</span>
          </Button>
        </div>
      </div>
    )
  }

  // 3. SUCCESS VIEW STATE (Authoritative values rendered, including legitimate zeros)
  const { profile, todayXp, totalXp, currentStreak } = progressState
  const challenge = challengeData?.challenge

  return (
    <>
      <div
        data-testid="progress-summary"
        className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-border-default bg-[#0c1322]/85 p-2 sm:p-3.5 backdrop-blur-md shadow-md sm:shadow-lg transition-all ${className}`}
      >
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Streak & XP Badges (Authoritative data only) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Streak pill with animated warm glow */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm"
              title={`Chuỗi học tập hiện tại: ${currentStreak} ngày`}
            >
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-warning fill-amber-400/20" />
              <div className="flex items-baseline gap-1">
                <span className="text-xs sm:text-sm font-black text-warning">{currentStreak}</span>
                <span className="text-[11px] sm:text-xs font-semibold text-warning/80">ngày</span>
              </div>
            </div>

            {/* Total XP pill */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-brand/12 border border-brand/30 px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm"
              title={`Tổng điểm kinh nghiệm: ${totalXp} XP (+${todayXp} hôm nay)`}
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand fill-brand/20" />
              <div className="flex items-baseline gap-1">
                <span className="text-xs sm:text-sm font-black text-brand">{totalXp}</span>
                <span className="text-[11px] sm:text-xs font-semibold text-brand/80">XP</span>
              </div>
              {todayXp > 0 && (
                <span className="hidden md:inline text-xs font-bold text-success bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/25">
                  +{todayXp}
                </span>
              )}
            </div>
          </div>

          {/* Middle: Challenge Progress (desktop only) */}
          {challenge && challenge.targetValue > 0 && (
            <div className="flex-1 min-w-0 max-w-xs hidden lg:block space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-secondary truncate">{challenge.title}</span>
                <span className="text-text-secondary font-mono">
                  {challenge.currentValue}/{challenge.targetValue}
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.round((challenge.currentValue / challenge.targetValue) * 100))}
                className="h-1.5 bg-surface"
              />
            </div>
          )}

          {/* Right: Actions (Desktop has modals, Mobile has clean compact 'Chi tiết' button) */}
          <div className="flex items-center justify-end gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeaderboard(true)}
              className="hidden sm:inline-flex h-8 px-2.5 text-xs font-semibold text-text-secondary hover:text-warning hover:bg-amber-500/10 rounded-lg gap-1.5"
              title="Bảng xếp hạng chuyên cần"
            >
              <Trophy className="h-3.5 w-3.5 text-warning" />
              <span>Xếp hạng</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAchievements(true)}
              className="hidden sm:inline-flex h-8 px-2.5 text-xs font-semibold text-text-secondary hover:text-social hover:bg-purple-500/10 rounded-lg gap-1.5"
              title="Danh hiệu & Huy hiệu"
            >
              <Award className="h-3.5 w-3.5 text-social" />
              <span>Huy hiệu</span>
              {profile && profile.unlockedAchievementsCount > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 border-purple-500/40 bg-purple-500/20 text-social">
                  {profile.unlockedAchievementsCount}
                </Badge>
              )}
            </Button>

            {challenge && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChallenge(true)}
                className="hidden md:inline-flex h-8 px-2.5 text-xs font-semibold text-text-secondary hover:text-success hover:bg-emerald-500/10 rounded-lg gap-1.5"
                title={`Thử thách: ${challenge.title}`}
              >
                <Target className="h-3.5 w-3.5 text-success" />
                <span>Thử thách</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => navigate('/me?tab=progress')}
              className="h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-surface-overlay hover:bg-surface-overlay text-text-primary font-bold text-xs gap-1 shadow-sm transition-all"
            >
              <span className="hidden xs:inline">Tiến trình</span>
              <span className="xs:hidden">Chi tiết</span>
              <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
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
