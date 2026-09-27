import { useState, useRef, useEffect } from 'react'
import { Trophy, ChevronLeft, ChevronRight, RefreshCw, Crown, Award, Medal } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import type { HighScoreRecord } from './GameLeaderboard'
import { tinhLevel } from './GameLeaderboard'

interface TabGameConfig {
  id: GameType
  label: string
  icon: string
  accentGradient: string
}

const LEADERBOARD_TABS: TabGameConfig[] = [
  { id: 'chess', label: 'Cờ Vua', icon: '♟️', accentGradient: 'from-amber-500/30 to-yellow-600/10' },
  { id: 'xiangqi', label: 'Cờ Tướng', icon: '🏮', accentGradient: 'from-rose-500/30 to-red-600/10' },
  { id: 'caro_15', label: 'Caro', icon: '⚔️', accentGradient: 'from-cyan-500/30 to-blue-600/10' },
  { id: 'solo_memory', label: 'Trí Nhớ', icon: '🧠', accentGradient: 'from-purple-500/30 to-pink-600/10' },
  { id: 'solo_snake', label: 'Rắn Săn Mồi', icon: '🐍', accentGradient: 'from-emerald-500/30 to-teal-600/10' },
]

// ─── Fetch helper ────────────────────────────────────────────────────────────

interface PhanHoiHighScore {
  ok: boolean
  highscores?: HighScoreRecord[]
  loi?: string
}

async function layBangXepHang(gameType: string, limit = 50): Promise<HighScoreRecord[]> {
  const params = new URLSearchParams({ gameType, limit: String(limit) })
  const res = await fetch(`/api/game/highscores?${params}`, { credentials: 'same-origin' })
  const data = (await res.json().catch(() => null)) as PhanHoiHighScore | null
  if (!res.ok || !data?.ok) throw new Error(data?.loi || `Lỗi ${res.status}`)
  return data.highscores ?? []
}

// ─── Avatar initials ─────────────────────────────────────────────────────────

const AVATAR_COLORS: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#06b6d4'],
  ['#10b981', '#14b8a6'],
  ['#f59e0b', '#f97316'],
  ['#ec4899', '#f43f5e'],
  ['#a855f7', '#d946ef'],
]

function getAvatarGradient(name: string): [string, string] {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function AvatarInitials({
  name,
  size = 'md',
  ringClass,
}: {
  name: string
  size?: 'lg' | 'md' | 'sm'
  ringClass?: string
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const [from, to] = getAvatarGradient(name)
  const sizeClass =
    size === 'lg'
      ? 'size-12 text-base font-black'
      : size === 'md'
        ? 'size-9 text-sm font-black'
        : 'size-7 text-xs font-bold'
  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0 select-none text-white shadow-lg', sizeClass, ringClass)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initial}
    </div>
  )
}

// ─── Champion Spotlight (#1) ─────────────────────────────────────────────────

function ChampionSpotlight({ record, animKey }: { record: HighScoreRecord; animKey: string }) {
  const capDo = record.level ?? tinhLevel(record.totalXp ?? 0)

  return (
    <div key={`champ-${animKey}-${record.id}`} className="px-3 pt-3 pb-1 shrink-0 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-500/20 via-yellow-600/10 to-slate-950/80 p-3.5 shadow-xl backdrop-blur-md">
        {/* Glow hiệu ứng nền */}
        <div className="absolute top-0 right-0 translate-x-3 -translate-y-3 size-24 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative shrink-0">
            <AvatarInitials
              name={record.playerName}
              size="lg"
              ringClass="ring-2 ring-amber-400 shadow-lg shadow-amber-500/30"
            />
            <span className="absolute -top-2.5 -left-1 text-base select-none">👑</span>
            <span className="absolute -bottom-1 -right-1 text-xs select-none">🥇</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Crown className="size-3 text-amber-400 inline" />
                Kỷ Lục Đứng Đầu
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400/20 text-amber-200 border border-amber-400/30">
                Lv.{capDo}
              </span>
            </div>
            <p className="text-sm font-black text-white truncate mt-0.5" title={record.playerName}>
              {record.playerName}
            </p>
            <p className="text-xs text-amber-300 font-mono font-bold mt-0.5">
              {record.score.toLocaleString('vi-VN')}{' '}
              <span className="text-[10px] font-normal text-text-tertiary">điểm</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Row #2+ ─────────────────────────────────────────────────────────────────

function LeaderboardRow({
  record,
  rank,
  delay,
}: {
  record: HighScoreRecord
  rank: number
  delay?: string
}) {
  const capDo = record.level ?? tinhLevel(record.totalXp ?? 0)
  const isTop2 = rank === 2
  const isTop3 = rank === 3

  return (
    <li
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all animate-in fade-in slide-in-from-left-2',
        isTop2
          ? 'bg-gradient-to-r from-slate-400/15 via-slate-300/5 to-transparent border-slate-400/25'
          : isTop3
            ? 'bg-gradient-to-r from-amber-700/15 via-amber-600/5 to-transparent border-amber-700/25'
            : 'border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.08]'
      )}
      style={{ animationDuration: '0.25s', animationDelay: delay, animationFillMode: 'both' }}
    >
      {/* Cột Thứ hạng */}
      <div className="w-6 text-center shrink-0">
        {isTop2 ? (
          <span className="text-base leading-none select-none">🥈</span>
        ) : isTop3 ? (
          <span className="text-base leading-none select-none">🥉</span>
        ) : (
          <span className="text-xs font-bold text-text-tertiary tabular-nums">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <AvatarInitials
        name={record.playerName}
        size={isTop2 ? 'md' : 'sm'}
        ringClass={isTop2 ? 'ring-2 ring-slate-300/40' : isTop3 ? 'ring-2 ring-amber-700/40' : undefined}
      />

      {/* Tên người chơi */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'font-bold truncate text-xs block',
            isTop2 ? 'text-slate-200' : isTop3 ? 'text-amber-300/90' : 'text-text-primary'
          )}
          title={record.playerName}
        >
          {record.playerName}
        </span>
      </div>

      {/* Cấp độ Lv */}
      <span
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black border shrink-0',
          capDo >= 20
            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
            : capDo >= 10
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              : capDo >= 5
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
                : 'bg-white/5 text-slate-400 border-white/10'
        )}
      >
        Lv.{capDo}
      </span>

      {/* Điểm số */}
      <span
        className={cn(
          'font-mono font-bold tabular-nums text-xs shrink-0 text-right min-w-[46px]',
          isTop2 ? 'text-slate-200' : isTop3 ? 'text-amber-400/90' : 'text-amber-300'
        )}
      >
        {record.score.toLocaleString('vi-VN')}
      </span>
    </li>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonLeaderboard() {
  return (
    <div className="flex flex-col flex-1 min-h-0 p-3 space-y-3">
      {/* Champion card skeleton */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 animate-pulse flex items-center gap-3">
        <div className="size-12 rounded-full bg-white/10 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="h-3 w-16 rounded bg-white/10" />
        </div>
      </div>
      <div className="h-px bg-white/5 my-2" />
      {/* Rows skeleton */}
      <ul className="space-y-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.02] animate-pulse">
            <div className="size-5 rounded bg-white/10 shrink-0" />
            <div className="size-7 rounded-full bg-white/10 shrink-0" />
            <div className="h-3 flex-1 rounded bg-white/10" />
            <div className="h-4 w-9 rounded bg-white/10" />
            <div className="h-3 w-12 rounded bg-white/10" />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface GameArenaLeaderboardProps {
  defaultGame?: GameType
  className?: string
}

export function GameArenaLeaderboard({ defaultGame, className }: GameArenaLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<GameType>(() => defaultGame ?? 'chess')
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (defaultGame) setActiveTab(defaultGame)
  }, [defaultGame])

  // Tự động cuộn tab bar nội bộ về tab đang chọn (Chống window scroll)
  useEffect(() => {
    const container = tabsContainerRef.current
    if (!container) return
    const activeEl = container.querySelector<HTMLElement>(`[data-tab-id="${activeTab}"]`)
    if (activeEl) {
      const targetLeft = activeEl.offsetLeft - container.clientWidth / 2 + activeEl.clientWidth / 2
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    }
  }, [activeTab])

  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)
  const dragDistance = useRef(0)
  const [isDraggingActive, setIsDraggingActive] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const el = tabsContainerRef.current
    if (!el) return
    isDragging.current = true
    dragDistance.current = 0
    startX.current = e.pageX
    scrollLeftStart.current = el.scrollLeft

    const handleWindowMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !tabsContainerRef.current) return
      const diffX = moveEvent.pageX - startX.current
      dragDistance.current = Math.abs(diffX)
      if (dragDistance.current > 10) {
        setIsDraggingActive(true)
        tabsContainerRef.current.scrollLeft = scrollLeftStart.current - diffX
      }
    }

    const handleWindowMouseUp = () => {
      isDragging.current = false
      setIsDraggingActive(false)
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
      setTimeout(() => { dragDistance.current = 0 }, 50)
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
  }

  const handleTabClick = (tabId: GameType) => {
    if (dragDistance.current > 10) return
    setActiveTab(tabId)
    if (listRef.current) listRef.current.scrollTop = 0
  }

  const activeTabCfg = LEADERBOARD_TABS.find((t) => t.id === activeTab) ?? LEADERBOARD_TABS[0]
  const info = GAME_CATALOG_BY_ID[activeTab]

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['game-highscores', activeTab, 50],
    queryFn: () => layBangXepHang(activeTab, 50),
    staleTime: 30_000,
  })

  const records = data ?? []
  const champion = records[0]
  const remaining = records.slice(1)

  return (
    <section
      aria-labelledby="arena-leaderboard-heading"
      className={cn(
        'flex flex-col h-[700px] xl:h-[720px] 2xl:h-[740px] overflow-hidden rounded-2xl border border-white/10',
        'bg-gradient-to-b from-[#0e1527]/97 to-[#080c1a]/95 backdrop-blur-md shadow-2xl',
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-yellow-600/10 border border-amber-500/30">
            <Trophy className="size-4 text-amber-400" />
          </div>
          <div>
            <h2
              id="arena-leaderboard-heading"
              className="text-sm font-black tracking-tight text-white leading-none"
            >
              Bảng Xếp Hạng
            </h2>
            <p className="text-[10px] text-text-tertiary mt-0.5 leading-none">{info.shortTitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isPending || isRefetching}
          aria-label="Tải lại bảng xếp hạng"
          className="flex size-7 items-center justify-center rounded-lg hover:bg-white/8 transition-colors text-text-tertiary hover:text-white disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={cn('size-3.5', (isPending || isRefetching) && 'animate-spin')} />
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="relative border-b border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={() => tabsContainerRef.current?.scrollBy({ left: -100, behavior: 'smooth' })}
          aria-label="Trượt sang trái"
          className="absolute left-0 top-0 bottom-0 z-10 flex w-6 items-center justify-center bg-gradient-to-r from-[#0e1527] via-[#0e1527]/80 to-transparent text-text-tertiary hover:text-white transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div
          ref={tabsContainerRef}
          onMouseDown={handleMouseDown}
          className={cn(
            'flex items-center gap-1 overflow-x-auto px-6 py-2 scrollbar-none select-none touch-pan-x',
            isDraggingActive ? 'cursor-grabbing' : 'cursor-default'
          )}
        >
          {LEADERBOARD_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all duration-150 shrink-0 select-none cursor-pointer border',
                  isActive
                    ? cn('bg-gradient-to-r text-white border-white/20 shadow-md', tab.accentGradient)
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-white/5 border-transparent'
                )}
              >
                <span className="text-sm leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => tabsContainerRef.current?.scrollBy({ left: 100, behavior: 'smooth' })}
          aria-label="Trượt sang phải"
          className="absolute right-0 top-0 bottom-0 z-10 flex w-6 items-center justify-center bg-gradient-to-l from-[#0e1527] via-[#0e1527]/80 to-transparent text-text-tertiary hover:text-white transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* ── Content ── */}
      {isPending ? (
        <SkeletonLeaderboard />
      ) : isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Trophy className="size-5 text-rose-400" />
          </div>
          <p className="text-xs text-text-secondary">Không tải được bảng xếp hạng</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-text-secondary hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3" />
            Thử lại
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="size-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-3xl">
            {activeTabCfg.icon}
          </div>
          <div>
            <p className="text-sm font-bold text-white">Chưa có ai lên bảng!</p>
            <p className="text-xs text-text-tertiary mt-1">Chơi {activeTabCfg.label} để lập kỷ lục đầu tiên 🏆</p>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Top 1 Champion Spotlight */}
          {champion && <ChampionSpotlight record={champion} animKey={activeTab} />}

          {/* Vị trí còn trống nếu mới có 1 hoặc 2 người */}
          {records.length === 1 && (
            <div className="mx-3 mt-2 mb-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3 text-center animate-in fade-in">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold">
                <Medal className="size-4" />
                <span>Còn trống vị trí #2 và #3</span>
              </div>
              <p className="text-[11px] text-text-tertiary mt-1">
                Tham gia thi đấu ngay để ghi tên mình lên bảng vàng!
              </p>
            </div>
          )}

          {records.length === 2 && (
            <div className="mx-3 mt-2 mb-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-2 text-center animate-in fade-in">
              <span className="text-[11px] text-text-tertiary flex items-center justify-center gap-1">
                <Award className="size-3.5 text-amber-500" />
                Vị trí #3 đang chờ người thách đấu tiếp theo
              </span>
            </div>
          )}

          {/* Danh sách thứ hạng tiếp theo */}
          {remaining.length > 0 && (
            <>
              <div className="flex items-center gap-2 px-4 my-2 shrink-0">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                  Thứ hạng khác ({remaining.length})
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <ol className="space-y-1 px-2 pb-3">
                {remaining.map((row, i) => (
                  <LeaderboardRow
                    key={row.id}
                    record={row}
                    rank={i + 2}
                    delay={`${i * 25}ms`}
                  />
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </section>
  )
}
