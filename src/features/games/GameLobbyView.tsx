import { useCallback, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Clock,
  Flame,
  Gamepad2,
  Plus,
  Search,
  Sparkles,
  Swords,
  Users,
  Zap,
} from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GameLeaderboard } from './GameLeaderboard'
import { GameTableCard } from './GameTableCard'
import { GAME_CATALOG, GAME_CATALOG_BY_ID } from './game-catalog'

interface GameLobbyViewProps {
  onBackToHub: () => void
  onCreateRoom: (roomId: string, gameType: GameType, turnSeconds: number) => void
  onJoinExisting: (roomId: string) => void
}

const maBanNgauNhien = (gameType: GameType) =>
  `${gameType}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

type CategoryFilter = 'all' | 'tri_tue' | 'chien_thuat' | 'giai_do' | 'hanh_dong' | 'thu_gian'

export function GameLobbyView({ onBackToHub, onCreateRoom, onJoinExisting }: GameLobbyViewProps) {
  const { nguoiDung } = usePhien()
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGameForLobby, setSelectedGameForLobby] = useState<GameType | null>(null)
  const [turnSeconds, setTurnSeconds] = useState<number>(30)

  const { data: tablesData, isPending: tablesPending } = useGameRooms()
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

  // Filter games based on category and search query
  const filteredGames = useMemo(() => {
    return GAME_CATALOG.filter((game) => {
      const matchesSearch =
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (selectedCategory === 'all') return true
      if (selectedCategory === 'tri_tue') return game.id === 'caro_15' || game.id === 'reversi'
      if (selectedCategory === 'chien_thuat') return game.id === 'caro_9' || game.id === 'connect4'
      if (selectedCategory === 'giai_do') return game.id === 'solo_2048'
      if (selectedCategory === 'hanh_dong') return game.id === 'solo_snake'
      if (selectedCategory === 'thu_gian') return game.id === 'solo_memory'
      return true
    })
  }, [selectedCategory, searchQuery])

  // Quick Play handler: matches waiting table or creates new room
  const handlePlayGame = useCallback(
    (gameType: GameType) => {
      const def = GAME_CATALOG_BY_ID[gameType]
      if (def.category === 'solo') {
        onCreateRoom(maBanNgauNhien(gameType), gameType, 0)
        return
      }

      // Check if there is a waiting table
      const waiting = tables
        .filter((t) => t.gameType === gameType && t.trangThai === 'waiting')
        .sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]

      if (waiting) {
        onJoinExisting(waiting.id)
        return
      }

      // Open lobby modal or create directly
      onCreateRoom(maBanNgauNhien(gameType), gameType, 30)
    },
    [tables, onJoinExisting, onCreateRoom],
  )

  const handleQuickMatch = useCallback(() => {
    const banBatKy = tables
      .filter((t) => t.trangThai === 'waiting')
      .sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]

    if (banBatKy) {
      onJoinExisting(banBatKy.id)
      return
    }
    onCreateRoom(maBanNgauNhien('caro_15'), 'caro_15', 30)
  }, [tables, onJoinExisting, onCreateRoom])

  return (
    <div className="space-y-6">
      {/* ── 1. Hub Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBackToHub}
            className="h-9 px-3 rounded-xl border-white/15 bg-slate-900/60 text-slate-300 hover:text-white gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Sảnh chính</span>
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <span>🎮</span>
              <span>Đấu Trường Game</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              {tablesPending
                ? 'Đang kết nối đấu trường…'
                : `${tables.length} bàn mở · ${soDangChoi} trận đấu · ${tongNguoiXem} người xem`}
            </p>
          </div>
        </div>

        <Button
          size="lg"
          onClick={handleQuickMatch}
          className="h-11 px-5 rounded-xl text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="h-4 w-4 fill-slate-950" />
          <span>Ghép Nhanh</span>
        </Button>
      </div>

      {/* ── 2. Main Consumer Layout: Games Grid + Sidebar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Featured Hero + Filter Bar + Game Library */}
        <div className="lg:col-span-3 space-y-6">
          {/* Featured Game Hero Banner (Caro 15x15) */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#080d19] shadow-2xl">
            <div
              className="absolute inset-0 z-0 bg-cover bg-right bg-no-repeat opacity-80 sm:opacity-95"
              style={{
                backgroundImage: 'url(/assets/games/game_hero_caro.webp)',
                backgroundPosition: 'right 20% center',
              }}
            />
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#080d19] via-[#080d19]/80 to-transparent sm:bg-gradient-to-r sm:from-[#080d19] sm:via-[#080d19]/90 sm:via-50% sm:to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between min-h-[220px] sm:min-h-[250px] p-5 sm:p-7">
              <div className="max-w-md space-y-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold tracking-wider uppercase">
                  <Sparkles className="h-3 w-3 text-cyan-400" />
                  Game nổi bật
                </span>

                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow">
                  Cờ Caro 15×15
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2">
                  Đặt từng nước đi, chinh phục mọi đối thủ. 5 quân thẳng hàng để giành chiến thắng.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mt-2">
                <div className="flex items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => handlePlayGame('caro_15')}
                    className="h-11 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] gap-2"
                  >
                    <span>Chơi ngay</span>
                    <Swords className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setSelectedGameForLobby('caro_15')}
                    className="h-11 px-4 rounded-xl border-white/20 bg-slate-900/60 hover:bg-slate-800/80 text-white font-bold backdrop-blur-md transition-all gap-1.5"
                  >
                    <Users className="h-4 w-4 text-cyan-400" />
                    <span>Xem bàn ({waitingCounts.caro_15 ?? 0})</span>
                  </Button>
                </div>

                <p className="hidden md:block text-xs font-semibold text-cyan-200/80 italic tracking-wide">
                  Chơi game thông minh hơn · Mỗi ngày
                </p>
              </div>
            </div>
          </div>

          {/* Category Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c1222] p-3 shadow-md">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'tri_tue', label: 'Trí tuệ' },
                { id: 'chien_thuat', label: 'Chiến thuật' },
                { id: 'giai_do', label: 'Giải đố' },
                { id: 'hanh_dong', label: 'Hành động' },
                { id: 'thu_gian', label: 'Thư giãn' },
              ].map((cat) => {
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as CategoryFilter)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>

            <div className="relative sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trò chơi..."
                className="h-8 pl-8 text-xs bg-slate-900/60 border-white/10 focus:border-cyan-500 rounded-xl"
              />
            </div>
          </div>

          {/* Consumer Game Library Grid (7 Games with 3D Cover Art) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredGames.map((game) => {
              const waiting = waitingCounts[game.id] ?? 0
              return (
                <div
                  key={game.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-cyan-500/10 hover:shadow-2xl"
                >
                  {/* 3D Artwork Cover */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-950">
                    <img
                      src={game.cover}
                      alt={game.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-[#0c1222]/30 to-transparent" />

                    {/* Chips over Cover */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-950/80 border border-white/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300 backdrop-blur-md">
                        <span>{game.icon}</span>
                        <span>{game.badge}</span>
                      </span>

                      {game.category === '1v1' ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-200 backdrop-blur-md">
                          {waiting > 0 ? `${waiting} bàn chờ` : 'Đấu 1v1'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold text-indigo-200 backdrop-blur-md">
                          Chơi đơn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Area */}
                  <div className="p-4 pt-2 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                        {game.shortTitle}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {game.subtitle}
                      </p>
                      <p className="text-xs text-slate-300/80 mt-1 line-clamp-2 leading-relaxed">
                        {game.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-auto">
                      <Button
                        size="sm"
                        onClick={() => handlePlayGame(game.id)}
                        className="flex-1 h-9 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
                      >
                        <Gamepad2 className="h-3.5 w-3.5" />
                        <span>Chơi ngay</span>
                      </Button>

                      {game.category === '1v1' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGameForLobby(game.id)}
                          className="h-9 px-3 rounded-xl text-xs font-semibold border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
                        >
                          Bàn ({waiting})
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right 1 Column: Sidebar (Player Identity + Leaderboard + Gaming Poster) */}
        <div className="space-y-4">
          {/* Player Identity Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-black text-sm">
                {(nguoiDung.ten || nguoiDung.username).slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-white truncate">
                  {nguoiDung.ten || nguoiDung.username}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {nguoiDung.lop?.ten ? `Lớp ${nguoiDung.lop.ten}` : 'Học sinh toàn trường'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div className="rounded-xl bg-slate-900/60 p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 text-[11px] font-semibold">
                  <Sparkles className="h-3 w-3" />
                  <span>XP Tích lũy</span>
                </div>
                <p className="text-base font-black text-white mt-0.5">140 XP</p>
              </div>

              <div className="rounded-xl bg-slate-900/60 p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 text-[11px] font-semibold">
                  <Flame className="h-3 w-3" />
                  <span>Chuỗi ngày</span>
                </div>
                <p className="text-base font-black text-white mt-0.5">3 ngày</p>
              </div>
            </div>
          </div>

          {/* Game Leaderboard Widget */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg">
            <GameLeaderboard gameType="caro_15" />
          </div>

          {/* Campus Night Gaming Poster */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg min-h-[140px] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
              style={{ backgroundImage: 'url(/assets/games/gaming_poster.webp)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-[#0c1222]/80 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-1">
              <p className="text-xs font-bold text-white italic drop-shadow">
                Chơi thông minh hơn · Học tốt hơn mỗi ngày
              </p>
              <p className="text-[10px] text-cyan-300 font-medium">Digital Campus Gaming Hub</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Table / Lobby Modal ─────────────────────────── */}
      {selectedGameForLobby && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setSelectedGameForLobby(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#0c1222] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">{GAME_CATALOG_BY_ID[selectedGameForLobby].icon}</span>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Bàn chơi {GAME_CATALOG_BY_ID[selectedGameForLobby].shortTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {GAME_CATALOG_BY_ID[selectedGameForLobby].subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGameForLobby(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Quick Create Table Section */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Thời gian mỗi lượt:
                </span>
                <div className="flex items-center gap-1.5">
                  {[15, 30, 60].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTurnSeconds(s)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        turnSeconds === s
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => {
                  const g = selectedGameForLobby
                  setSelectedGameForLobby(null)
                  onCreateRoom(maBanNgauNhien(g), g, turnSeconds)
                }}
                className="w-full h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo bàn mới ngay</span>
              </Button>
            </div>

            {/* Existing Waiting Tables List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Bàn đang chờ ({tables.filter((t) => t.gameType === selectedGameForLobby && t.trangThai === 'waiting').length})
              </h4>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {tables.filter((t) => t.gameType === selectedGameForLobby).length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Chưa có bàn nào mở. Hãy bấm tạo bàn mới ở trên!
                  </div>
                ) : (
                  tables
                    .filter((t) => t.gameType === selectedGameForLobby)
                    .map((table) => (
                      <GameTableCard
                        key={table.id}
                        table={table}
                        hideGameBadge
                        onEnter={() => {
                          setSelectedGameForLobby(null)
                          onJoinExisting(table.id)
                        }}
                      />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
