import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Trophy } from 'lucide-react'
import { CampusHero } from '@/components/layout/CampusHero'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { GameCard } from './GameCard'
import { ThongKeGame } from './ThongKeGame'
import { CAC_GAME_1V1, CAC_GAME_SOLO, type GameDefinition } from './game-catalog'
import { usePhien } from '@/app/phien'
import { cn } from '@/lib/utils'

interface GameLobbyViewProps {
  /** Bấm vào một trò chơi: mở sảnh của trò đó (mọi bàn đang mở + Chơi ngay · Tạo phòng · Vào phòng · Tìm phòng). */
  onMoSanh: (gameType: GameType) => void
}

export function GameLobbyView({ onMoSanh }: GameLobbyViewProps) {
  const { nguoiDung } = usePhien()
  const [category, setCategory] = useState<'all' | '1v1' | 'solo'>('all')
  // Danh sách bàn online chỉ dành cho người đã đăng nhập: số bàn chờ trên thẻ + thống kê của quản trị.
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

  const hasAuthoritativeData = Boolean(nguoiDung) && !isPending && !isError

  const allGames = useMemo<GameDefinition[]>(() => [...CAC_GAME_1V1, ...CAC_GAME_SOLO], [])
  const displayedGames = useMemo(
    () => allGames.filter((g) => category === 'all' || g.category === category),
    [allGames, category],
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <CampusHero
        eyebrow="Digital Campus · Game"
        title="Đấu trí và giải trí cùng bạn bè"
        description="Khám phá 5 tựa game: Cờ Vua, Cờ Tướng, Caro, Trí Nhớ và Rắn Săn Mồi. Thi đấu đối kháng 1v1 hoặc so tài cùng máy."
        art="/assets/games/gaming_poster.webp"
      />

      <section className="space-y-5" aria-label="Thư viện trò chơi">
        {/* Bộ lọc thể loại & Lối tắt bảng xếp hạng */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center gap-1 rounded-xl border border-border-subtle bg-surface-raised/60 p-1"
            role="group"
            aria-label="Lọc thể loại trò chơi"
          >
            {([
              { id: 'all', label: 'Tất cả' },
              { id: '1v1', label: 'Đối kháng' },
              { id: 'solo', label: 'Chơi đơn' },
            ] as const).map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  'min-h-11 rounded-lg px-4 text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand',
                  category === item.id
                    ? 'border border-border-default bg-surface font-semibold text-text-primary shadow-xs'
                    : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Link
            to="/rankings"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3.5 text-xs font-semibold text-text-secondary transition-colors hover:border-brand/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Trophy className="size-4 text-amber-500" />
            <span>Bảng xếp hạng</span>
          </Link>
        </div>

        {/* Thư viện 5 trò chơi thực tế — Chiếm trọn không gian chính */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              waiting={hasAuthoritativeData ? (waitingCounts[game.id] ?? 0) : 0}
              onMoSanh={() => onMoSanh(game.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Quản trị trường: Thống kê sảnh (tự ẩn với người chơi thường) ── */}
      <ThongKeGame ban={tables} sanSang={hasAuthoritativeData} />
    </div>
  )
}
