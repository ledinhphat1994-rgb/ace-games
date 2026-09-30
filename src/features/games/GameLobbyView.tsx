import { CampusHero } from '@/components/layout/CampusHero'
import { useMemo, useCallback, useState } from 'react'
import { ResponsiveActivityLayout } from '@/components/layout/ResponsiveActivityLayout'
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
  const [category, setCategory] = useState<'all' | '1v1' | 'solo'>('all')
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
      <CampusHero
        eyebrow="Game Arena · Lớp 10A7"
        title="Cùng chơi. Cùng vui. Cùng kết nối."
        description="Nhiều trò chơi hấp dẫn, bảng xếp hạng, giải đấu và phần thưởng thú vị."
        art="/assets/games/gaming_poster.webp"
      />

      <ThongKeGame ban={tables} sanSang={Boolean(nguoiDung) && !isPending && !isError} />

      {/* ── Bố cục chính 3 cột trải rộng: Cột Trái rộng: Bảng xếp hạng | Cột Giữa To Bự: 5 Game | Cột Phải rộng: Chat & Bạn bè ── */}
      <ResponsiveActivityLayout leaderboard={<GameArenaLeaderboard />} social={<GameSocialSidebar onInviteToGame={handleInviteToGame} />} utilityMode="floating">
        {/* ── Cột 2 (Trung tâm to bự): Danh sách 5 game chiếm trọn không gian giữa ── */}
        <div className="min-w-0 order-1 lg:order-2 flex-1">
          <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Loại trò chơi">{([{ id: 'all', label: 'Tất cả' }, { id: '1v1', label: 'Đối kháng' }, { id: 'solo', label: 'Chơi đơn' }] as const).map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)} className="min-h-11 rounded-xl px-4 text-sm font-medium text-text-secondary outline-none hover:bg-surface-overlay focus-visible:ring-2 focus-visible:ring-brand aria-pressed:bg-brand/12 aria-pressed:text-brand">{item.label}</button>)}</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            {allGames.filter(game => category === 'all' || game.category === category).map((game) => (
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
