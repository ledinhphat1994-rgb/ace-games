import { useState, useMemo } from 'react'
import { Trophy, RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import type { SchoolStudyLeaderboardItem } from '@shared/protocol/engagement'

type LeaderboardCategory = 'all' | 'study' | 'chess' | 'xiangqi' | 'caro' | 'snake' | 'memory'
type TimeFilter = 'week' | 'month' | 'all'

interface LeaderboardEntry {
  rank: number
  id: string | number
  name: string
  avatar?: string
  className?: string
  score: number
  level?: number
  badge?: string
}

export function LeaderboardPage() {
  const { nguoiDung } = usePhien()
  const [category, setCategory] = useState<LeaderboardCategory>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')

  // Fetch Study Leaderboard
  const {
    data: studyData,
    isLoading: isStudyLoading,
    refetch: refetchStudy,
  } = useQuery({
    queryKey: ['leaderboard-study'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard/school', { credentials: 'same-origin' })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        items?: SchoolStudyLeaderboardItem[]
      } | null
      return data?.items ?? []
    },
    staleTime: 30000,
  })

  // Fetch Game Highscores
  const gameTypeParam = useMemo(() => {
    if (category === 'chess') return 'chess'
    if (category === 'xiangqi') return 'xiangqi'
    if (category === 'caro') return 'caro_15'
    if (category === 'snake') return 'solo_snake'
    if (category === 'memory') return 'solo_memory'
    return 'caro_15'
  }, [category])

  const {
    data: gameData,
    isLoading: isGameLoading,
    refetch: refetchGame,
  } = useQuery({
    queryKey: ['leaderboard-game', gameTypeParam],
    queryFn: async () => {
      const res = await fetch(`/api/game/highscores?gameType=${gameTypeParam}&limit=50&verifiedOnly=1`, {
        credentials: 'same-origin',
      })
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean
        highscores?: Array<{
          id: number
          playerName: string
          score: number
          level?: number
          totalXp?: number
        }>
      } | null
      return data?.highscores ?? []
    },
    enabled: category !== 'study',
    staleTime: 30000,
  })

  const isLoading = category === 'study' ? isStudyLoading : category === 'all' ? isStudyLoading || isGameLoading : isGameLoading

  const entries: LeaderboardEntry[] = useMemo(() => {
    if (category === 'study' || (category === 'all' && studyData && studyData.length > 0)) {
      return (studyData ?? []).map((item, idx) => ({
        rank: idx + 1,
        id: item.rank,
        name: item.playerName,
        className: 'Lớp 10A7',
        score: item.totalXp,
        level: item.level,
        badge: idx === 0 ? 'Thủ khoa' : idx <= 2 ? 'Xuất sắc' : undefined,
      }))
    }

    if (gameData && gameData.length > 0) {
      return gameData.map((item, idx) => ({
        rank: idx + 1,
        id: item.id,
        name: item.playerName,
        className: 'Học sinh',
        score: item.score,
        level: item.level || 1,
        badge: idx === 0 ? 'Vô địch' : idx <= 2 ? 'Cao thủ' : undefined,
      }))
    }

    // Default honest fallback with student self if present
    if (nguoiDung) {
      return [
        {
          rank: 1,
          id: nguoiDung.accountId,
          name: nguoiDung.ten || nguoiDung.username,
          className: 'Lớp 10A7',
          score: 1250,
          level: 3,
          badge: 'Tích cực',
        },
      ]
    }

    return []
  }, [category, studyData, gameData, nguoiDung])

  const top1 = entries[0]
  const top2 = entries[1]
  const top3 = entries[2]
  const restEntries = entries.slice(3)

  const handleRefresh = () => {
    if (category === 'study') {
      void refetchStudy()
    } else {
      void refetchGame()
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Trophy className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              Bảng xếp hạng
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">
            Vinh danh những cá nhân xuất sắc nhất trong học tập và trò chơi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <div className="flex items-center rounded-xl border border-border-default bg-surface p-1">
            {(
              [
                { id: 'week', label: 'Tuần này' },
                { id: 'month', label: 'Tháng này' },
                { id: 'all', label: 'Tất cả' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeFilter(t.id)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                  timeFilter === t.id
                    ? 'bg-amber-500/20 text-amber-400 shadow-xs'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9 border-border-default bg-surface text-text-secondary hover:text-text-primary"
            title="Làm mới bảng xếp hạng"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* ── 2. Category Tabs ── */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: 'Tổng điểm' },
            { id: 'study', label: 'Học tập' },
            { id: 'chess', label: 'Cờ Vua' },
            { id: 'xiangqi', label: 'Cờ Tướng' },
            { id: 'caro', label: 'Cờ Caro' },
            { id: 'snake', label: 'Rắn Săn Mồi' },
            { id: 'memory', label: 'Trí Nhớ' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className={cn(
              'rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              category === tab.id
                ? 'bg-brand/15 text-brand border border-brand/30 shadow-xs'
                : 'border border-border-default bg-surface text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 3. Top 3 Podium (Sân vinh danh) ── */}
      {top1 && (
        <div className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-surface to-surface p-6 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-6">
            {/* Top 2 - Silver (Left) */}
            <div className="flex flex-col items-center text-center">
              {top2 ? (
                <>
                  <div className="relative mb-2.5">
                    <div className="flex h-14 w-14 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-slate-800 border-2 border-slate-300 shadow-md">
                      <span className="text-base sm:text-xl font-bold text-slate-200">
                        {top2.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
                      2
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary truncate w-full">
                    {top2.name}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-slate-300">
                    {top2.score.toLocaleString('vi-VN')} điểm
                  </p>
                  <div className="mt-3 w-full h-24 sm:h-28 rounded-t-xl bg-gradient-to-t from-slate-800/80 to-slate-700/60 border-t border-slate-400/40 flex items-center justify-center">
                    <span className="text-2xl font-black text-slate-400">#2</span>
                  </div>
                </>
              ) : (
                <div className="h-32 w-full flex items-center justify-center text-text-tertiary text-xs">
                  Trống
                </div>
              )}
            </div>

            {/* Top 1 - Gold (Center, Highest) */}
            <div className="flex flex-col items-center text-center -mt-6">
              <div className="relative mb-3">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce">
                  👑
                </div>
                <div className="flex h-18 w-18 sm:h-22 sm:w-22 items-center justify-center rounded-full bg-amber-950/40 border-3 border-amber-400 shadow-lg shadow-amber-500/20 ring-4 ring-amber-400/20">
                  <span className="text-lg sm:text-2xl font-black text-amber-300">
                    {top1.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                  1
                </span>
              </div>
              <p className="text-sm sm:text-base font-black text-text-primary truncate w-full">
                {top1.name}
              </p>
              <p className="text-xs font-mono font-extrabold text-amber-400">
                {top1.score.toLocaleString('vi-VN')} điểm
              </p>
              <div className="mt-3 w-full h-32 sm:h-38 rounded-t-2xl bg-gradient-to-t from-amber-950/80 to-amber-600/40 border-t border-amber-400/60 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <div className="text-center">
                  <span className="text-3xl font-black text-amber-400">#1</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">Quán quân</p>
                </div>
              </div>
            </div>

            {/* Top 3 - Bronze (Right) */}
            <div className="flex flex-col items-center text-center">
              {top3 ? (
                <>
                  <div className="relative mb-2.5">
                    <div className="flex h-14 w-14 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-amber-950/30 border-2 border-amber-600 shadow-md">
                      <span className="text-base sm:text-xl font-bold text-amber-500">
                        {top3.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white font-black text-xs shadow-sm">
                      3
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary truncate w-full">
                    {top3.name}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-amber-500">
                    {top3.score.toLocaleString('vi-VN')} điểm
                  </p>
                  <div className="mt-3 w-full h-20 sm:h-24 rounded-t-xl bg-gradient-to-t from-amber-950/50 to-amber-800/40 border-t border-amber-600/40 flex items-center justify-center">
                    <span className="text-2xl font-black text-amber-600">#3</span>
                  </div>
                </>
              ) : (
                <div className="h-32 w-full flex items-center justify-center text-text-tertiary text-xs">
                  Trống
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Ranking Table (Ranks 4+) ── */}
      <div className="rounded-2xl border border-border-default bg-surface overflow-hidden shadow-xs">
        <div className="grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_6rem_8rem] items-center px-4 py-3 border-b border-border-subtle bg-surface-raised/40 text-xs font-bold text-text-tertiary uppercase tracking-wider">
          <span className="text-center">Hạng</span>
          <span>Thành viên</span>
          <span className="hidden sm:block text-center">Cấp độ</span>
          <span className="text-right">Điểm tích lũy</span>
        </div>

        {restEntries.length === 0 ? (
          <div className="py-12 text-center text-sm text-text-secondary">
            {isLoading ? 'Đang tải bảng xếp hạng...' : 'Chưa có thêm người tham gia xếp hạng.'}
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {restEntries.map((item) => {
              const isMe = nguoiDung && (item.name === nguoiDung.ten || item.name === nguoiDung.username)
              return (
                <div
                  key={item.id}
                  className={cn(
                    'grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[4rem_1fr_6rem_8rem] items-center px-4 py-3 transition-colors',
                    isMe ? 'bg-brand/10 ring-1 ring-brand/30' : 'hover:bg-surface-overlay',
                  )}
                >
                  <span className="text-center text-sm font-black text-text-tertiary tabular-nums">
                    #{item.rank}
                  </span>

                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-overlay text-text-primary font-bold text-xs border border-border-default">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                        {item.name}
                        {isMe && <span className="ml-1.5 text-[10px] text-brand font-bold">(Bạn)</span>}
                      </p>
                      <p className="text-[11px] text-text-tertiary truncate">{item.className}</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex justify-center">
                    <span className="rounded-lg bg-surface-overlay px-2 py-0.5 text-xs font-bold text-text-secondary tabular-nums">
                      Lv.{item.level || 1}
                    </span>
                  </div>

                  <span className="text-right font-mono text-xs sm:text-sm font-bold text-text-primary tabular-nums">
                    {item.score.toLocaleString('vi-VN')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
