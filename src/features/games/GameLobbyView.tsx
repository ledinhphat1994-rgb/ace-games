import { useCallback, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Crown,
  Gamepad2,
  Play,
  Plus,
  Search,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BoardPreviewSheet } from './BoardPreviewSheet'
import { CAC_GAME_1V1, GAME_CATALOG, type GameDefinition } from './game-catalog'
import { GameLeaderboard } from './GameLeaderboard'
import { GameTableCard } from './GameTableCard'
import { SoloGameModal, type SoloGameType } from './SoloGameModal'

interface GameLobbyViewProps {
  onBackToHub: () => void
  onCreateRoom: (roomId: string, gameType: GameType, turnSeconds: number) => void
  onJoinExisting: (roomId: string) => void
}

type Category = 'all' | '1v1' | 'solo' | 'leaderboard'
type TableFilter = 'all' | 'waiting' | 'playing'

const maBanNgauNhien = (gameType: GameType) => `${gameType}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

export function GameLobbyView({ onBackToHub, onCreateRoom, onJoinExisting }: GameLobbyViewProps) {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [tableFilter, setTableFilter] = useState<TableFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSoloGame, setSelectedSoloGame] = useState<SoloGameType | null>(null)
  const [previewGameType, setPreviewGameType] = useState<GameType | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGameType, setSelectedGameType] = useState<GameType>('caro_15')
  const [turnTimerSeconds, setTurnTimerSeconds] = useState<number>(30)

  const { data: tablesData, isPending: tablesPending, isError: tablesError } = useGameRooms()
  const tables = useMemo<BanSanh[]>(() => tablesData ?? [], [tablesData])

  const waitingCounts = useMemo(() => {
    const dem: Partial<Record<GameType, number>> = {}
    for (const t of tables) {
      if (t.trangThai === 'waiting') dem[t.gameType] = (dem[t.gameType] ?? 0) + 1
    }
    return dem
  }, [tables])

  const soDangChoi = useMemo(() => tables.filter((t) => t.trangThai === 'playing').length, [tables])
  const tongNguoiXem = useMemo(() => tables.reduce((sum, t) => sum + t.soNguoiXem, 0), [tables])

  const openExisting = useCallback(
    (gameType: GameType): boolean => {
      // Ưu tiên ghép vào bàn đang chờ sẵn cùng loại thay vì luôn mở bàn mới — đúng nghĩa "matchmaking".
      const banCho = tables
        .filter((t) => t.gameType === gameType && t.trangThai === 'waiting')
        .sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]
      if (banCho) {
        onJoinExisting(banCho.id)
        return true
      }
      return false
    },
    [tables, onJoinExisting],
  )

  const handleQuickMatch = useCallback(() => {
    const banBatKyDangCho = tables
      .filter((t) => t.trangThai === 'waiting')
      .sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]
    if (banBatKyDangCho) {
      onJoinExisting(banBatKyDangCho.id)
      return
    }
    onCreateRoom(maBanNgauNhien('caro_15'), 'caro_15', 30)
  }, [tables, onJoinExisting, onCreateRoom])

  const handleCreateGameRoom = useCallback(() => {
    setShowCreateModal(false)
    onCreateRoom(maBanNgauNhien(selectedGameType), selectedGameType, turnTimerSeconds)
  }, [onCreateRoom, selectedGameType, turnTimerSeconds])

  const handleCardClick = useCallback(
    (game: GameDefinition) => {
      if (game.category === 'solo') {
        setSelectedSoloGame(game.id as SoloGameType)
        return
      }
      if (openExisting(game.id)) return
      onCreateRoom(maBanNgauNhien(game.id), game.id, 30)
    },
    [openExisting, onCreateRoom],
  )

  const tuKhoa = searchQuery.trim().toLowerCase()
  const filteredGames = GAME_CATALOG.filter((g) => {
    if (activeCategory === '1v1' && g.category !== '1v1') return false
    if (activeCategory === 'solo' && g.category !== 'solo') return false
    if (tuKhoa && !g.title.toLowerCase().includes(tuKhoa)) return false
    return true
  })

  const filteredTables = tables
    .filter((t) => tableFilter === 'all' || t.trangThai === tableFilter)
    .filter((t) => !tuKhoa || t.tenChu?.toLowerCase().includes(tuKhoa) || t.tenKhach?.toLowerCase().includes(tuKhoa))

  const hienFeedBan = activeCategory !== 'solo' && activeCategory !== 'leaderboard'

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-slate-950 font-sans text-slate-100">
      {/* Glow ambient background */}
      <div className="pointer-events-none absolute top-0 left-1/4 h-[300px] w-[600px] rounded-full bg-cyan-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-[350px] w-[500px] rounded-full bg-fuchsia-600/10 blur-[140px]" />

      {/* Top Header */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBackToHub}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-700/50 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700/80 hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            <span>Sảnh chính</span>
          </button>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white">
              <span className="text-xl">🎮</span>
              Đấu Trường Game
            </h1>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              {tablesPending
                ? 'Đang tải dữ liệu…'
                : `${tables.length} bàn đang mở · ${soDangChoi} trận trực tiếp · ${tongNguoiXem} người đang xem`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handleQuickMatch}
            className="h-9 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500"
          >
            <Zap className="size-3.5 fill-slate-950" />
            <span className="hidden sm:inline">⚡ Ghép Nhanh</span>
            <span className="sm:hidden">Ghép nhanh</span>
          </Button>
          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="h-9 gap-1.5 bg-cyan-600 px-3.5 font-bold text-white shadow-lg shadow-cyan-600/25 hover:bg-cyan-500"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Tạo Bàn Đấu</span>
            <span className="sm:hidden">Tạo bàn</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-8">
        {/* Category tabs + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-fit flex-wrap items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/90 p-1">
            {(
              [
                { id: 'all', label: 'Tất cả trò chơi', icon: null },
                { id: '1v1', label: 'Đối kháng (1v1)', icon: Swords },
                { id: 'solo', label: 'Chơi đơn (Solo)', icon: Gamepad2 },
                { id: 'leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeCategory === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.icon ? <tab.icon className="size-3" /> : null}
                {tab.label}
              </button>
            ))}
          </div>

          {activeCategory !== 'leaderboard' && (
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trò chơi hoặc người chơi…"
                className="h-9 border-slate-800 bg-slate-900/90 pl-9 text-xs text-white placeholder:text-slate-500"
              />
            </div>
          )}
        </div>

        {activeCategory === 'leaderboard' ? (
          <GameLeaderboard />
        ) : (
          <>
            {/* Featured Game Showcase Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGames.map((game) => {
                const soCho = waitingCounts[game.id] ?? 0
                return (
                  <div
                    key={game.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-lg transition-all duration-300 hover:border-cyan-500/50 hover:bg-slate-900/95 hover:shadow-cyan-500/10"
                  >
                    <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl transition-all group-hover:bg-cyan-500/15" />

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-2xl border border-slate-700/40 bg-slate-800/60 p-2 text-3xl shadow-inner transition-transform group-hover:scale-110">
                          {game.icon}
                        </span>
                        <span
                          className={`rounded-full bg-gradient-to-r px-2.5 py-1 text-[10px] font-extrabold text-white uppercase shadow-md ${game.badgeColor}`}
                        >
                          {game.badge}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-white transition-colors group-hover:text-cyan-300">
                        {game.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-relaxed text-slate-400">
                        {game.description}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                      <span className="font-medium text-slate-400">
                        {game.category === '1v1' ? (
                          soCho > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-cyan-400">
                              <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />⚡ {soCho} bàn chờ
                            </span>
                          ) : (
                            '2 người chơi'
                          )
                        ) : (
                          'Điểm xếp hạng'
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {game.category === '1v1' && (
                          <button
                            type="button"
                            onClick={() => setPreviewGameType(game.id)}
                            className="text-[11px] font-semibold text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
                          >
                            Xem thử
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCardClick(game)}
                          className="flex items-center gap-1 font-bold text-cyan-400 transition-transform group-hover:translate-x-1"
                        >
                          <span>{game.category === '1v1' ? 'Vào đấu' : 'Chơi ngay'}</span>
                          <Play className="size-3 fill-cyan-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Real-time Active Tables Feed */}
            {hienFeedBan && (
              <div className="flex flex-col gap-3 rounded-3xl border border-slate-800/90 bg-slate-900/60 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Bàn Đấu Đang Mở</h3>
                  </div>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Tất cả bàn' },
                        { id: 'waiting', label: 'Đang chờ đối thủ' },
                        { id: 'playing', label: 'Đang thi đấu' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTableFilter(f.id)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          tableFilter === f.id
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800/70 text-slate-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex min-h-24 flex-col gap-2" style={{ overflowAnchor: 'none' }}>
                  {tablesError ? (
                    <div className="flex h-24 items-center justify-center text-xs text-rose-400">
                      Không tải được danh sách bàn, thử lại sau.
                    </div>
                  ) : filteredTables.length > 0 ? (
                    filteredTables.map((t) => (
                      <GameTableCard key={t.id} table={t} onEnter={() => onJoinExisting(t.id)} />
                    ))
                  ) : (
                    <div className="flex h-24 flex-col items-center justify-center gap-1 text-center text-xs text-slate-500">
                      <Swords className="size-5 text-slate-700" />
                      {tablesPending
                        ? 'Đang tải…'
                        : tableFilter === 'waiting'
                          ? 'Chưa có bàn nào đang chờ đối thủ — mở bàn mới hoặc bấm Ghép Nhanh!'
                          : tableFilter === 'playing'
                            ? 'Chưa có trận nào đang diễn ra.'
                            : 'Chưa có bàn nào đang mở — hãy là người đầu tiên!'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Tạo bàn đấu mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="chon-tro-choi" className="mb-1.5 block text-xs font-semibold text-slate-400">
                  Chọn trò chơi:
                </label>
                <select
                  id="chon-tro-choi"
                  value={selectedGameType}
                  onChange={(e) => setSelectedGameType(e.target.value as GameType)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-white focus:border-cyan-500 focus:outline-none"
                >
                  {CAC_GAME_1V1.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.boardLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="mb-1.5 block text-xs font-semibold text-slate-400">Thời gian mỗi lượt đi:</span>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTurnTimerSeconds(sec)}
                      className={`rounded-xl border py-2 text-xs font-bold transition-colors ${
                        turnTimerSeconds === sec
                          ? 'border-cyan-500 bg-cyan-600 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCreateGameRoom}
              className="mt-2 w-full gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 font-extrabold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
            >
              Vào bàn đấu ngay ⚔️
            </Button>
          </div>
        </div>
      )}

      <BoardPreviewSheet gameType={previewGameType} onOpenChange={(open) => !open && setPreviewGameType(null)} />

      {selectedSoloGame && <SoloGameModal gameType={selectedSoloGame} onClose={() => setSelectedSoloGame(null)} />}
    </div>
  )
}
