import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, RefreshCw } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { EloRankAvatarFrame } from './EloRankAvatarFrame'

export interface HighScoreRecord {
  id: number
  gameType: string
  playerName: string
  score: number
  verified?: number
  session_id?: string
  createdAt: number
  totalXp?: number
  level?: number
}

interface PhanHoiHighScore {
  ok: boolean
  highscores?: HighScoreRecord[]
  loi?: string
}

/**
 * Tính Level của nhân vật dựa theo tổng điểm kinh nghiệm (EXP) từ tất cả hoạt động
 * trên nền tảng (học tập, làm bài, tương tác, chơi game, phòng nhóm...).
 */
export function tinhLevel(totalXp: number): number {
  if (!totalXp || totalXp <= 0) return 1
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 15)) + 1)
}

async function layBangXepHang(gameType: string, verifiedOnly: boolean, limit: number = 50): Promise<HighScoreRecord[]> {
  const thamSo = new URLSearchParams({ gameType, limit: String(limit) })
  if (verifiedOnly) thamSo.set('verifiedOnly', '1')
  const res = await fetch(`/api/game/highscores?${thamSo.toString()}`, { credentials: 'same-origin' })
  const duLieu = (await res.json().catch(() => null)) as PhanHoiHighScore | null
  if (!res.ok || !duLieu?.ok) throw new Error(duLieu?.loi || `Không tải được bảng xếp hạng (${res.status}).`)
  return duLieu.highscores ?? []
}

interface GameLeaderboardProps {
  gameType: GameType
  /** Chỉ lấy điểm máy chủ đã xác thực (`verifiedOnly=1`) */
  verifiedOnly?: boolean
  limit?: number
}

export function GameLeaderboard({ gameType, verifiedOnly = false, limit = 50 }: GameLeaderboardProps) {
  const info = GAME_CATALOG_BY_ID[gameType]
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['game-highscores', gameType, verifiedOnly, limit],
    queryFn: () => layBangXepHang(gameType, verifiedOnly, limit),
    staleTime: 30_000,
  })
  const hang = (data ?? []).slice(0, limit)

  // ── Tính năng Hold & Drag để cuộn dọc (chuột kéo thả & cảm ứng điện thoại) ──
  const listRef = useRef<HTMLDivElement>(null)
  const isMouseDownRef = useRef(false)
  const startYRef = useRef(0)
  const scrollTopRef = useRef(0)
  const [isDraggingY, setIsDraggingY] = useState(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Chỉ kích hoạt khi nhấn chuột trái
    if (e.button !== 0) return
    const el = listRef.current
    if (!el) return

    isMouseDownRef.current = true
    startYRef.current = e.clientY
    scrollTopRef.current = el.scrollTop

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isMouseDownRef.current || !listRef.current) return
      const deltaY = ev.clientY - startYRef.current
      if (Math.abs(deltaY) > 3) {
        setIsDraggingY(true)
        listRef.current.scrollTop = scrollTopRef.current - deltaY
      }
    }

    const handleMouseUp = () => {
      isMouseDownRef.current = false
      setIsDraggingY(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 gap-2.5">
      {/* ── VÙNG 1: CHỈ ĐỂ LẠI TÊN TAB (Xóa chữ xếp hạng, xóa xác thực) ── */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/5 shrink-0">
        <h3 className="flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase">
          <Trophy className="size-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{info.shortTitle}</span>
        </h3>
        <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
          Top {limit}
        </span>
      </div>

      {/* ── VÙNG 2: BẢNG XẾP HẠNG 3 CỘT (Cột 1: Nhân vật, Cột 2: Điểm, Cột 3: Level) ── */}
      {/* Tiêu đề 3 cột */}
      <div className="grid grid-cols-[1fr_80px_60px] sm:grid-cols-[1fr_90px_65px] items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] text-[11px] font-bold text-text-tertiary select-none border border-white/5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 text-center">#</span>
          <span className="truncate">Nhân vật</span>
        </div>
        <div className="text-right truncate">Điểm số</div>
        <div className="text-right truncate">Cấp độ</div>
      </div>

      {/* Danh sách người chơi hỗ trợ Hold để kéo cuộn hoặc cảm ứng vuốt */}
      <div
        ref={listRef}
        onMouseDown={handleMouseDown}
        className={cn(
          'flex-1 min-h-0 overflow-y-auto select-none touch-pan-y space-y-1 pr-0.5',
          isDraggingY ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {isPending ? (
          <div className="space-y-1.5" aria-busy="true" aria-label="Đang tải bảng xếp hạng">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_60px] sm:grid-cols-[1fr_90px_65px] items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.01]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-4 animate-pulse rounded bg-white/10 shrink-0" />
                  <div className="size-7 animate-pulse rounded-full bg-white/10 shrink-0" />
                  <div className="h-3 flex-1 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-3 w-12 animate-pulse rounded bg-white/10 ml-auto" />
                <div className="h-4 w-9 animate-pulse rounded bg-white/10 ml-auto" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3 text-center p-4">
            <p className="text-xs text-text-secondary">Không tải được bảng xếp hạng.</p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <RefreshCw className={cn('size-3', isRefetching && 'animate-spin')} />
              Thử lại
            </Button>
          </div>
        ) : hang.length > 0 ? (
          <ol className="space-y-1">
            {hang.map((row, i) => {
              const capDo = row.level ?? tinhLevel(row.totalXp ?? 0)
              const isTop1 = i === 0
              const isTop2 = i === 1
              const isTop3 = i === 2

              return (
                <li
                  key={row.id}
                  className={cn(
                    'grid grid-cols-[1fr_80px_60px] sm:grid-cols-[1fr_90px_65px] items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors border',
                    isTop1
                      ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15'
                      : isTop2
                        ? 'bg-slate-400/5 border-slate-400/20 hover:bg-slate-400/10'
                        : isTop3
                          ? 'bg-amber-700/5 border-amber-700/20 hover:bg-amber-700/10'
                          : 'bg-white/[0.015] border-transparent hover:bg-white/5 hover:border-white/5'
                  )}
                >
                  {/* Cột 1: Thứ hạng & Tên nhân vật */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'w-5 shrink-0 text-center font-bold tabular-nums text-xs',
                        isTop1 ? 'text-amber-400 text-sm' : isTop2 ? 'text-slate-300' : isTop3 ? 'text-amber-600' : 'text-text-tertiary'
                      )}
                    >
                      {isTop1 ? '🥇' : isTop2 ? '🥈' : isTop3 ? '🥉' : `#${i + 1}`}
                    </span>
                    <EloRankAvatarFrame
                      ten={row.playerName}
                      elo={row.score}
                      sizeClassName="size-7"
                    />
                    <span
                      className={cn(
                        'truncate font-semibold',
                        isTop1 ? 'text-amber-200' : 'text-text-primary'
                      )}
                      title={row.playerName}
                    >
                      {row.playerName}
                    </span>
                  </div>

                  {/* Cột 2: Số điểm game đó */}
                  <div className="text-right font-mono font-bold text-amber-300 tabular-nums truncate">
                    {row.score.toLocaleString('vi-VN')}
                  </div>

                  {/* Cột 3: Level của nhân vật (tính theo tổng EXP tham gia toàn web) */}
                  <div className="text-right flex items-center justify-end">
                    <span
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black font-mono shadow-sm',
                        capDo >= 20
                          ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-200 border border-purple-400/40'
                          : capDo >= 10
                            ? 'bg-gradient-to-r from-brand/20 to-brand/10 text-brand border border-brand/35'
                            : capDo >= 5
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 text-slate-300 border border-white/10'
                      )}
                      title={`Cấp độ ${capDo} (tính từ tổng EXP tham gia)`}
                    >
                      Lv.{capDo}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center gap-2.5 px-4 text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400">
              <Trophy className="size-5" />
            </div>
            <p className="text-xs leading-relaxed text-text-secondary max-w-[220px]">
              Chưa có điểm nào — chơi thử để lập kỷ lục đầu tiên!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
