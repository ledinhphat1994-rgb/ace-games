import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { Trophy, RefreshCw, Crown, Flame, AlertCircle, Medal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { tinhLevel, type HighScoreRecord } from '@/features/games/GameLeaderboard'
import {
  IconCrown3D,
  IconXiangqiPiece3D,
  IconCaroCubes3D,
  IconSnakeApple3D,
  IconManaCrystal3D,
} from '@/features/games/GameArt3D'
import type { SchoolStudyLeaderboardItem } from '@shared/protocol/engagement'

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
  sublabel: string
  metricLabel: string
  Icon: React.ComponentType<{ size?: number | string; className?: string }>
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'chess', label: 'Cờ Vua', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm', Icon: IconCrown3D },
  { id: 'xiangqi', label: 'Cờ Tướng', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm', Icon: IconXiangqiPiece3D },
  { id: 'caro_15', label: 'Caro', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm', Icon: IconCaroCubes3D },
  { id: 'solo_snake', label: 'Rắn Săn Mồi', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm', Icon: IconSnakeApple3D },
  { id: 'solo_memory', label: 'Trí Nhớ', sublabel: 'Kỷ lục xác thực', metricLabel: 'điểm', Icon: IconManaCrystal3D },
]

// Nhân bản 3 lần danh sách danh mục để tạo đường trượt vô tận mượt mà
const REPEATED_CATEGORIES = [...CATEGORIES, ...CATEGORIES, ...CATEGORIES]

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
  if (!raw) return 'chess'
  const clean = raw.toLowerCase().trim()
  if (clean === 'chess') return 'chess'
  if (clean === 'xiangqi') return 'xiangqi'
  if (clean === 'caro' || clean === 'caro_15') return 'caro_15'
  if (clean === 'snake' || clean === 'solo_snake') return 'solo_snake'
  if (clean === 'memory' || clean === 'solo_memory') return 'solo_memory'
  if (clean === 'study' || clean === 'hoc_tap') return 'hoc_tap'
  return 'chess'
}

export function LeaderboardPage() {
  const { nguoiDung } = usePhien()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCat = parseCategoryParam(
    searchParams.get('category') || searchParams.get('game') || searchParams.get('tab'),
  )
  const [category, setCategoryState] = useState<LeaderboardCategory>(initialCat)
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)

  // ── Drag & Slow Auto-scroll State cho Vùng 2 (Tabs Game Logos) ──
  const scrollTrackRef = useRef<HTMLDivElement>(null)
  const isInteractingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollStartRef = useRef(0)
  const hasMovedRef = useRef(false)
  const rafAutoScrollId = useRef<number | null>(null)
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // ── Hiệu ứng Auto-scroll chạy ngang từ từ & Hold-and-Drag linh hoạt ──
  useEffect(() => {
    const el = scrollTrackRef.current
    if (!el) return

    // Canh giữa track ban đầu
    const oneSetWidth = el.scrollWidth / 3
    if (el.scrollLeft === 0 && oneSetWidth > 0) {
      el.scrollLeft = oneSetWidth
    }

    const autoScrollLoop = () => {
      if (!isInteractingRef.current && el) {
        el.scrollLeft += 0.45 // Tốc độ chạy ngang từ từ êm dịu
        const currentOneSet = el.scrollWidth / 3
        if (currentOneSet > 0) {
          if (el.scrollLeft >= currentOneSet * 2) {
            el.scrollLeft -= currentOneSet
          } else if (el.scrollLeft <= 0) {
            el.scrollLeft += currentOneSet
          }
        }
      }
      rafAutoScrollId.current = requestAnimationFrame(autoScrollLoop)
    }

    rafAutoScrollId.current = requestAnimationFrame(autoScrollLoop)

    return () => {
      if (rafAutoScrollId.current) cancelAnimationFrame(rafAutoScrollId.current)
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    }
  }, [])

  const pauseAutoScroll = useCallback(() => {
    isInteractingRef.current = true
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
  }, [])

  const scheduleResumeAutoScroll = useCallback(() => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current)
    resumeTimeoutRef.current = setTimeout(() => {
      isInteractingRef.current = false
    }, 1500)
  }, [])

  // Mouse Drag Handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !scrollTrackRef.current) return
    pauseAutoScroll()
    startXRef.current = e.pageX
    scrollStartRef.current = scrollTrackRef.current.scrollLeft
    hasMovedRef.current = false
  }, [pauseAutoScroll])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current || e.buttons !== 1 || !scrollTrackRef.current) return
    const deltaX = e.pageX - startXRef.current
    if (Math.abs(deltaX) > 4) {
      hasMovedRef.current = true
    }
    const el = scrollTrackRef.current
    el.scrollLeft = scrollStartRef.current - deltaX
    const oneSet = el.scrollWidth / 3
    if (oneSet > 0) {
      if (el.scrollLeft >= oneSet * 2) {
        el.scrollLeft -= oneSet
        scrollStartRef.current -= oneSet
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += oneSet
        scrollStartRef.current += oneSet
      }
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    scheduleResumeAutoScroll()
    setTimeout(() => {
      hasMovedRef.current = false
    }, 60)
  }, [scheduleResumeAutoScroll])

  // Touch Drag Handlers
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollTrackRef.current || e.touches.length !== 1) return
    pauseAutoScroll()
    startXRef.current = e.touches[0].pageX
    scrollStartRef.current = scrollTrackRef.current.scrollLeft
    hasMovedRef.current = false
  }, [pauseAutoScroll])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current || !scrollTrackRef.current || e.touches.length !== 1) return
    const deltaX = e.touches[0].pageX - startXRef.current
    if (Math.abs(deltaX) > 4) {
      hasMovedRef.current = true
    }
    const el = scrollTrackRef.current
    el.scrollLeft = scrollStartRef.current - deltaX
    const oneSet = el.scrollWidth / 3
    if (oneSet > 0) {
      if (el.scrollLeft >= oneSet * 2) {
        el.scrollLeft -= oneSet
        scrollStartRef.current -= oneSet
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += oneSet
        scrollStartRef.current += oneSet
      }
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    scheduleResumeAutoScroll()
    setTimeout(() => {
      hasMovedRef.current = false
    }, 60)
  }, [scheduleResumeAutoScroll])

  const handleCategoryClick = useCallback(
    (catId: LeaderboardCategory, e: React.MouseEvent) => {
      if (hasMovedRef.current) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      setCategory(catId)
    },
    [setCategory],
  )

  // ── 1. Fetch School-wide Study Leaderboard (Toàn trường) ──
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
    enabled: category === 'hoc_tap',
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
  const isLoading = category === 'hoc_tap' ? isSchoolStudyLoading : isGameLoading
  const isRefetching = category === 'hoc_tap' ? isSchoolStudyRefetching : isGameRefetching
  const isError = category === 'hoc_tap' ? isSchoolStudyError : isGameError
  const errorObj = category === 'hoc_tap' ? schoolStudyError : gameError

  const handleRefresh = useCallback(() => {
    if (category === 'hoc_tap') {
      void refetchSchoolStudy()
    } else {
      void refetchGame()
    }
  }, [category, refetchSchoolStudy, refetchGame])

  // ── Unified Authoritative Entries ──
  const entries: UnifiedRankingEntry[] = useMemo(() => {
    if (category === 'hoc_tap') {
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
  }, [category, schoolStudyData, gameData, nguoiDung])

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
      {/* ── 1. Cyber Hero Banner (Vùng 1: Tiêu đề ngắn gọn, show trọn vẹn toàn cảnh ảnh gốc không cắt góc) ── */}
      <div className="relative w-full aspect-[16/9] max-h-[320px] sm:max-h-[380px] lg:max-h-[420px] flex flex-col justify-end overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-r from-[#0d0903] via-[#1a1205] to-[#0a0702] p-4 sm:p-6 lg:p-8 shadow-[0_0_35px_rgba(245,158,11,0.18)] select-none">
        {/* Artwork anime vinh danh toàn cảnh - Hiển thị toàn vẹn 100% ảnh gốc, không bị cắt góc */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <img
            src="/assets/banners/leaderboard_hero_cyber.webp"
            alt="Bảng xếp hạng"
            loading="eager"
            decoding="async"
            className="w-full h-full object-contain sm:object-cover object-center opacity-95"
          />
          {/* Lớp gradient mỏng nhẹ chỉ để tôn chữ tiêu đề mà không che khuất bức tranh gốc */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        </div>

        {/* Tiêu đề ngắn gọn & Nút làm mới dữ liệu - Obvious UI Chỉ ghi tiêu đề ngắn gọn */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Bảng xếp hạng
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="h-8 sm:h-9 px-3 gap-1.5 rounded-xl border-amber-500/40 bg-black/50 hover:bg-amber-500/20 text-amber-300 text-xs font-bold backdrop-blur-md cursor-pointer transition-colors shadow-sm"
            title="Làm mới bảng xếp hạng"
            aria-label="Làm mới bảng xếp hạng"
          >
            <RefreshCw className={cn('size-3.5', (isLoading || isRefetching) && 'animate-spin')} />
            <span className="hidden xs:inline">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* ── Bảng xếp hạng chính (Full width) ── */}
      <div className="space-y-6 min-w-0">
        <div className="min-w-0 space-y-6">
          {/* ── 2. Category Selector (Vùng 2: Logo Game Tabs - Chạy ngang từ từ & Hold-and-drag kéo qua kéo lại để chọn) ── */}
          <section aria-label="Lựa chọn danh mục xếp hạng" className="relative group">
            <div
              role="tablist"
              aria-label="Danh mục bảng xếp hạng"
              ref={scrollTrackRef}
              data-testid="category-tabs"
              className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1.5 px-0.5 cursor-grab active:cursor-grabbing select-none"
              onMouseEnter={pauseAutoScroll}
              onMouseLeave={scheduleResumeAutoScroll}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {REPEATED_CATEGORIES.map((cat, idx) => {
                const isActive = category === cat.id
                const IconComp = cat.Icon
                return (
                  <button
                    key={`${cat.id}-${idx}`}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={(e) => handleCategoryClick(cat.id, e)}
                    className={cn(
                      'w-[110px] sm:w-[124px] shrink-0 p-1.5 sm:p-2 rounded-2xl flex flex-col items-center justify-between gap-1 transition-colors duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-brand border-2',
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/40'
                        : 'border-border-default/80 bg-surface/85 text-text-secondary hover:bg-surface-overlay hover:text-text-primary hover:border-amber-500/40',
                    )}
                    title={cat.label}
                  >
                    {/* Logo game to rõ tràn viền theo yêu cầu người dùng */}
                    <div className="w-full flex items-center justify-center py-0.5 overflow-visible">
                      <IconComp
                        size={76}
                        className="w-[74px] h-[74px] sm:w-[86px] sm:h-[86px] drop-shadow-md select-none pointer-events-none"
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate max-w-full text-center pb-0.5">
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── 3. Khung Card Chính Cố Định (Vùng 3: Thẩm mỹ cao, màu sắc sang trọng, chuyên nghiệp, không dài dòng) ── */}
          <section
            aria-label="Bảng vinh danh chính"
            className="rounded-3xl border-2 border-amber-500/30 bg-surface/90 backdrop-blur-md shadow-lg min-h-[580px] lg:min-h-[640px] flex flex-col overflow-hidden relative"
          >
            {/* Header Cố Định Tại Đỉnh Card Chính */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border-subtle bg-surface-raised/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-8 sm:size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
                  <Trophy className="size-4.5 sm:size-5 text-amber-500" />
                </div>
                <h2 className="font-bold text-base sm:text-lg text-text-primary">
                  Bảng vinh danh {activeCategoryConfig.label}
                </h2>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>Thời gian thực</span>
              </div>
            </div>

            {/* Khung Nội Dung Bên Trong Card Chính - Reserved Space */}
            <div className="flex-1 min-h-[500px] flex flex-col">
              {/* A. Error State */}
              {isError && (
                <div
                  aria-label="Thông báo lỗi"
                  className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-3"
                >
                  <AlertCircle className="size-10 text-destructive mb-1" />
                  <h3 className="text-base font-bold text-destructive">Không thể tải dữ liệu xếp hạng</h3>
                  <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
                    {errorObj instanceof Error ? errorObj.message : 'Vui lòng kiểm tra lại kết nối mạng.'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    className="rounded-xl border-destructive/40 text-xs font-semibold hover:bg-destructive/15 mt-2"
                  >
                    Thử lại
                  </Button>
                </div>
              )}

              {/* B. Loading Skeleton (Chiếm trọn khung, Zero CLS) */}
              {isLoading && !isError && (
                <div className="flex-1 flex flex-col p-6 space-y-6 animate-pulse" aria-busy="true" aria-label="Đang tải dữ liệu xếp hạng">
                  {/* Podium Skeleton */}
                  <div className="h-60 sm:h-68 rounded-2xl border border-border-subtle bg-surface-raised/30 p-6 flex items-end justify-center gap-4">
                    <div className="w-1/3 max-w-[140px] h-32 rounded-t-xl bg-surface-overlay/60" />
                    <div className="w-1/3 max-w-[160px] h-48 rounded-t-xl bg-surface-overlay/80" />
                    <div className="w-1/3 max-w-[140px] h-24 rounded-t-xl bg-surface-overlay/60" />
                  </div>

                  {/* Table Skeleton */}
                  <div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface-raised/20 overflow-hidden">
                    <div className="h-10 bg-surface-overlay/40" />
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-13 px-4 flex items-center justify-between gap-4">
                        <div className="size-8 rounded-full bg-surface-overlay/70 shrink-0" />
                        <div className="h-4 w-32 rounded bg-surface-overlay/70 grow" />
                        <div className="h-4 w-16 rounded bg-surface-overlay/70 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* C. Empty State (Căn giữa hoàn hảo, giữ nguyên kích thước Card chính) */}
              {!isLoading && !isError && entries.length === 0 && (
                <div
                  aria-label="Không có dữ liệu"
                  className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center space-y-3"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-raised text-amber-500/80 mb-2 border border-border-subtle shadow-xs">
                    <Trophy className="size-7" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-text-primary">Chưa có người chơi ghi danh</h3>
                  <p className="text-xs sm:text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
                    Chưa có kỷ lục nào được ghi nhận cho danh mục này. Hãy tham gia ngay để ghi tên vào bảng vàng!
                  </p>
                </div>
              )}

              {/* D. Content khi có dữ liệu */}
              {!isLoading && !isError && entries.length > 0 && (
                <div className="flex-1 flex flex-col">
                  {/* Top 3 Podium (Sân vinh danh - Chỉ khi có đủ 3 người) */}
                  {showPodium && top1 && top2 && top3 && (
                    <div
                      aria-label="Top 3 dẫn đầu"
                      className="relative p-4 sm:p-6 border-b border-border-subtle bg-gradient-to-b from-amber-500/10 via-surface-raised/20 to-transparent overflow-hidden"
                      data-testid="leaderboard-podium"
                    >
                      {/* Ambient golden aura spotlight */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[radial-gradient(circle,rgba(245,158,11,0.14)_0%,transparent_70%)] pointer-events-none select-none" />

                      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl sm:max-w-3xl mx-auto pt-4 sm:pt-6 relative z-10">
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
                                  'size-13 sm:size-18 ring-3 ring-slate-300 ring-offset-2 ring-offset-surface shadow-[0_0_16px_rgba(203,213,225,0.25)]',
                                  top2.isCurrentUser && 'ring-brand',
                                )}
                              />
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex size-5 sm:size-6 items-center justify-center rounded-full bg-slate-300 text-slate-900 font-black text-[11px] sm:text-xs shadow-sm ring-2 ring-surface">
                                2
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-text-primary line-clamp-2 leading-tight break-words h-8 sm:h-9 flex items-center justify-center text-center w-full group-hover:text-amber-400 transition-colors">
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

                          <div className="mt-3 w-full h-24 sm:h-30 rounded-t-xl bg-gradient-to-t from-slate-400/30 via-slate-400/15 to-surface-raised border-t-2 border-slate-300 flex flex-col items-center justify-center shadow-[0_-4px_16px_rgba(203,213,225,0.18)] relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
                            <Medal className="size-4 sm:size-5 text-slate-300 mb-0.5" />
                            <span className="text-lg sm:text-xl font-black text-slate-400 dark:text-slate-200 tabular-nums">#2</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Á quân
                            </span>
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
                            <Crown className="size-5 sm:size-6 text-amber-500 mb-1 animate-pulse drop-shadow-sm" />
                            <div className="relative mb-2 shrink-0">
                              <AnhNguoiDung
                                ten={top1.name}
                                avatar={top1.avatar}
                                className={cn(
                                  'size-16 sm:size-22 ring-4 ring-amber-400 ring-offset-2 ring-offset-surface shadow-[0_0_24px_rgba(245,158,11,0.4)]',
                                  top1.isCurrentUser && 'ring-brand',
                                )}
                              />
                              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex size-6 sm:size-7 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md ring-2 ring-surface">
                                1
                              </span>
                            </div>
                            <p className="text-xs sm:text-base font-black text-text-primary line-clamp-2 leading-tight break-words h-9 sm:h-10 flex items-center justify-center text-center w-full group-hover:text-amber-400 transition-colors">
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

                          <div className="mt-3 w-full h-32 sm:h-40 rounded-t-2xl bg-gradient-to-t from-amber-500/35 via-amber-500/15 to-surface-raised border-t-2 border-amber-400 flex flex-col items-center justify-center shadow-[0_-4px_24px_rgba(245,158,11,0.3)] relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                            <span className="text-2xl sm:text-3xl font-black text-amber-500 dark:text-amber-400 tabular-nums">#1</span>
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-500/90 dark:text-amber-400/90">
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
                                  'size-13 sm:size-18 ring-3 ring-amber-600 ring-offset-2 ring-offset-surface shadow-[0_0_16px_rgba(180,83,9,0.25)]',
                                  top3.isCurrentUser && 'ring-brand',
                                )}
                              />
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex size-5 sm:size-6 items-center justify-center rounded-full bg-amber-700 text-white font-black text-[11px] sm:text-xs shadow-sm ring-2 ring-surface">
                                3
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-text-primary line-clamp-2 leading-tight break-words h-8 sm:h-9 flex items-center justify-center text-center w-full group-hover:text-amber-400 transition-colors">
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

                          <div className="mt-3 w-full h-18 sm:h-24 rounded-t-xl bg-gradient-to-t from-amber-800/35 via-amber-800/15 to-surface-raised border-t-2 border-amber-600 flex flex-col items-center justify-center shadow-[0_-4px_16px_rgba(180,83,9,0.18)] relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                            <Medal className="size-4 sm:size-5 text-amber-600 mb-0.5" />
                            <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-500 tabular-nums">#3</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/90 dark:text-amber-500/90">
                              Quý quân
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Ranking List Table ── */}
                  {restEntries.length > 0 && (
                    <div
                      aria-label="Danh sách xếp hạng"
                      className="flex-1 flex flex-col overflow-hidden"
                      data-testid="ranking-list"
                    >
                      {/* Table Header */}
                      <div className="grid grid-cols-[2.75rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_6rem_8rem] items-center px-4 py-3 border-b border-border-subtle bg-surface-raised/50 text-xs font-bold text-text-tertiary uppercase tracking-wider shrink-0">
                        <span className="text-center">Hạng</span>
                        <span>Thành viên</span>
                        <span className="hidden sm:block text-center">Cấp độ</span>
                        <span className="text-right">{activeCategoryConfig.sublabel}</span>
                      </div>

                      {/* Table Rows */}
                      <div className="divide-y divide-border-subtle">
                        {restEntries.map((item) => {
                          const isClickable = Boolean(item.accountId)
                          const isTop5 = item.rank <= 5
                          const isTop10 = item.rank <= 10
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
                              <div className="flex justify-center items-center">
                                <span
                                  className={cn(
                                    'inline-flex items-center justify-center size-6 sm:size-7 rounded-lg text-xs tabular-nums select-none',
                                    isTop5
                                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-black shadow-xs'
                                      : isTop10
                                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                                        : 'bg-surface-raised/80 text-text-secondary border border-border-subtle font-semibold',
                                  )}
                                >
                                  {item.rank}
                                </span>
                              </div>

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
                                      className="text-left font-bold text-xs sm:text-sm text-text-primary hover:text-amber-400 transition-colors truncate block max-w-full cursor-pointer outline-none focus-visible:underline"
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
                                <span className="font-mono text-xs sm:text-sm font-black text-amber-500 dark:text-amber-400 tabular-nums">
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
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── 8. User Profile Modal Integration ── */}
      {nguoiXem && <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />}
    </div>
  )
}
