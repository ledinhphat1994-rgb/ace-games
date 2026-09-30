import { useQuery } from '@tanstack/react-query'
import { Target, Users, CheckCircle2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deriveChallengeProgress } from '../../learning-semantics'
import type { ClassChallenge } from '@shared/protocol/engagement'

export function ClassChallengeCard() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<{
    ok: boolean
    challenge: ClassChallenge | null
  }>({
    queryKey: ['engagement', 'challenges'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/challenges')
      if (!res.ok) throw new Error('Không thể tải thử thách học tập của lớp.')
      const json = await res.json()
      if (!json || json.ok !== true) {
        throw new Error(json?.loi || json?.error || 'Không thể tải thử thách học tập của lớp.')
      }
      return json
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border-default bg-[#0c1222] p-4 shadow-lg animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-surface-overlay" />
          <div className="h-4 w-32 rounded bg-surface-overlay" />
        </div>
        <div className="h-4 w-full rounded bg-surface-overlay" />
        <div className="h-2 w-full rounded-full bg-surface-overlay" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4 shadow-md space-y-2.5 text-center">
        <p className="text-xs font-semibold text-destructive">
          Không tải được thử thách của lớp
        </p>
        <p className="text-[11px] text-text-secondary">
          {error instanceof Error ? error.message : 'Vui lòng kiểm tra lại kết nối mạng.'}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="h-7 px-3 text-xs border-rose-500/30 text-destructive hover:bg-rose-500/10 gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Thử lại</span>
        </Button>
      </div>
    )
  }

  const challenge = data?.challenge
  if (!challenge) {
    return (
      <div className="rounded-2xl border border-border-default bg-[#0c1222] p-4 shadow-md text-center space-y-1.5">
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-surface-overlay text-text-secondary border border-border-default">
          <Target className="h-4 w-4" />
        </div>
        <p className="text-xs font-bold text-text-primary">Chưa có thử thách tuần này</p>
        <p className="text-[11px] text-text-secondary">
          Lớp bạn hiện chưa có mục tiêu học tập chung được khởi tạo.
        </p>
      </div>
    )
  }

  const progress = deriveChallengeProgress(challenge)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-default bg-[#0c1222] p-4 shadow-lg space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">
              Mục tiêu tuần của lớp
            </h3>
          </div>
        </div>

        {challenge.hasContributed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-success border border-emerald-500/25">
            <CheckCircle2 className="h-3 w-3" />
            Đã đóng góp
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="text-sm font-bold text-text-primary leading-snug">
          {challenge.title}
        </h4>
        {challenge.description && (
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
            {challenge.description}
          </p>
        )}
      </div>

      {/* Progress Bar & Stats */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-text-secondary">{progress.summaryText}</span>
          <span className="font-mono font-bold text-indigo-300">{progress.percent}%</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progress.isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Footer details: participants & reward */}
      <div className="flex items-center justify-between pt-1 border-t border-border-default text-[11px] text-text-secondary">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-text-secondary" />
          {challenge.participantCount || 0} bạn tham gia
        </span>

        <span className="font-bold text-warning">
          +{challenge.rewardXp} XP thưởng
        </span>
      </div>
    </div>
  )
}
