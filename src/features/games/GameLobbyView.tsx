import { useMemo, useCallback } from 'react'
import { ResponsiveActivityLayout } from '@/components/layout/ResponsiveActivityLayout'
import { Gamepad2 } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { GameCard } from './GameCard'
import { GameArenaLeaderboard } from './GameArenaLeaderboard'
import { GameSocialSidebar } from './GameSocialSidebar'
import { ThongKeGame } from './ThongKeGame'
import { taoMaBan } from './game-ids'
import { CAC_GAME_1V1, CAC_GAME_SOLO, type GameDefinition } from './game-catalog'
import { toast } from 'sonner'
import { usePhien } from '@/app/phien'

interface GameLobbyViewProps {
  onCreateRoom: (roomId: string, gameType: GameType, turnSeconds: number) => void
  /** Bấm vào một trò chơi: mở sảnh của trò đó (mọi bàn đang mở + Chơi ngay · Tạo phòng · Vào phòng · Tìm phòng). */
  onMoSanh: (gameType: GameType) => void
}

export function GameLobbyView({ onCreateRoom, onMoSanh }: GameLobbyViewProps) {
  const { nguoiDung } = usePhien()
  // Danh sách bàn online chỉ dành cho người đã đăng nhập (máy chủ trả 401 cho khách): số bàn chờ trên thẻ + thống kê của quản trị.
  const { data: tablesData, isPending, isError } = useGameRooms(undefined, Boolean(nguoiDung))
  const tables = useMemo<BanSanh[]>(
    () => ((tablesData ?? []) as BanSanh[]).filter((t: BanSanh) => t.trangThai !== 'ended'),
    [tablesData],
  )

  const waitingCounts = useMemo(() => {
    const dem: Partial<Record<GameType, number>> = {}
    for (const t of tables) {
      if (t.trangThai === 'waiting') {
        dem[t.gameType] = (dem[t.gameType] ?? 0) + 1
      }
    }
    return dem
  }, [tables])

  // Campus chưa có kênh gửi lời mời riêng: mở bàn Caro mới và sao chép link bàn để người chơi tự gửi cho bạn.
  const handleInviteToGame = useCallback(
    (_friendId: number, friendName: string) => {
      const maBan = taoMaBan('caro_15')
      const link = `${window.location.origin}/game/${encodeURIComponent(maBan)}`
      void navigator.clipboard
        .writeText(link)
        .then(() => toast.success(`Đã mở bàn Caro và sao chép link — gửi cho ${friendName} qua Chat chung nhé.`))
        .catch(() => toast.info(`Đã mở bàn Caro — bấm "Mời bạn" trên bàn để lấy link gửi ${friendName}.`))
      onCreateRoom(maBan, 'caro_15', 30)
    },
    [onCreateRoom]
  )

  const allGames = useMemo<GameDefinition[]>(() => [...CAC_GAME_1V1, ...CAC_GAME_SOLO], [])

  return (
    <div className="space-y-6">
      {/* ── Header Đấu Trường Game ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-xl shadow-cyan-500/25 text-white ring-1 ring-white/20">
            <Gamepad2 className="size-6 drop-shadow-md" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="tieu-de-cap-1 text-[2rem] leading-[1.15] font-extrabold tracking-[-0.03em] sm:text-[2.5rem]">
                Game
              </h1>
              <span className="rounded-full bg-gradient-to-r from-cyan-500/20 to-brand/20 border border-cyan-500/30 px-3 py-0.5 text-xs font-extrabold text-cyan-300 shadow-sm">
                5 Bộ Môn
              </span>
            </div>
          </div>
        </div>
      </div>

      <ThongKeGame ban={tables} sanSang={Boolean(nguoiDung) && !isPending && !isError} />

      {/* ── Bố cục chính 3 cột trải rộng: Cột Trái rộng: Bảng xếp hạng | Cột Giữa To Bự: 5 Game | Cột Phải rộng: Chat & Bạn bè ── */}
      <ResponsiveActivityLayout leaderboard={<GameArenaLeaderboard />} social={<GameSocialSidebar onInviteToGame={handleInviteToGame} />}>
        {/* ── Cột 2 (Trung tâm to bự): Danh sách 5 game chiếm trọn không gian giữa ── */}
        <div className="min-w-0 order-1 lg:order-2 flex-1">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {allGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                waiting={waitingCounts[game.id] ?? 0}
                onMoSanh={() => onMoSanh(game.id)}
              />
            ))}
          </div>
        </div>

      </ResponsiveActivityLayout>

    </div>
  )
}
