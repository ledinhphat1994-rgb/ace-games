import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Trophy, RefreshCw, Crown, Medal, Flame, AlertCircle, GraduationCap, Users, Sparkles, BookOpen, Gamepad2, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { tinhLevel, type HighScoreRecord } from '@/features/games/GameLeaderboard'
import type { SchoolStudyLeaderboardItem, ClassLeaderboardItem } from '@shared/protocol/engagement'

export type LeaderboardCategory =
  | 'hoc_tap'
  | 'chess'
  | 'xiangqi'
  | 'caro_15'
  | 'solo_snake'
  | 'solo_memory'

interface CategoryConfig {
  id: LeaderboardCategory
  label: string
  icon: string
  sublabel: string
  metricLabel: string
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'hoc_tap', label: 'Học tập', icon: '📚', sublabel: 'XP học tập', metricLabel: 'XP' },
  { id: 'chess', label: 'Cờ Vua', icon: '♟️', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm' },
  { id: 'xiangqi', label: 'Cờ Tướng', icon: '🏮', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm' },
  { id: 'caro_15', label: 'Caro', icon: '⚔️', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm' },
  { id: 'solo_snake', label: 'Rắn Săn Mồi', icon: '🐍', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm' },
  { id: 'solo_memory', label: 'Trí Nhớ', icon: '🧠', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm' },
]

interface UnifiedRankingEntry {
  rank: number
  id: string | number
  name: string
  avatar?: string | null
  score: number
  scoreLabel: string
  level?: number
  streak?: number
  className?: string
  isCurrentUser: boolean
  accountId?: number
}

function parseCategoryParam(raw: string | null): LeaderboardCategory {
  if (!raw) return 'hoc_tap'
  const clean = raw.toLowerCase().trim()
  if (clean === 'study' || clean === 'hoc_tap') return 'hoc_tap'
  if (clean === 'chess') return 'chess'
  if (clean === 'xiangqi') return 'xiangqi'
  if (clean === 'caro' || clean === 'caro_15') return 'caro_15'
  if (clean === 'snake' || clean === 'solo_snake') return 'solo_snake'
  if (clean === 'memory' || clean === 'solo_memory') return 'solo_memory'
  return 'hoc_tap'
}

export function LeaderboardPage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCat = parseCategoryParam(
    searchParams.get('category') || searchParams.get('game') || searchParams.get('tab'),
  )
  const [category, setCategoryState] = useState<LeaderboardCategory>(initialCat)
  const [studyScope, setStudyScope] = useState<'school' | 'class'>('school')
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)

  const setCategory = useCallback(
    (newCat: LeaderboardCategory) => {
      setCategoryState(newCat)
      setSearchParams(
        (prev: URLSearchParams) => {
          const next = new URLSearchParams(prev)
          next.set('category', newCat)
          next.delete('game')
          next.delete('tab')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // ── 1. Fetch School-wide Study Leaderboard ──
  const {
    data: schoolStudyData,
    isLoading: isSchoolStudyLoading,
    isError: isSchoolStudyError,
    error: schoolStudyError,
    refetch: refetchSchoolStudy,
    isRefetching: isSchoolStudyRefetching,
  } = useQuery({
    queryKey: ['leaderboard-school-study'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard/school', { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Không thể tải bảng xếp hạng học tập toàn trường.')
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        items?: SchoolStudyLeaderboardItem[]
        loi?: string
      } | null
      if (!json?.ok) throw new Error(json?.loi || 'Không thể tải bảng xếp hạng học tập.')
      return json.items ?? []
    },
    enabled: category === 'hoc_tap' && studyScope === 'school',
    staleTime: 30_000,
  })

  // ── 2. Fetch Class Weekly Study Leaderboard ──
  const coLop = Boolean(nguoiDung?.lopId)
  const {
    data: classStudyData,
    isLoading: isClassStudyLoading,
    isError: isClassStudyError,
    error: classStudyError,
    refetch: refetchClassStudy,
    isRefetching: isClassStudyRefetching,
  } = useQuery({
    queryKey: ['leaderboard-class-study', nguoiDung?.lopId],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard', { credentials: 'same-origin' })
      if (!res.ok) throw new Error('Không thể tải bảng thi đua tuần của lớp.')
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        lopTen?: string | null
        currentWeek?: string
        items?: ClassLeaderboardItem[]
        loi?: string
      } | null
      if (!json?.ok) throw new Error(json?.loi || 'Không thể tải bảng thi đua của lớp.')
      return json
    },
    enabled: category === 'hoc_tap' && studyScope === 'class' && coLop,
    staleTime: 30_000,
  })

  // ── 3. Fetch Game Highscores (Server-Verified Only) ──
  const {
    data: gameData,
    isLoading: isGameLoading,
    isError: isGameError,
    error: gameError,
    refetch: refetchGame,
    isRefetching: isGameRefetching,
  } = useQuery({
    queryKey: ['leaderboard-game-highscores', category],
    queryFn: async () => {
      const res = await fetch(`/api/game/highscores?gameType=${category}&limit=50&verifiedOnly=1`, {
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error('Không thể tải kỷ lục trò chơi.')
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        highscores?: HighScoreRecord[]
        loi?: string
      } | null
      if (!json?.ok) throw new Error(json?.loi || 'Không thể tải kỷ lục trò chơi.')
      return json.highscores ?? []
    },
    enabled: category !== 'hoc_tap',
    staleTime: 30_000,
  })

  // ── Unified Loading & Error States ──
  const isLoading =
    category === 'hoc_tap'
      ? studyScope === 'school'
        ? isSchoolStudyLoading
        : isClassStudyLoading
      : isGameLoading

  const isRefetching =
    category === 'hoc_tap'
      ? studyScope === 'school'
        ? isSchoolStudyRefetching
        : isClassStudyRefetching
      : isGameRefetching

  const isError =
    category === 'hoc_tap'
      ? studyScope === 'school'
        ? isSchoolStudyError
        : isClassStudyError
      : isGameError

  const errorObj =
    category === 'hoc_tap'
      ? studyScope === 'school'
        ? schoolStudyError
        : classStudyError
      : gameError

  const handleRefresh = useCallback(() => {
    if (category === 'hoc_tap') {
      if (studyScope === 'school') void refetchSchoolStudy()
      else void refetchClassStudy()
    } else {
      void refetchGame()
    }
  }, [category, studyScope, refetchSchoolStudy, refetchClassStudy, refetchGame])

  // ── Unified Authoritative Entries ──
  const entries: UnifiedRankingEntry[] = useMemo(() => {
    if (category === 'hoc_tap') {
      if (studyScope === 'school') {
        return (schoolStudyData ?? []).map((item) => {
          const isMe = Boolean(
            nguoiDung && (item.playerName === (nguoiDung.ten?.trim() || nguoiDung.username)),
          )
          return {
            rank: item.rank,
            id: `school-${item.rank}-${item.playerName}`,
            name: item.playerName,
            score: item.totalXp,
            scoreLabel: 'XP',
            level: item.level,
            isCurrentUser: isMe,
            accountId: isMe ? nguoiDung?.accountId : undefined,
          }
        })
      } else {
        return (classStudyData?.items ?? []).map((item) => ({
          rank: item.rank,
          id: `class-${item.accountId}`,
          name: item.displayName,
          avatar: item.avatar,
          score: item.weeklyXp,
          scoreLabel: 'XP tuần',
          streak: item.currentStreak > 0 ? item.currentStreak : undefined,
          className: classStudyData?.lopTen ?? undefined,
          isCurrentUser: item.isCurrentUser,
          accountId: item.accountId,
        }))
      }
    }

    // Games highscores
    return (gameData ?? []).map((item, idx) => {
      const isMe = Boolean(
        nguoiDung && (item.playerName === (nguoiDung.ten?.trim() || nguoiDung.username)),
      )
      return {
        rank: idx + 1,
        id: `game-${item.id}-${item.playerName}`,
        name: item.playerName,
        score: item.score,
        scoreLabel: 'điểm',
        level: item.level || tinhLevel(item.totalXp ?? 0),
        isCurrentUser: isMe,
        accountId: isMe ? nguoiDung?.accountId : undefined,
      }
    })
  }, [category, studyScope, schoolStudyData, classStudyData, gameData, nguoiDung])

  const moHoSo = useCallback((accountId: number, ten: string, avatar?: string | null, rect?: DOMRect) => {
    setNguoiXem({
      id: accountId,
      ten,
      avatar,
      anchorRect: rect
        ? {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
          }
        : null,
    })
  }, [])

  // Podium is displayed strictly when there are at least 3 real entries
  const showPodium = entries.length >= 3
  const top1 = showPodium ? entries[0] : null
  const top2 = showPodium ? entries[1] : null
  const top3 = showPodium ? entries[2] : null
  const restEntries = showPodium ? entries.slice(3) : entries

  const activeCategoryConfig = useMemo(
    () => CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[0],
    [category],
  )

  return (
    <div className="space-y-6 sm:space-y-8 pb-12" data-testid="leaderboard-page">
      {/* ── 1. Cyber Hero Banner (Matching Mockup 5 - DOUBLED HEIGHT) ── */}
      <div className="relative w-full min-h-[440px] lg:min-h-[480px] flex flex-col justify-center overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-r from-[#040e29] via-[#091538] to-[#040e29] p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.18),rgba(255,255,255,0))]" />

        {/* Background graphic from mockups */}
        <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-50 lg:opacity-85 pointer-events-none overflow-hidden select-none">
          <img
            src="/assets/cyber_mockups/leaderboard_hero_bg.webp"
            alt=""
            className="w-full h-full object-cover object-left mix-blend-screen crisp-image"
          />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 backdrop-blur-md mb-4">
            <Trophy className="size-3.5" />
            <span>Vinh danh thành tích học tập & kỷ lục trò chơi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase drop-shadow-md leading-[1.2]">
            Bảng xếp hạng Digital Campus
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Vinh danh thành tích học tập và kỷ lục trò chơi trên toàn trường. Dữ liệu được tính toán và xác thực tự động theo thời gian thực.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefetching}
              className="h-11 gap-2 rounded-xl border-amber-500/40 bg-amber-500/15 px-5 text-sm font-bold text-amber-300 hover:bg-amber-500/25 hover:text-white active:scale-95 transition-all cursor-pointer shadow-md"
              title="Làm mới bảng xếp hạng"
              aria-label="Làm mới bảng xếp hạng"
            >
              <RefreshCw className={cn('size-4', (isLoading || isRefetching) && 'animate-spin')} />
              <span>Làm mới dữ liệu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout (Desktop 8+4 cols, Mobile 1-col) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        {/* Main Central Stage */}
        <div className="min-w-0 space-y-6">
          {/* ── 2. Category Selector (Authoritative Tabs) ── */}
      <section aria-label="Lựa chọn danh mục xếp hạng" className="space-y-3">
        <div
          role="tablist"
          aria-label="Danh mục bảng xếp hạng"
          className="flex flex-wrap items-center gap-2"
          data-testid="category-tabs"
        >
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.id
            return (
              <button
                key={cat.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  isActive
                    ? 'bg-brand/15 text-brand border border-brand/40 shadow-xs'
                    : 'border border-border-default bg-surface text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Secondary Scope Selector (Only for Học tập when user belongs to a class) ── */}
        {category === 'hoc_tap' && coLop && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-text-tertiary">Phạm vi:</span>
            <div className="inline-flex rounded-lg border border-border-subtle bg-surface p-1">
              <button
                type="button"
                onClick={() => setStudyScope('school')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  studyScope === 'school'
                    ? 'bg-brand/15 text-brand shadow-xs'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <GraduationCap className="size-3.5" />
                <span>Toàn trường (Top 50)</span>
              </button>
              <button
                type="button"
                onClick={() => setStudyScope('class')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  studyScope === 'class'
                    ? 'bg-brand/15 text-brand shadow-xs'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                <Users className="size-3.5" />
                <span>{classStudyData?.lopTen ? `Lớp ${classStudyData.lopTen}` : 'Lớp của bạn'}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── 3. Error State ── */}
      {isError && (
        <section
          aria-label="Thông báo lỗi"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3"
        >
          <AlertCircle className="mx-auto size-8 text-destructive" />
          <h2 className="text-sm font-bold text-destructive">Không thể tải dữ liệu xếp hạng</h2>
          <p className="text-xs text-text-secondary max-w-md mx-auto">
            {errorObj instanceof Error ? errorObj.message : 'Vui lòng kiểm tra lại kết nối mạng.'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="rounded-xl border-destructive/40 text-xs font-semibold hover:bg-destructive/15"
          >
            Thử lại
          </Button>
        </section>
      )}

      {/* ── 4. Loading Skeleton (Zero CLS) ── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Đang tải dữ liệu xếp hạng">
          {/* Podium Skeleton */}
          <div className="h-64 sm:h-72 rounded-2xl border border-border-default bg-surface/50 p-6 flex items-end justify-center gap-4">
            <div className="w-1/3 max-w-[140px] h-36 rounded-t-xl bg-surface-overlay/60" />
            <div className="w-1/3 max-w-[160px] h-52 rounded-t-xl bg-surface-overlay/80" />
            <div className="w-1/3 max-w-[140px] h-28 rounded-t-xl bg-surface-overlay/60" />
          </div>

          {/* Table Skeleton */}
          <div className="rounded-2xl border border-border-default bg-surface divide-y divide-border-subtle overflow-hidden">
            <div className="h-11 bg-surface-overlay/40" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 px-4 flex items-center justify-between gap-4">
                <div className="size-8 rounded-full bg-surface-overlay/70 shrink-0" />
                <div className="h-4 w-32 rounded bg-surface-overlay/70 grow" />
                <div className="h-4 w-16 rounded bg-surface-overlay/70 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Empty State ── */}
      {!isLoading && !isError && entries.length === 0 && (
        <section
          aria-label="Không có dữ liệu"
          className="rounded-2xl border border-border-subtle bg-surface p-12 text-center space-y-3"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-overlay text-text-tertiary">
            <Trophy className="size-6" />
          </div>
          <h2 className="text-base font-bold text-text-primary">Chưa có người chơi ghi danh</h2>
          <p className="text-xs sm:text-sm text-text-secondary max-w-sm mx-auto">
            Chưa có kỷ lục nào được ghi nhận cho danh mục này. Hãy tham gia ngay để ghi tên vào bảng vàng!
          </p>
        </section>
      )}

      {/* ── 6. Top 3 Podium (Sân vinh danh - Chỉ khi có đủ 3 người) ── */}
      {!isLoading && !isError && showPodium && top1 && top2 && top3 && (
        <section
          aria-label="Top 3 dẫn đầu"
          className="relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 via-surface to-surface p-4 sm:p-6 overflow-hidden"
          data-testid="leaderboard-podium"
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-xl mx-auto pt-4 sm:pt-6">
            {/* ── #2 Silver (Left) ── */}
            <div className="flex flex-col items-center text-center min-w-0">
              <button
                type="button"
                disabled={!top2.accountId}
                onClick={(e) =>
                  top2.accountId &&
                  moHoSo(top2.accountId, top2.name, top2.avatar, e.currentTarget.getBoundingClientRect())
                }
                className={cn(
                  'flex flex-col items-center group w-full outline-none',
                  top2.accountId ? 'cursor-pointer' : 'cursor-default',
                )}
                title={top2.accountId ? `Xem hồ sơ của ${top2.name}` : top2.name}
              >
                <div className="relative mb-2 shrink-0">
                  <AnhNguoiDung
                    ten={top2.name}
                    avatar={top2.avatar}
                    className={cn(
                      'size-12 sm:size-16 ring-2 ring-slate-400/80 ring-offset-2 ring-offset-surface shadow-md',
                      top2.isCurrentUser && 'ring-brand',
                    )}
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex size-5 sm:size-6 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-400 text-slate-900 font-black text-[11px] sm:text-xs shadow-sm">
                    2
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-text-primary truncate w-full group-hover:text-brand transition-colors">
                  {top2.name}
                </p>
                {top2.isCurrentUser && (
                  <span className="mt-0.5 rounded bg-brand/15 px-1.5 py-0.2 text-[10px] font-bold text-brand">
                    Bạn
                  </span>
                )}
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {top2.score.toLocaleString('vi-VN')}{' '}
                  <span className="text-[10px] sm:text-xs font-normal text-text-tertiary">
                    {top2.scoreLabel}
                  </span>
                </p>
              </button>

              <div className="mt-3 w-full h-20 sm:h-24 rounded-t-xl bg-gradient-to-t from-slate-500/20 via-slate-400/10 to-surface-raised border-t border-slate-400/30 flex flex-col items-center justify-center">
                <Medal className="size-4 sm:size-5 text-slate-400 mb-1" />
                <span className="text-base sm:text-lg font-black text-slate-500 dark:text-slate-400">#2</span>
              </div>
            </div>

            {/* ── #1 Gold (Center, Elevated) ── */}
            <div className="flex flex-col items-center text-center min-w-0 -mt-4 sm:-mt-6">
              <button
                type="button"
                disabled={!top1.accountId}
                onClick={(e) =>
                  top1.accountId &&
                  moHoSo(top1.accountId, top1.name, top1.avatar, e.currentTarget.getBoundingClientRect())
                }
                className={cn(
                  'flex flex-col items-center group w-full outline-none',
                  top1.accountId ? 'cursor-pointer' : 'cursor-default',
                )}
                title={top1.accountId ? `Xem hồ sơ của ${top1.name}` : top1.name}
              >
                <Crown className="size-5 sm:size-6 text-amber-500 mb-1 animate-pulse" />
                <div className="relative mb-2 shrink-0">
                  <AnhNguoiDung
                    ten={top1.name}
                    avatar={top1.avatar}
                    className={cn(
                      'size-14 sm:size-20 ring-3 ring-amber-400 ring-offset-2 ring-offset-surface shadow-lg',
                      top1.isCurrentUser && 'ring-brand',
                    )}
                  />
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex size-6 sm:size-7 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md">
                    1
                  </span>
                </div>
                <p className="text-xs sm:text-base font-black text-text-primary truncate w-full group-hover:text-brand transition-colors">
                  {top1.name}
                </p>
                {top1.isCurrentUser && (
                  <span className="mt-0.5 rounded bg-brand/15 px-1.5 py-0.2 text-[10px] font-bold text-brand">
                    Bạn
                  </span>
                )}
                <p className="mt-0.5 text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {top1.score.toLocaleString('vi-VN')}{' '}
                  <span className="text-[10px] sm:text-xs font-normal text-text-tertiary">
                    {top1.scoreLabel}
                  </span>
                </p>
              </button>

              <div className="mt-3 w-full h-28 sm:h-34 rounded-t-2xl bg-gradient-to-t from-amber-500/25 via-amber-500/10 to-surface-raised border-t border-amber-400/50 flex flex-col items-center justify-center shadow-xs">
                <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">#1</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">
                  Quán quân
                </span>
              </div>
            </div>

            {/* ── #3 Bronze (Right) ── */}
            <div className="flex flex-col items-center text-center min-w-0">
              <button
                type="button"
                disabled={!top3.accountId}
                onClick={(e) =>
                  top3.accountId &&
                  moHoSo(top3.accountId, top3.name, top3.avatar, e.currentTarget.getBoundingClientRect())
                }
                className={cn(
                  'flex flex-col items-center group w-full outline-none',
                  top3.accountId ? 'cursor-pointer' : 'cursor-default',
                )}
                title={top3.accountId ? `Xem hồ sơ của ${top3.name}` : top3.name}
              >
                <div className="relative mb-2 shrink-0">
                  <AnhNguoiDung
                    ten={top3.name}
                    avatar={top3.avatar}
                    className={cn(
                      'size-12 sm:size-16 ring-2 ring-amber-700/80 ring-offset-2 ring-offset-surface shadow-md',
                      top3.isCurrentUser && 'ring-brand',
                    )}
                  />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex size-5 sm:size-6 items-center justify-center rounded-full bg-amber-700 text-white font-black text-[11px] sm:text-xs shadow-sm">
                    3
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-text-primary truncate w-full group-hover:text-brand transition-colors">
                  {top3.name}
                </p>
                {top3.isCurrentUser && (
                  <span className="mt-0.5 rounded bg-brand/15 px-1.5 py-0.2 text-[10px] font-bold text-brand">
                    Bạn
                  </span>
                )}
                <p className="mt-0.5 text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-500 tabular-nums">
                  {top3.score.toLocaleString('vi-VN')}{' '}
                  <span className="text-[10px] sm:text-xs font-normal text-text-tertiary">
                    {top3.scoreLabel}
                  </span>
                </p>
              </button>

              <div className="mt-3 w-full h-16 sm:h-20 rounded-t-xl bg-gradient-to-t from-amber-800/20 via-amber-800/10 to-surface-raised border-t border-amber-700/30 flex flex-col items-center justify-center">
                <Medal className="size-4 sm:size-5 text-amber-700 mb-1" />
                <span className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-600">#3</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 7. Ranking List / Table ── */}
      {!isLoading && !isError && restEntries.length > 0 && (
        <section
          aria-label="Danh sách xếp hạng"
          className="rounded-2xl border border-border-default bg-surface overflow-hidden shadow-xs"
          data-testid="ranking-list"
        >
          {/* Table Header */}
          <div className="grid grid-cols-[2.75rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_6rem_8rem] items-center px-4 py-3 border-b border-border-subtle bg-surface-raised/50 text-xs font-bold text-text-tertiary uppercase tracking-wider">
            <span className="text-center">Hạng</span>
            <span>Thành viên</span>
            <span className="hidden sm:block text-center">Cấp độ</span>
            <span className="text-right">{activeCategoryConfig.sublabel}</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-border-subtle">
            {restEntries.map((item) => {
              const isClickable = Boolean(item.accountId)
              return (
                <div
                  key={item.id}
                  data-testid="ranking-row"
                  className={cn(
                    'grid grid-cols-[2.75rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_6rem_8rem] items-center px-4 py-3 transition-colors',
                    item.isCurrentUser
                      ? 'bg-brand/10 border-l-4 border-l-brand'
                      : 'hover:bg-surface-overlay/80',
                  )}
                >
                  {/* Rank */}
                  <span className="text-center text-sm font-black text-text-tertiary tabular-nums">
                    #{item.rank}
                  </span>

                  {/* Member info */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <AnhNguoiDung ten={item.name} avatar={item.avatar} className="size-8 sm:size-9" />
                    <div className="min-w-0">
                      {isClickable ? (
                        <button
                          type="button"
                          onClick={(e) =>
                            moHoSo(item.accountId!, item.name, item.avatar, e.currentTarget.getBoundingClientRect())
                          }
                          className="text-left font-bold text-xs sm:text-sm text-text-primary hover:text-brand transition-colors truncate block max-w-full cursor-pointer outline-none focus-visible:underline"
                        >
                          {item.name}
                        </button>
                      ) : (
                        <p className="font-bold text-xs sm:text-sm text-text-primary truncate">{item.name}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {item.isCurrentUser && (
                          <span className="rounded bg-brand/15 px-1.5 py-0.2 text-[10px] font-bold text-brand">
                            Bạn
                          </span>
                        )}
                        {item.streak !== undefined && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <Flame className="size-3" />
                            {item.streak} ngày
                          </span>
                        )}
                        {item.className && (
                          <span className="text-[10px] sm:text-[11px] text-text-tertiary truncate">
                            {item.className}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="hidden sm:flex justify-center">
                    {item.level ? (
                      <span className="rounded-lg border border-border-subtle bg-surface-overlay px-2 py-0.5 text-xs font-semibold text-text-secondary tabular-nums">
                        Lv.{item.level}
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="font-mono text-xs sm:text-sm font-bold text-text-primary tabular-nums">
                      {item.score.toLocaleString('vi-VN')}
                    </span>
                    <span className="ml-1 text-[11px] text-text-tertiary font-normal">
                      {item.scoreLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
        </div>

        {/* ── Right Rail (Widgets) ── */}
        <aside className="space-y-4">
          {/* Card: Quy tắc tính điểm */}
          <div className="rounded-2xl border border-border-default/80 bg-surface/80 backdrop-blur-md p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Sparkles className="size-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Quy tắc tính điểm
              </h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Điểm thi đua học tập và kỷ lục trò chơi được ghi nhận từ hoạt động thực tế trên nền tảng. Hệ thống tự động kiểm tra tính hợp lệ qua cơ chế xác thực máy chủ (Server-Authoritative).
            </p>
            <div className="pt-2 text-[11px] text-text-tertiary border-t border-border-subtle flex items-center justify-between">
              <span>Chu kỳ cập nhật:</span>
              <span className="font-semibold text-text-secondary">Thời gian thực</span>
            </div>
          </div>

          {/* Card: Thành tích của bạn */}
          {nguoiDung && (
            <div className="rounded-2xl border border-brand/25 bg-gradient-to-br from-surface to-brand/5 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5 text-brand">
                <Medal className="size-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Thành tích của bạn
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <AnhNguoiDung ten={nguoiDung.ten || nguoiDung.username} avatar={nguoiDung.avatar} className="size-11 ring-2 ring-brand/30" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {nguoiDung.ten || nguoiDung.username}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    {nguoiDung.lop?.ten ? `Lớp ${nguoiDung.lop.ten}` : 'Học sinh'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/me')}
                className="w-full h-8 text-xs font-semibold rounded-xl border-brand/30 text-brand hover:bg-brand/10 gap-1.5 cursor-pointer"
              >
                <span>Xem hồ sơ & huy hiệu</span>
                <ArrowRight className="size-3" />
              </Button>
            </div>
          )}

          {/* Card: Tích lũy thêm điểm */}
          <div className="rounded-2xl border border-border-default/80 bg-surface/80 backdrop-blur-md p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Tích lũy thêm điểm
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/learn')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border-default/60 hover:border-brand/40 bg-surface-overlay/50 hover:bg-surface-overlay text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <BookOpen className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary group-hover:text-brand transition-colors truncate">
                      Vào phòng học tập
                    </p>
                    <p className="text-[11px] text-text-tertiary truncate">+XP khi hoàn thành phiên học</p>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-text-tertiary group-hover:text-brand transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/arena')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border-default/60 hover:border-violet-500/40 bg-surface-overlay/50 hover:bg-surface-overlay text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                    <Gamepad2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary group-hover:text-violet-400 transition-colors truncate">
                      Đấu trường trò chơi
                    </p>
                    <p className="text-[11px] text-text-tertiary truncate">Ghi điểm kỷ lục Cờ, Caro, Rắn</p>
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-text-tertiary group-hover:text-violet-400 transition-colors" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── 8. User Profile Modal Integration ── */}
      {nguoiXem && <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />}
    </div>
  )
}
