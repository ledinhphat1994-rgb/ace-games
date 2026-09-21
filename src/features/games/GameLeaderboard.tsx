import { useQuery } from '@tanstack/react-query'
import { Medal, Trophy } from 'lucide-react'
import type { GameType } from '@shared/protocol/game'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface HighScoreRecord {
  id: number
  gameType: string
  playerName: string
  score: number
  createdAt: number
}

interface PhanHoiHighScore {
  ok: boolean
  highscores?: HighScoreRecord[]
  loi?: string
}

async function layBangXepHang(gameType: string): Promise<HighScoreRecord[]> {
  const res = await fetch(`/api/game/highscores?gameType=${encodeURIComponent(gameType)}`, {
    credentials: 'same-origin',
  })
  const duLieu = (await res.json().catch(() => null)) as PhanHoiHighScore | null
  if (!res.ok || !duLieu?.ok) throw new Error(duLieu?.loi || `Không tải được bảng xếp hạng (${res.status}).`)
  return duLieu.highscores ?? []
}

const MAU_HANG = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

// Cột 4: bảng xếp hạng CHO ĐÚNG trò chơi đang chọn ở cột 1 — trò đối kháng chưa có điểm tích luỹ toàn
// trường nên hiện empty-state thật (không bịa số liệu), trò chơi đơn có điểm thật từ /api/game/highscore.
export function GameLeaderboard({ gameType }: { gameType: GameType }) {
  const info = GAME_CATALOG_BY_ID[gameType]
  const { data, isPending, isError } = useQuery({
    queryKey: ['game-highscores', gameType],
    queryFn: () => layBangXepHang(gameType),
  })

  return (
    <div className="flex h-full flex-col gap-3">
      <h3 className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-foreground">
        <Trophy className="size-4 text-achievement" /> Xếp hạng {info.shortTitle}
      </h3>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto" style={{ overflowAnchor: 'none' }}>
        {isPending ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">Đang tải…</div>
        ) : isError ? (
          <div className="flex h-40 items-center justify-center text-center text-xs text-destructive">
            Không tải được bảng xếp hạng, thử lại sau.
          </div>
        ) : data && data.length > 0 ? (
          data.map((row, i) => (
            <div key={row.id} className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface-raised/70 px-3 py-2 text-sm transition-colors hover:bg-surface-raised">
              <span className={`w-5 shrink-0 text-center font-black ${MAU_HANG[i] ?? 'text-muted-foreground'}`}>
                {i < 3 ? <Medal className="size-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">{row.playerName}</span>
              <span className="shrink-0 font-black text-brand">{row.score.toLocaleString('vi-VN')}</span>
            </div>
          ))
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <Trophy className="size-6 text-muted-foreground/50" />
            {info.category === '1v1'
              ? 'Đối kháng chưa tích luỹ điểm toàn trường — đang phát triển.'
              : 'Chưa có điểm nào cho trò này — chơi thử để lập kỷ lục đầu tiên!'}
          </div>
        )}
      </div>
    </div>
  )
}
