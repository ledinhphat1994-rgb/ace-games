import { useCallback, useState } from 'react'
import type { GameType } from '@shared/protocol/game'
import {
  ArrowLeft,
  Crown,
  Gamepad2,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Swords,
  Users,
  Zap,
} from 'lucide-react'
import { SoloGameModal, type SoloGameType } from './SoloGameModal'

interface GameLobbyViewProps {
  onBackToHub: () => void
  onJoinRoom: (roomId: string, gameType: GameType) => void
}

interface GameDefinition {
  id: GameType
  title: string
  subtitle: string
  category: '1v1' | 'solo'
  badge: string
  badgeColor: string
  icon: string
  description: string
  minPlayers: number
  maxPlayers: number
}

const GAME_CATALOG: GameDefinition[] = [
  {
    id: 'caro_15',
    title: 'Cờ Caro 15×15',
    subtitle: 'Đấu trí đỉnh cao',
    category: '1v1',
    badge: '1v1 Cổ Điển',
    badgeColor: 'from-cyan-500 to-blue-600',
    icon: '⚔️',
    description: 'Bàn cờ chuẩn 15×15, 5 quân thẳng hàng chặn 2 đầu hoặc tự do để chiến thắng.',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'caro_9',
    title: 'Caro Nhanh 9×9',
    subtitle: 'Tốc chiến tốc thắng',
    category: '1v1',
    badge: 'Siêu Tốc',
    badgeColor: 'from-amber-500 to-orange-600',
    icon: '⚡',
    description: 'Bàn cờ 9×9 nhịp độ cực nhanh, mỗi lượt đi chớp nhoáng 15s kịch tính.',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'connect4',
    title: 'Connect 4',
    subtitle: 'Thả quân trọng lực',
    category: '1v1',
    badge: 'Chiến Thuật',
    badgeColor: 'from-rose-500 to-pink-600',
    icon: '🔴',
    description: 'Thả quân theo cột, xếp 4 quân đồng màu liên tiếp (ngang, dọc, chéo) để thắng.',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'reversi',
    title: 'Reversi (Othello)',
    subtitle: 'Lật ngược thế cờ',
    category: '1v1',
    badge: 'Trí Tuệ',
    badgeColor: 'from-emerald-500 to-teal-600',
    icon: '⚪',
    description: 'Kẹp quân đối phương ở 8 hướng để lật cờ. Ăn nhiều quân nhất khi kín bàn để thắng.',
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    id: 'solo_2048',
    title: '2048 Siêu Cấp',
    subtitle: 'Ghép số kinh điển',
    category: 'solo',
    badge: 'Solo Logic',
    badgeColor: 'from-yellow-500 to-amber-600',
    icon: '🔢',
    description: 'Trượt các ô để hợp nhất các số bằng nhau, chinh phục mốc điểm 2048 huyền thoại.',
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    id: 'solo_memory',
    title: 'Lật Thẻ Trí Nhớ',
    subtitle: 'Thử thách trí nhớ',
    category: 'solo',
    badge: 'Solo Trí Nhớ',
    badgeColor: 'from-purple-500 to-indigo-600',
    icon: '🃏',
    description: 'Lật tìm 8 cặp biểu tượng tương ứng với số lượt ít nhất để lọt top bảng vàng.',
    minPlayers: 1,
    maxPlayers: 1,
  },
  {
    id: 'solo_snake',
    title: 'Rắn Săn Mồi Retro',
    subtitle: 'Vui nhộn giải lao',
    category: 'solo',
    badge: 'Solo Phản Xạ',
    badgeColor: 'from-green-500 to-emerald-600',
    icon: '🐍',
    description: 'Điều khiển chú rắn ăn táo, tránh va vào tường hoặc cắn vào thân mình.',
    minPlayers: 1,
    maxPlayers: 1,
  },
]

export function GameLobbyView({ onBackToHub, onJoinRoom }: GameLobbyViewProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | '1v1' | 'solo'>('all')
  const [selectedSoloGame, setSelectedSoloGame] = useState<SoloGameType | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGameType, setSelectedGameType] = useState<GameType>('caro_15')
  const [turnTimerSeconds, setTurnTimerSeconds] = useState<number>(30)

  // Interactive Live Board Preview State (15x15)
  const [previewBoard, setPreviewBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null)),
  )
  const [previewTurn, setPreviewTurn] = useState<'X' | 'O'>('X')

  const handlePreviewCellClick = (x: number, y: number) => {
    if (previewBoard[y][x] !== null) return
    setPreviewBoard((prev) => {
      const next = prev.map((r) => [...r])
      next[y][x] = previewTurn
      return next
    })
    setPreviewTurn((t) => (t === 'X' ? 'O' : 'X'))
  }

  const resetPreviewBoard = () => {
    setPreviewBoard(Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => null)))
    setPreviewTurn('X')
  }

  const handleQuickMatch = useCallback(() => {
    // Ghép nhanh: chọn ngẫu nhiên 1 phòng caro nhanh
    const quickRoomId = `caro-quick-${Math.random().toString(36).slice(2, 7)}`
    onJoinRoom(quickRoomId, 'caro_15')
  }, [onJoinRoom])

  const handleCreateGameRoom = useCallback(() => {
    const customId = `room-${selectedGameType}-${Math.random().toString(36).slice(2, 7)}`
    setShowCreateModal(false)
    onJoinRoom(customId, selectedGameType)
  }, [onJoinRoom, selectedGameType])

  const handleCardClick = useCallback((game: GameDefinition) => {
    if (game.category === 'solo') {
      setSelectedSoloGame(game.id as SoloGameType)
    } else {
      const customId = `match-${game.id}-${Math.random().toString(36).slice(2, 7)}`
      onJoinRoom(customId, game.id)
    }
  }, [onJoinRoom])

  const filteredGames = GAME_CATALOG.filter((g) => {
    if (activeCategory === 'all') return true
    return g.category === activeCategory
  })

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto relative font-sans">
      {/* Glow ambient background */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[350px] bg-fuchsia-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-colors border border-slate-700/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sảnh chính</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Đấu Trường Game
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  Arena v2
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleQuickMatch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-transform active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>⚡ Ghép Nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo bàn</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* Category Filter Pills & Hero Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả trò chơi
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('1v1')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === '1v1'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="w-3 h-3" /> Đối kháng (1v1)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('solo')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === 'solo'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3 h-3" /> Chơi đơn (Solo)
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Phân khu giải trí sau giờ học môn Toán & Khoa học</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Game Cards Grid (Left) + Interactive Live Board Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Game Catalog Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => handleCardClick(game)}
                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-slate-900/70 hover:bg-slate-900/95 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/10 cursor-pointer overflow-hidden"
              >
                {/* Glow on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 group-hover:bg-cyan-500/15 rounded-full blur-2xl transition-all" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl p-2 rounded-2xl bg-slate-800/60 border border-slate-700/40 shadow-inner group-hover:scale-110 transition-transform">
                      {game.icon}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${game.badgeColor} shadow-md`}
                    >
                      {game.badge}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-white group-hover:text-cyan-300 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {game.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    {game.category === '1v1' ? '2 người chơi' : 'Điểm xếp hạng'}
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                    <span>{game.category === '1v1' ? 'Vào đấu' : 'Chơi ngay'}</span>
                    <Play className="w-3 h-3 fill-cyan-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Live Mini-Board Preview Widget */}
          <div className="lg:col-span-4 flex flex-col gap-3 p-5 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Thử nước cờ (Live Preview)</h3>
              </div>
              <button
                type="button"
                onClick={resetPreviewBoard}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/50"
                title="Đặt lại bàn thử"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Bấm trực tiếp vào các ô để thử cảm giác đánh cờ với hiệu ứng Neon Cyan & Fuchsia.
            </p>

            {/* 15x15 Dark Neon Preview Grid */}
            <div className="flex justify-center p-2 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-inner">
              <div className="grid grid-cols-15 gap-[1.5px] bg-slate-800/60 p-[2px] rounded-lg">
                {previewBoard.map((row, y) =>
                  row.map((cell, x) => (
                    <button
                      key={`prev-${x}-${y}`}
                      type="button"
                      onClick={() => handlePreviewCellClick(x, y)}
                      className={`
                        w-4 h-4 sm:w-5 sm:h-5 rounded-[2px] flex items-center justify-center text-[9px] font-black transition-colors
                        ${cell === null ? 'bg-slate-900/90 hover:bg-slate-800 cursor-pointer' : ''}
                        ${cell === 'X' ? 'bg-cyan-950 text-cyan-400 shadow-[0_0_4px_rgba(6,182,212,0.8)]' : ''}
                        ${cell === 'O' ? 'bg-fuchsia-950 text-fuchsia-400 shadow-[0_0_4px_rgba(217,70,239,0.8)]' : ''}
                      `}
                    >
                      {cell}
                    </button>
                  )),
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
              <span>Lượt thử kế tiếp:</span>
              <span className={`font-black ${previewTurn === 'X' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                {previewTurn === 'X' ? 'Quân X (Cyan)' : 'Quân O (Fuchsia)'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Tạo bàn đấu mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Chọn trò chơi:</label>
                <select
                  value={selectedGameType}
                  onChange={(e) => setSelectedGameType(e.target.value as GameType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="caro_15">Cờ Caro 15×15</option>
                  <option value="caro_9">Cờ Caro Nhanh 9×9</option>
                  <option value="connect4">Connect 4</option>
                  <option value="reversi">Reversi (Othello) 8×8</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">Thời gian mỗi lượt đi:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTurnTimerSeconds(sec)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        turnTimerSeconds === sec
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateGameRoom}
              className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 transition-transform active:scale-95"
            >
              Vào bàn đấu ngay ⚔️
            </button>
          </div>
        </div>
      )}

      {/* Solo Game Popup Modal */}
      {selectedSoloGame && (
        <SoloGameModal gameType={selectedSoloGame} onClose={() => setSelectedSoloGame(null)} />
      )}
    </div>
  )
}
