import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, Trophy } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface HighScoreRecord {
  id: number
  gameType: string
  playerName: string
  score: number
  verified?: number
  createdAt: number
}

interface PhanHoiHighScore {
  ok: boolean
  highscores?: HighScoreRecord[]
  loi?: string
}

async function layBangXepHang(gameType: string, verifiedOnly: boolean): Promise<HighScoreRecord[]> {
  const thamSo = new URLSearchParams({ gameType })
  if (verifiedOnly) thamSo.set('verifiedOnly', '1')
  const res = await fetch(`/api/game/highscores?${thamSo.toString()}`, { credentials: 'same-origin' })
  const duLieu = (await res.json().catch(() => null)) as PhanHoiHighScore | null
  if (!res.ok || !duLieu?.ok) throw new Error(duLieu?.loi || `Không tải được bảng xếp hạng (${res.status}).`)
  return duLieu.highscores ?? []
}

const MAU_HANG = ['text-achievement', 'text-slate-300', 'text-amber-600']

interface GameLeaderboardProps {
  gameType: GameType
  /** Chỉ lấy điểm máy chủ đã xác thực (`verifiedOnly=1`) — dùng cho bảng xếp hạng hiển thị công khai. */
  verifiedOnly?: boolean
  limit?: number
}

// Bảng xếp hạng CHO ĐÚNG trò chơi được chọn — trò đối kháng chưa có điểm tích luỹ toàn trường nên hiện
// empty-state thật (không bịa số liệu); trò chơi đơn lấy điểm thật từ /api/game/highscores.
export function GameLeaderboard({ gameType, verifiedOnly = false, limit = 10 }: GameLeaderboardProps) {
  const info = GAME_CATALOG_BY_ID[gameType]
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['game-highscores', gameType, verifiedOnly],
    queryFn: () => layBangXepHang(gameType, verifiedOnly),
    staleTime: 30_000,
  })
  const hang = (data ?? []).slice(0, limit)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[0.9375rem] leading-6 font-semibold text-text-primary">
          <Trophy className="size-4 text-achievement" />
          Xếp hạng
        </h3>
        <span className="flex flex-wrap items-center justify-end gap-1 text-right text-xs text-text-tertiary">
          {info.shortTitle}
          {verifiedOnly && (
            <>
              <span aria-hidden>·</span>
              <BadgeCheck className="size-3.5 text-success" />
              <span>đã xác thực</span>
            </>
          )}
        </span>
      </div>

      <div className="min-h-[196px]" style={{ overflowAnchor: 'none' }}>
        {isPending ? (
          <div className="space-y-1.5" aria-busy="true" aria-label="Đang tải bảng xếp hạng">
            {Array.from({ length: Math.min(limit, 5) }, (_, i) => (
              <div key={i} className="flex h-9 items-center gap-3 px-2">
                <div className="size-4 animate-pulse rounded bg-surface-overlay" />
                <div className="h-3 flex-1 animate-pulse rounded bg-surface-overlay/70" />
                <div className="h-3 w-10 animate-pulse rounded bg-surface-overlay" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex h-[196px] flex-col items-center justify-center gap-3 text-center">
            <p className="text-[0.8125rem] text-text-secondary">Không tải được bảng xếp hạng.</p>
            <Button size="xs" variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
              Thử lại
            </Button>
          </div>
        ) : hang.length > 0 ? (
          <ol className="space-y-0.5">
            {hang.map((row, i) => (
              <li
                key={row.id}
                className="flex min-h-9 items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-overlay/60"
              >
                <span
                  className={cn(
                    'w-5 shrink-0 text-center text-xs font-semibold tabular-nums',
                    MAU_HANG[i] ?? 'text-text-tertiary',
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 break-words text-text-primary">
                  {row.playerName}
                  {!verifiedOnly && row.verified === 1 && (
                    <BadgeCheck className="ml-1 inline size-3.5 align-[-2px] text-success" aria-label="Điểm đã được máy chủ xác thực" />
                  )}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-text-primary">
                  {row.score.toLocaleString('vi-VN')}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex h-[196px] flex-col items-center justify-center gap-2 px-4 text-center">
            <Trophy className="size-5 text-text-tertiary" />
            <p className="text-[0.8125rem] leading-relaxed text-text-secondary">
              {info.category === '1v1'
                ? 'Đối kháng chưa tích luỹ điểm toàn trường — đang phát triển.'
                : verifiedOnly
                  ? 'Chưa có điểm được xác thực — chơi thử để lập kỷ lục đầu tiên!'
                  : 'Chưa có điểm nào — chơi thử để lập kỷ lục đầu tiên!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
