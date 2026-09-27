import { useState, useRef, useEffect } from 'react'
import { Trophy, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
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

function AvatarInitials({ name, size, ringClass }: { name: string; size: 'lg' | 'md' | 'sm'; ringClass?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const [from, to] = getAvatarGradient(name)
  const sizeClass =
    size === 'lg' ? 'size-12 text-base font-black' : size === 'md' ? 'size-9 text-sm font-black' : 'size-7 text-xs font-bold'
  return (
    <div
      className={cn('rounded-full flex items-center justify-center shrink-0 select-none text-white shadow-lg', sizeClass, ringClass)}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initial}
    </div>
  )
}

// ─── Podium ──────────────────────────────────────────────────────────────────

function Podium({ records, animKey }: { records: HighScoreRecord[]; animKey: string }) {
  const [first, second, third] = records

  const PodiumSlot = ({
    record,
    rank,
    podiumH,
    delay,
  }: {
    record: HighScoreRecord
    rank: 1 | 2 | 3
    podiumH: string
    delay: string
  }) => {
    const capDo = record.level ?? tinhLevel(record.totalXp ?? 0)
    const isFirst = rank === 1
    const medal = ['🥇', '🥈', '🥉'][rank - 1]
    const ringClass =
      isFirst ? 'ring-2 ring-amber-400/60' : rank === 2 ? 'ring-2 ring-slate-300/40' : 'ring-2 ring-amber-700/40'
    const podiumBg =
      isFirst
        ? 'bg-gradient-to-t from-amber-600/40 to-amber-500/15 border border-amber-500/30'
        : rank === 2
          ? 'bg-gradient-to-t from-slate-500/25 to-slate-400/10 border border-slate-400/20'
          : 'bg-gradient-to-t from-amber-800/25 to-amber-700/10 border border-amber-700/20'
    const lvBg =
      capDo >= 20
        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
        : capDo >= 10
          ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
          : 'bg-white/10 text-slate-300'

    return (
      <div
        className="flex flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDuration: '0.4s', animationDelay: delay, animationFillMode: 'both' }}
      >
        <span className="text-xl leading-none">{medal}</span>
        <div className={cn('relative', isFirst && 'scale-110')}>
          <AvatarInitials name={record.playerName} size={isFirst ? 'lg' : 'md'} ringClass={ringClass} />
          <span
            className={cn(
              'absolute -bottom-1.5 -right-1.5 size-5 rounded-full flex items-center justify-center text-[9px] font-black border border-black/20',
              lvBg
            )}
          >
            {capDo}
          </span>
        </div>
        <p
          className={cn(
            'text-center font-bold leading-tight break-words',
            isFirst ? 'text-amber-200 text-[11px] max-w-[85px]' : 'text-slate-300 text-[10px] max-w-[75px]'
          )}
          title={record.playerName}
        >
          {record.playerName.length > 11 ? record.playerName.slice(0, 10) + '…' : record.playerName}
        </p>
        <p
          className={cn(
            'font-mono font-black tabular-nums',
            isFirst ? 'text-amber-300 text-sm' : 'text-slate-300 text-xs'
          )}
        >
          {record.score.toLocaleString('vi-VN')}
        </p>
        <div
          className={cn(
            'w-full rounded-t-xl flex items-end justify-center pb-1.5 text-white/25 font-black text-base',
            podiumH,
            podiumBg
          )}
        >
          {rank}
        </div>
      </div>
    )
  }

  return (
    <div key={animKey} className="px-3 pt-4 pb-0 shrink-0">
      <div className="flex items-end justify-center gap-1.5">
        <div className="flex-1 max-w-[88px]">
          {second ? <PodiumSlot record={second} rank={2} podiumH="h-[50px]" delay="0.1s" /> : <div className="h-[50px]" />}
        </div>
        <div className="flex-1 max-w-[100px]">
          {first ? <PodiumSlot record={first} rank={1} podiumH="h-[70px]" delay="0s" /> : <div className="h-[70px]" />}
        </div>
        <div className="flex-1 max-w-[88px]">
          {third ? <PodiumSlot record={third} rank={3} podiumH="h-[34px]" delay="0.2s" /> : <div className="h-[34px]" />}
        </div>
      </div>
    </div>
  )
}

// ─── Row #4+ ─────────────────────────────────────────────────────────────────

function LeaderboardRow({ record, rank, delay }: { record: HighScoreRecord; rank: number; delay: string }) {
  const capDo = record.level ?? tinhLevel(record.totalXp ?? 0)
  return (
    <li
      className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06] transition-colors animate-in fade-in slide-in-from-left-2"
      style={{ animationDuration: '0.28s', animationDelay: delay, animationFillMode: 'both' }}
    >
      <span className="w-6 text-center text-[11px] font-bold text-text-tertiary tabular-nums shrink-0">#{rank}</span>
      <AvatarInitials name={record.playerName} size="sm" />
      <span className="flex-1 min-w-0 text-xs font-semibold text-text-primary truncate">{record.playerName}</span>
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
      <span className="font-mono font-bold text-amber-300 tabular-nums text-[11px] shrink-0">
        {record.score.toLocaleString('vi-VN')}
      </span>
    </li>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonLeaderboard() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 pt-4 pb-0 shrink-0">
        <div className="flex items-end justify-center gap-1.5">
          {[50, 70, 34].map((h, i) => (
            <div key={i} className="flex-1 max-w-[90px] flex flex-col items-center gap-1">
              <div className="size-4 rounded-full bg-white/10 animate-pulse" />
              <div className={cn('rounded-full bg-white/10 animate-pulse', i === 1 ? 'size-12' : 'size-9')} />
              <div className="h-2.5 w-14 rounded bg-white/10 animate-pulse" />
              <div className="h-2 w-10 rounded bg-white/10 animate-pulse" />
              <div className="w-full rounded-t-xl bg-white/5 animate-pulse" style={{ height: h }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 my-3">
        <div className="flex-1 h-px bg-white/5" />
        <div className="h-2 w-12 rounded bg-white/10 animate-pulse" />
        <div className="flex-1 h-px bg-white/5" />
      </div>
      <ul className="space-y-1 px-1">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-2 px-2.5 py-2">
            <div className="size-5 rounded bg-white/10 animate-pulse shrink-0" />
            <div className="size-7 rounded-full bg-white/10 animate-pulse shrink-0" />
            <div className="h-3 flex-1 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-9 rounded bg-white/10 animate-pulse" />
            <div className="h-3 w-14 rounded bg-white/10 animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  )
}

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
  const top3 = records.slice(0, 3)
  const rest = records.slice(3)

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
          {/* Podium Top 3 */}
          {top3.length > 0 && <Podium records={top3} animKey={activeTab} />}

          {/* Divider */}
          {rest.length > 0 && (
            <div className="flex items-center gap-2 px-4 my-2 shrink-0">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Top {records.length}</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>
          )}

          {/* Rest rows #4+ */}
          {rest.length > 0 && (
            <ol className="space-y-0.5 px-1 pb-3">
              {rest.map((row, i) => (
                <LeaderboardRow key={row.id} record={row} rank={i + 4} delay={`${i * 25}ms`} />
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  )
}
