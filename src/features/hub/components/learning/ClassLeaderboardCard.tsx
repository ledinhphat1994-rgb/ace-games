import { useQuery } from '@tanstack/react-query'
import { Trophy, Flame, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ClassLeaderboardItem } from '@shared/protocol/engagement'

export function ClassLeaderboardCard() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<{
    ok: boolean
    lopTen: string | null
    currentWeek: string
    items: ClassLeaderboardItem[]
  }>({
    queryKey: ['engagement', 'leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard')
      if (!res.ok) throw new Error('Không thể tải bảng thi đua tuần của lớp.')
      return res.json()
    },
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-white/10" />
          <div className="h-4 w-28 rounded bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-full rounded-xl bg-white/5" />
          <div className="h-8 w-full rounded-xl bg-white/5" />
          <div className="h-8 w-full rounded-xl bg-white/5" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4 shadow-md space-y-2.5 text-center">
        <p className="text-xs font-semibold text-rose-300">
          Không tải được bảng thi đua lớp
        </p>
        <p className="text-[11px] text-slate-400">
          {error instanceof Error ? error.message : 'Vui lòng kiểm tra lại kết nối mạng.'}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="h-7 px-3 text-xs border-rose-500/30 text-rose-200 hover:bg-rose-500/10 gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Thử lại</span>
        </Button>
      </div>
    )
  }

  const items = data?.items ?? []
  const lopTen = data?.lopTen || 'Lớp của bạn'

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Trophy className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Thi đua tuần · {lopTen}
            </h3>
          </div>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="py-4 text-center space-y-1">
          <p className="text-xs font-bold text-slate-300">Chưa có điểm tuần này</p>
          <p className="text-[11px] text-slate-400">
            Hoàn thành buổi học đầu tiên để lên bảng thi đua!
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.slice(0, 5).map((member) => {
            const isTop1 = member.rank === 1
            const isTop2 = member.rank === 2
            const isTop3 = member.rank === 3

            return (
              <div
                key={member.accountId}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  member.isCurrentUser
                    ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
                    : 'bg-slate-900/40 border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                      isTop1
                        ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/50'
                        : isTop2
                        ? 'bg-slate-300 text-slate-950'
                        : isTop3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {member.rank}
                  </span>

                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${member.isCurrentUser ? 'text-cyan-300' : 'text-slate-200'}`}>
                      {member.displayName}
                      {member.isCurrentUser && (
                        <span className="ml-1 text-[10px] text-cyan-400 font-semibold">(Bạn)</span>
                      )}
                    </p>
                    {member.currentStreak > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-400/80">
                        <Flame className="h-3 w-3 fill-amber-400" />
                        <span>{member.currentStreak} ngày</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="font-mono text-xs font-black text-white">
                    {member.weeklyXp}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">XP</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
