import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Medal, Trophy } from 'lucide-react'
import { CAC_GAME_SOLO } from './game-catalog'

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

export function GameLeaderboard() {
  const [gameType, setGameType] = useState(CAC_GAME_SOLO[0].id)
  const { data, isPending, isError } = useQuery({
    queryKey: ['game-highscores', gameType],
    queryFn: () => layBangXepHang(gameType),
  })

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-amber-400" />
        <h3 className="text-sm font-bold text-white">Bảng Xếp Hạng Solo</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {CAC_GAME_SOLO.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGameType(g.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              gameType === g.id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'bg-slate-800/70 text-slate-400 hover:text-white'
            }`}
          >
            {g.icon} {g.shortTitle}
          </button>
        ))}
      </div>

      <div className="flex min-h-52 flex-col gap-1.5 overflow-y-auto" style={{ overflowAnchor: 'none' }}>
        {isPending ? (
          <div className="flex h-52 items-center justify-center text-xs text-slate-500">Đang tải…</div>
        ) : isError ? (
          <div className="flex h-52 items-center justify-center text-xs text-rose-400">
            Không tải được bảng xếp hạng, thử lại sau.
          </div>
        ) : data && data.length > 0 ? (
          data.map((row, i) => (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-xl bg-slate-800/40 px-3 py-2 text-sm"
            >
              <span className={`w-5 shrink-0 text-center font-black ${MAU_HANG[i] ?? 'text-slate-500'}`}>
                {i < 3 ? <Medal className="size-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{row.playerName}</span>
              <span className="shrink-0 font-black text-cyan-400">{row.score.toLocaleString('vi-VN')}</span>
            </div>
          ))
        ) : (
          <div className="flex h-52 flex-col items-center justify-center gap-1 text-center text-xs text-slate-500">
            <Trophy className="size-6 text-slate-700" />
            Chưa có điểm nào cho trò này — chơi thử để lập kỷ lục đầu tiên!
          </div>
        )}
      </div>
    </div>
  )
}
