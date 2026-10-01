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

const MAU_HANG: Record<number, string> = { 1: 'text-warning', 2: 'text-text-secondary', 3: 'text-orange-400' }

function LeaderboardRow({ record, rank, laToi }: { record: HighScoreRecord; rank: number; laToi: boolean }) {
  const capDo = record.level ?? tinhLevel(record.totalXp ?? 0)
  return (
    <li
      className={cn(
        'grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
        laToi ? 'bg-brand/10 ring-1 ring-brand/25' : rank <= 3 ? 'bg-surface-overlay hover:bg-surface-overlay' : 'hover:bg-surface-overlay',
      )}
      data-testid={`xep-hang-dong-${rank}`}
    >
      <span className={cn('text-center text-sm font-black tabular-nums', MAU_HANG[rank] ?? 'text-text-tertiary')}>{rank}</span>
      <span
        className={cn('min-w-0 break-words text-sm', rank <= 3 || laToi ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary')}
        title={record.playerName}
      >
        {record.playerName}
      </span>
      <span className="rounded-md bg-surface-overlay px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-text-secondary">Lv.{capDo}</span>
      <span className="min-w-[3.25rem] text-right font-mono text-sm font-bold tabular-nums text-warning">
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
          <div className="mx-auto h-3 w-3 rounded bg-surface-overlay" />
          <div className="h-3 rounded bg-surface-overlay" />
          <div className="h-4 w-9 rounded bg-surface-overlay" />
          <div className="h-3 w-12 rounded bg-surface-overlay" />
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
        'flex min-w-0 flex-col h-[max(420px,min(740px,calc(100dvh-10rem)))] overflow-hidden rounded-2xl border border-border-default',
        'bg-surface',
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/25 to-yellow-600/10 border border-amber-500/30">
            <Trophy className="size-4 text-warning" />
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
          className="flex size-11 items-center justify-center rounded-xl hover:bg-surface-overlay transition-colors text-text-primary/80 hover:text-text-primary disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={cn('size-3.5', (isPending || isRefetching) && 'animate-spin')} />
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className="relative border-b border-border-subtle shrink-0">
        <button
          type="button"
          onClick={() => tabsContainerRef.current?.scrollBy({ left: -100, behavior: 'smooth' })}
          aria-label="Trượt sang trái"
          className="absolute left-0 top-0 bottom-0 z-10 flex w-9 items-center justify-center bg-gradient-to-r from-surface via-surface/90 to-transparent text-white/80 hover:text-white hover:scale-110 transition-all cursor-pointer"
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
                  'flex items-center gap-1.5 min-h-11 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 shrink-0 select-none cursor-pointer border',
                  isActive
                    ? 'bg-brand/12 text-brand border-brand/20'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay border-transparent'
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
          className="absolute right-0 top-0 bottom-0 z-10 flex w-9 items-center justify-center bg-gradient-to-l from-[#0e1527] via-[#0e1527]/90 to-transparent text-text-primary/80 hover:text-text-primary hover:scale-110 transition-all cursor-pointer"
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
            <Trophy className="size-5 text-destructive" />
          </div>
          <p className="text-xs text-text-secondary">Không tải được bảng xếp hạng</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-default hover:bg-surface-overlay text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <RefreshCw className="size-3" />
            Thử lại
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center select-none">
          {/* Mô phỏng bục vinh danh Top 3 đang chờ đón tân vương */}
          <div className="w-full max-w-[240px] flex items-end justify-center gap-2 pt-2 pb-1">
            {/* Hạng 2 */}
            <div className="flex-1 rounded-xl border border-dashed border-border-default/80 bg-surface/50 p-2 flex flex-col items-center justify-end h-20 text-center">
              <Trophy className="size-4 text-text-tertiary mb-1 opacity-70" />
              <span className="text-[11px] font-bold text-text-tertiary">#2</span>
              <span className="text-[9px] text-text-tertiary/60">Trống</span>
            </div>
            {/* Hạng 1 */}
            <div className="flex-1 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 p-2.5 flex flex-col items-center justify-end h-26 text-center shadow-xs">
              <Trophy className="size-5 text-warning mb-1" />
              <span className="text-xs font-black text-warning">#1</span>
              <span className="text-[9px] font-bold text-warning/80">Vô địch</span>
            </div>
            {/* Hạng 3 */}
            <div className="flex-1 rounded-xl border border-dashed border-border-default/80 bg-surface/50 p-2 flex flex-col items-center justify-end h-16 text-center">
              <Trophy className="size-3.5 text-text-tertiary mb-1 opacity-50" />
              <span className="text-[11px] font-bold text-text-tertiary">#3</span>
              <span className="text-[9px] text-text-tertiary/60">Trống</span>
            </div>
          </div>

          <div className="max-w-[220px]">
            <p className="text-sm font-bold text-text-primary">Chưa có ai lên bảng!</p>
            <p className="text-xs text-text-tertiary mt-1 leading-relaxed">
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
          {records.length >= 3 && <div className="grid grid-cols-3 items-end gap-2 px-4 pt-5 pb-4" data-testid="leaderboard-podium">{[1, 0, 2].map(index => <div key={records[index].id} className={cn('min-w-0 rounded-xl px-2 py-3 text-center', index === 0 ? 'bg-achievement-muted pb-5' : 'bg-canvas')}><Trophy className={cn('mx-auto mb-2 size-5', index === 0 ? 'text-achievement' : 'text-text-tertiary')} /><p className="text-xs font-semibold text-text-secondary">#{index + 1}</p><p className="mt-1 break-words text-xs font-semibold text-text-primary">{records[index].playerName}</p><p className="mt-2 text-sm font-bold tabular-nums text-achievement">{records[index].score.toLocaleString('vi-VN')}</p></div>)}</div>}
          <ol className="space-y-0.5 p-2">
            {records.slice(records.length >= 3 ? 3 : 0).map((row, i) => (
              <LeaderboardRow
                key={row.id}
                record={row}
                rank={i + 1 + (records.length >= 3 ? 3 : 0)}
                laToi={tenToi !== null && row.playerName.trim().toLowerCase() === tenToi}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
