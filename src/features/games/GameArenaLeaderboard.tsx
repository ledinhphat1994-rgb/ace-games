import { useState, useRef, useEffect } from 'react'
import { Trophy, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import type { SchoolStudyLeaderboardItem } from '@shared/protocol/engagement'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { usePhien } from '@/app/phien'
import type { HighScoreRecord } from './GameLeaderboard'
import { tinhLevel } from './GameLeaderboard'

/** Bảng xếp hạng chung toàn web: tab Học tập (tổng XP học tập) + các tab game (kỷ lục đã xác thực). */
export type TabXepHang = GameType | 'hoc_tap'

interface TabGameConfig {
  id: TabXepHang
  label: string
  icon: string
  accentGradient: string
}

const LEADERBOARD_TABS: TabGameConfig[] = [
  { id: 'hoc_tap', label: 'Học tập', icon: '📚', accentGradient: 'from-sky-500/30 to-indigo-600/10' },
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

// Chỉ xếp hạng điểm máy chủ đã xác thực: điểm gửi qua cổng legacy /api/game/highscore là do trình duyệt tự khai.
async function layBangXepHang(gameType: string, limit = 50): Promise<HighScoreRecord[]> {
  const params = new URLSearchParams({ gameType, limit: String(limit), verifiedOnly: '1' })
  const res = await fetch(`/api/game/highscores?${params}`, { credentials: 'same-origin' })
  const data = (await res.json().catch(() => null)) as PhanHoiHighScore | null
  if (!res.ok || !data?.ok) throw new Error(data?.loi || `Lỗi ${res.status}`)
  return data.highscores ?? []
}

// Tab Học tập: Top 50 toàn trường theo tổng XP học tập (máy chủ cộng khi kết thúc phiên học), cùng khuôn dòng với tab game.
async function layBangXepHangHocTap(): Promise<HighScoreRecord[]> {
  const res = await fetch('/api/engagement/leaderboard/school', { credentials: 'same-origin' })
  const data = (await res.json().catch(() => null)) as { ok?: boolean; items?: SchoolStudyLeaderboardItem[]; loi?: string } | null
  if (!res.ok || !data?.ok) throw new Error(data?.loi || `Lỗi ${res.status}`)
  return (data.items ?? []).map((r) => ({
    id: r.rank,
    gameType: 'hoc_tap',
    playerName: r.playerName,
    score: r.totalXp,
    createdAt: 0,
    totalXp: r.totalXp,
    level: r.level,
  }))
}

// ─── Một dòng xếp hạng: hạng · tên · level · điểm ─────────────────────────────

const MAU_HANG: Record<number, string> = { 1: 'text-amber-300', 2: 'text-slate-300', 3: 'text-orange-400' }

function LeaderboardRow({ record, rank, laToi }: { record: HighScoreRecord; rank: number; laToi: boolean }) {
  const capDo = record.level ?? tinhLevel(record.totalXp ?? 0)
  return (
    <li
      className={cn(
        'grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        laToi ? 'bg-brand/10 ring-1 ring-brand/25' : rank <= 3 ? 'bg-white/[0.035] hover:bg-white/[0.06]' : 'hover:bg-white/[0.04]',
      )}
      data-testid={`xep-hang-dong-${rank}`}
    >
      <span className={cn('text-center text-sm font-black tabular-nums', MAU_HANG[rank] ?? 'text-text-tertiary')}>{rank}</span>
      <span
        className={cn('truncate text-sm', rank <= 3 || laToi ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary')}
        title={record.playerName}
      >
        {record.playerName}
      </span>
      <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-text-secondary">Lv.{capDo}</span>
      <span className="min-w-[3.25rem] text-right font-mono text-sm font-bold tabular-nums text-amber-300">
        {record.score.toLocaleString('vi-VN')}
      </span>
    </li>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonLeaderboard() {
  return (
    <ul className="flex-1 min-h-0 space-y-1 p-2" aria-busy="true" aria-label="Đang tải bảng xếp hạng">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-3 py-2.5 animate-pulse">
          <div className="mx-auto h-3 w-3 rounded bg-white/10" />
          <div className="h-3 rounded bg-white/10" />
          <div className="h-4 w-9 rounded bg-white/10" />
          <div className="h-3 w-12 rounded bg-white/10" />
        </li>
      ))}
    </ul>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface GameArenaLeaderboardProps {
  defaultGame?: TabXepHang
  className?: string
}

export function GameArenaLeaderboard({ defaultGame, className }: GameArenaLeaderboardProps) {
  const [activeTab, setActiveTab] = useState<TabXepHang>(() => defaultGame ?? 'chess')
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

  const handleTabClick = (tabId: TabXepHang) => {
    if (dragDistance.current > 10) return
    setActiveTab(tabId)
    if (listRef.current) listRef.current.scrollTop = 0
  }

  const activeTabCfg = LEADERBOARD_TABS.find((t) => t.id === activeTab) ?? LEADERBOARD_TABS[0]
  const laHocTap = activeTab === 'hoc_tap'

  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: laHocTap ? ['study-leaderboard', 'school'] : ['game-highscores', activeTab, 50],
    queryFn: () => (activeTab === 'hoc_tap' ? layBangXepHangHocTap() : layBangXepHang(activeTab, 50)),
    staleTime: 30_000,
  })

  const records = data ?? []
  const { nguoiDung } = usePhien()
  // Nhận ra dòng của mình theo tên hiển thị (bảng chỉ trả tên người chơi, không trả mã tài khoản).
  const tenToi = nguoiDung?.ten?.trim().toLowerCase() ?? null

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
              className="tieu-de-cap-2 text-[0.9375rem] font-black tracking-tight leading-none"
            >
              Bảng Xếp Hạng
            </h2>
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
            <p className="text-xs text-text-tertiary mt-1">
              {laHocTap ? 'Học trong phòng' : `Chơi ${activeTabCfg.label}`} để ghi danh Top 50 đầu tiên 🏆
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <ol className="space-y-0.5 p-2">
            {records.map((row, i) => (
              <LeaderboardRow
                key={row.id}
                record={row}
                rank={i + 1}
                laToi={tenToi !== null && row.playerName.trim().toLowerCase() === tenToi}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
