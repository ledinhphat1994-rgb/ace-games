import { useState, useMemo, useCallback } from 'react'
import { Gamepad2, Plus } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { GameArt } from './GameArt'
import { GameCard } from './GameCard'
import { GameArenaLeaderboard } from './GameArenaLeaderboard'
import { GameSocialSidebar } from './GameSocialSidebar'
import { laTroChoiDon, taoMaBan } from './game-ids'
import { CAC_GAME_1V1, CAC_GAME_SOLO, GAME_CATALOG_BY_ID, type GameDefinition } from './game-catalog'
import { toast } from 'sonner'

interface GameLobbyViewProps {
  onCreateRoom: (roomId: string, gameType: GameType, turnSeconds: number) => void
  onJoinExisting: (roomId: string) => void
}

const THOI_GIAN_LUOT = [15, 30, 60] as const

/** Bàn đang chờ lên trước, rồi bàn đông người xem. */
function xepBan(a: BanSanh, b: BanSanh) {
  const uuTien = (t: BanSanh) => (t.trangThai === 'waiting' ? 0 : 1)
  return uuTien(a) - uuTien(b) || b.soNguoiXem - a.soNguoiXem || b.capNhatLuc - a.capNhatLuc
}

export function GameLobbyView({ onCreateRoom, onJoinExisting }: GameLobbyViewProps) {
  const [hopThoaiBan, setHopThoaiBan] = useState<{ open: boolean; game: GameType }>({ open: false, game: 'caro_15' })
  const [turnSeconds, setTurnSeconds] = useState<number>(30)

  const { data: tablesData } = useGameRooms()
  const tables = useMemo<BanSanh[]>(
    () => ((tablesData ?? []) as BanSanh[]).filter((t: BanSanh) => t.trangThai !== 'ended').sort(xepBan),
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

  // Chơi ngay: trò đơn mở phiên riêng; trò đối kháng vào bàn đang chờ đông người xem nhất, không có thì mở bàn mới.
  const handlePlayGame = useCallback(
    (gameType: GameType) => {
      if (laTroChoiDon(gameType)) {
        onCreateRoom(taoMaBan(gameType), gameType, 0)
        return
      }

      const waiting = tables
        .filter((t: BanSanh) => t.gameType === gameType && t.trangThai === 'waiting')
        .sort((a: BanSanh, b: BanSanh) => b.soNguoiXem - a.soNguoiXem)[0]

      if (waiting) {
        onJoinExisting(waiting.id)
        return
      }

      onCreateRoom(taoMaBan(gameType), gameType, 30)
    },
    [tables, onJoinExisting, onCreateRoom],
  )


  const handleInviteToGame = useCallback(
    (_friendId: number, friendName: string) => {
      const maBan = taoMaBan('caro_15')
      onCreateRoom(maBan, 'caro_15', 30)
      toast.success(`Đã mở bàn Caro và gửi lời mời tới ${friendName}!`)
    },
    [onCreateRoom]
  )

  const moHopThoaiBan = (game: GameType) => setHopThoaiBan({ open: true, game })
  const tableCuaTroDangMo = tables.filter((t: BanSanh) => t.gameType === hopThoaiBan.game)
  const troDangMo = GAME_CATALOG_BY_ID[hopThoaiBan.game]

  const allGames = useMemo<GameDefinition[]>(() => [...CAC_GAME_1V1, ...CAC_GAME_SOLO], [])

  const gameStats = useMemo(() => {
    const stats: Partial<Record<GameType, { banCount: number; playersCount: number; spectatorsCount: number }>> = {}
    for (const g of allGames) {
      stats[g.id] = { banCount: 0, playersCount: 0, spectatorsCount: 0 }
    }
    for (const t of tables) {
      if (stats[t.gameType]) {
        stats[t.gameType]!.banCount += 1
        stats[t.gameType]!.playersCount += (t.tenChu ? 1 : 0) + (t.tenKhach ? 1 : 0)
        stats[t.gameType]!.spectatorsCount += t.soNguoiXem ?? 0
      }
    }
    return stats
  }, [allGames, tables])

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
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                Game
              </h1>
              <span className="rounded-full bg-gradient-to-r from-cyan-500/20 to-brand/20 border border-cyan-500/30 px-3 py-0.5 text-xs font-extrabold text-cyan-300 shadow-sm">
                5 Bộ Môn
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bố cục chính 3 cột trải rộng: Cột Trái rộng: Bảng xếp hạng | Cột Giữa To Bự: 5 Game | Cột Phải rộng: Chat & Bạn bè ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_370px] 2xl:grid-cols-[380px_minmax(0,1fr)_380px] items-start w-full">
        {/* ── Cột 1 (Bên trái): Bảng xếp hạng dài & ngang bằng cột chat ── */}
        <div className="min-w-0 order-2 lg:order-1">
          <GameArenaLeaderboard />
        </div>

        {/* ── Cột 2 (Trung tâm to bự): Danh sách 5 game chiếm trọn không gian giữa ── */}
        <div className="min-w-0 order-1 lg:order-2 flex-1">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {allGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                waiting={waitingCounts[game.id] ?? 0}
                stats={gameStats[game.id]}
                onPlay={() => handlePlayGame(game.id)}
                onOpenTables={() => moHopThoaiBan(game.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Cột 3 (Bên phải): Trò chuyện chung, riêng & Danh sách bạn ── */}
        <div className="min-w-0 order-3 lg:col-span-2 xl:col-span-1">
          <GameSocialSidebar onInviteToGame={handleInviteToGame} />
        </div>
      </div>

      {/* Hộp thoại xem các bàn đang chờ của một trò chơi đối kháng */}
      <Dialog
        open={hopThoaiBan.open}
        onOpenChange={(open) => setHopThoaiBan((p: { open: boolean; game: GameType }) => ({ ...p, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogTitle className="flex items-center gap-2">
            <span className="size-5">
              <GameArt gameType={hopThoaiBan.game} className="size-full" />
            </span>
            Bàn {troDangMo?.title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Vào bàn bạn bè đang chờ hoặc tự tạo bàn mới.
          </DialogDescription>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="text-xs">
              <p className="font-semibold text-text-primary">Mở bàn mới</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-text-tertiary">Mỗi lượt:</span>
                {THOI_GIAN_LUOT.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTurnSeconds(s)}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-semibold transition-colors',
                      turnSeconds === s
                        ? 'bg-brand text-brand-foreground'
                        : 'bg-white/5 text-text-secondary hover:text-white',
                    )}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setHopThoaiBan((p: { open: boolean; game: GameType }) => ({ ...p, open: false }))
                onCreateRoom(taoMaBan(hopThoaiBan.game), hopThoaiBan.game, turnSeconds)
              }}
            >
              <Plus className="size-3.5" />
              Mở bàn
            </Button>
          </div>

          <div className="mt-2 min-h-32 max-h-64 overflow-y-auto space-y-1.5">
            {tableCuaTroDangMo.length === 0 ? (
              <p className="py-8 text-center text-xs text-text-tertiary">
                Chưa có bàn nào đang chờ — hãy tạo bàn đầu tiên!
              </p>
            ) : (
              tableCuaTroDangMo.map((t: BanSanh) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 hover:bg-white/5 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-text-primary">{t.tenChu || 'Người chơi X'}</p>
                    <p className="text-[10px] text-text-tertiary">{t.turnTimerSeconds}s / lượt</p>
                  </div>
                  <Button
                    size="xs"
                    onClick={() => {
                      setHopThoaiBan((p: { open: boolean; game: GameType }) => ({ ...p, open: false }))
                      onJoinExisting(t.id)
                    }}
                  >
                    Vào đấu
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
