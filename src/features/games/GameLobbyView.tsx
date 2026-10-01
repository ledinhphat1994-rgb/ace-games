import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Brain,
  Car,
  Flame,
  Gamepad2,
  MessageSquare,
  Play,
  Puzzle,
  Sparkles,
  Sword,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { GameCard } from './GameCard'
import { ThongKeGame } from './ThongKeGame'
import { CAC_GAME_1V1, CAC_GAME_SOLO, type GameDefinition } from './game-catalog'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GameLobbyViewProps {
  onMoSanh: (gameType: GameType) => void
}

export function GameLobbyView({ onMoSanh }: GameLobbyViewProps) {
  const { nguoiDung, moAuthModal } = usePhien()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [leaderboardTab, setLeaderboardTab] = useState<'chess' | 'caro' | 'racing' | 'total'>('chess')

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

  const displayedGames = useMemo(() => {
    if (selectedFilter === 'strategy') return allGames.filter((g) => g.id === 'chess' || g.id === 'xiangqi')
    if (selectedFilter === 'puzzle') return allGames.filter((g) => g.id === 'caro_15')
    if (selectedFilter === 'action') return allGames.filter((g) => g.id === 'solo_snake')
    if (selectedFilter === 'intel') return allGames.filter((g) => g.id === 'solo_memory')
    return allGames
  }, [allGames, selectedFilter])

  const handleOpenChat = () => {
    if (!nguoiDung) {
      moAuthModal?.('dang_nhap')
      return
    }
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
  }

  // Categories matching E:\phát\hình thiết kế web
  const categories = [
    { id: 'all', label: 'Tất cả', icon: Gamepad2 },
    { id: 'strategy', label: 'Chiến thuật', icon: Sword },
    { id: 'intel', label: 'Trí tuệ', icon: Brain },
    { id: 'puzzle', label: 'Giải đố', icon: Puzzle },
    { id: 'action', label: 'Hành động', icon: Zap },
    { id: 'racing', label: 'Đua xe', icon: Car },
    { id: 'casual', label: 'Casual', icon: Sparkles },
    { id: 'esports', label: 'Esports', icon: Trophy },
  ]

  // Daily quests
  const dailyQuests = [
    { id: 1, title: 'Chơi 1 ván bất kỳ', xp: '+50 XP', icon: Gamepad2 },
    { id: 2, title: 'Thắng 1 ván', xp: '+100 XP', icon: Trophy },
    { id: 3, title: 'Mời 1 người bạn', xp: '+150 XP', icon: Users },
    { id: 4, title: 'Chơi 3 ngày liên tiếp', xp: 'Huy hiệu đặc biệt', icon: Flame },
  ]

  // Leaderboard data
  const gameLeaderboards = {
    chess: [
      { rank: 1, name: 'Nguyễn Minh', score: '4.920 XP', avatar: '/assets/avatars/user-1.webp' },
      { rank: 2, name: 'Trần Mai', score: '4.380 XP', avatar: '/assets/avatars/user-2.webp' },
      { rank: 3, name: 'Lê Hoàng', score: '4.210 XP', avatar: '/assets/avatars/user-3.webp' },
      { rank: 4, name: 'Phạm An', score: '3.950 XP', avatar: '/assets/avatars/user-4.webp' },
      { rank: 5, name: 'Đỗ Linh', score: '3.760 XP', avatar: '/assets/avatars/user-5.webp' },
    ],
    caro: [
      { rank: 1, name: 'Đỗ Linh', score: '4.850 XP', avatar: '/assets/avatars/user-5.webp' },
      { rank: 2, name: 'Lê Hoàng', score: '4.400 XP', avatar: '/assets/avatars/user-3.webp' },
      { rank: 3, name: 'Nguyễn Minh', score: '4.150 XP', avatar: '/assets/avatars/user-1.webp' },
      { rank: 4, name: 'Trần Mai', score: '3.890 XP', avatar: '/assets/avatars/user-2.webp' },
      { rank: 5, name: 'Phạm An', score: '3.620 XP', avatar: '/assets/avatars/user-4.webp' },
    ],
    racing: [
      { rank: 1, name: 'Phạm An', score: '4.650 XP', avatar: '/assets/avatars/user-4.webp' },
      { rank: 2, name: 'Nguyễn Minh', score: '4.320 XP', avatar: '/assets/avatars/user-1.webp' },
      { rank: 3, name: 'Lê Hoàng Duy', score: '4.110 XP', avatar: '/assets/avatars/user-6.webp' },
      { rank: 4, name: 'Đỗ Linh', score: '3.750 XP', avatar: '/assets/avatars/user-5.webp' },
      { rank: 5, name: 'Trần Mai', score: '3.500 XP', avatar: '/assets/avatars/user-2.webp' },
    ],
    total: [
      { rank: 1, name: 'Nguyễn Minh', score: '13.890 XP', avatar: '/assets/avatars/user-1.webp' },
      { rank: 2, name: 'Trần Mai', score: '12.650 XP', avatar: '/assets/avatars/user-2.webp' },
      { rank: 3, name: 'Lê Hoàng', score: '12.430 XP', avatar: '/assets/avatars/user-3.webp' },
      { rank: 4, name: 'Đỗ Linh', score: '11.890 XP', avatar: '/assets/avatars/user-5.webp' },
      { rank: 5, name: 'Phạm An', score: '11.360 XP', avatar: '/assets/avatars/user-4.webp' },
    ],
  }

  return (
    <div className="pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Main Left Area: 8 Columns on XL ── */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 1. Hero Grand Hall Banner */}
          <section
            aria-label="Đấu trường game Digital Campus"
            className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-[#0b1220] shadow-[0_0_40px_rgba(168,85,247,0.08)] group"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src="/assets/cyber_mockups/game_hero_bg.webp"
                alt="Game Arena Banner"
                className="h-full w-full object-cover object-right opacity-40 dark:opacity-45 scale-100 group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 p-6 sm:p-9 lg:p-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-purple-400 mb-4 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                <span className="size-2 rounded-full bg-purple-400 animate-pulse" />
                <span>GAME TẠI DIGITAL CAMPUS</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.25]">
                Chơi game
                <br />
                Cùng bạn bè
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-sky-300 to-indigo-400">
                  Nâng tầm kỹ năng
                </span>
              </h1>

              <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
                Giải trí lành mạnh, kết nối bạn bè, tham gia giải đấu dành riêng cho học sinh, sinh viên Digital Campus.
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <Button
                  size="lg"
                  onClick={() => onMoSanh('chess')}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
                >
                  <span>Khám phá game ngay</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toast.info('Video giới thiệu Đấu trường Game')}
                  className="h-11 px-5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer gap-2"
                >
                  <Play className="h-4 w-4 fill-white text-white" />
                  <span>Xem video</span>
                </Button>
              </div>

              {/* 4 Stat Badges */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span>24.5K học sinh chơi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="size-4 text-purple-400" />
                  <span>80+ trò chơi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-400" />
                  <span>12+ giải đấu/tháng</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-sky-400" />
                  <span>Kết nối bạn bè</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Danh mục Game (Filter Pills) */}
          <section aria-label="Danh mục game" className="space-y-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4.5 w-4.5 text-purple-400" />
              <h2 className="text-base font-bold text-text-primary">Danh mục game</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = selectedFilter === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFilter(cat.id)}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                      isActive
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                        : 'border-border-default/70 bg-[#0f172a] text-slate-400 hover:text-white hover:border-slate-700',
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 3. Game nổi bật Grid */}
          <section aria-label="Trò chơi trực tuyến" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
                <h2 className="text-lg font-bold text-text-primary tracking-tight">Game nổi bật</h2>
              </div>
              <Link
                to="/leaderboard"
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Bảng xếp hạng game</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* 4. Thử thách mỗi ngày (Daily Quests) */}
          <section className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center shrink-0">
                  <Target className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Thử thách mỗi ngày</h3>
                  <p className="text-xs text-slate-300">
                    Hoàn thành nhiệm vụ game mỗi ngày để nhận XP, huy hiệu và quà tặng hấp dẫn!
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('Đã nhận thưởng thử thách hàng ngày: +50 XP!')}
                className="h-9 px-4 rounded-xl border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold shrink-0 cursor-pointer"
              >
                <span>Xem nhiệm vụ</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {dailyQuests.map((q) => {
                const Icon = q.icon
                return (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="size-4 text-purple-400" />
                      <span className="text-[10px] font-mono font-bold text-amber-400">{q.xp}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-200 line-clamp-1">{q.title}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Admin ThongKeGame */}
          <ThongKeGame ban={tables} sanSang={hasAuthoritativeData} />
        </div>

        {/* ── Right Area: 4 Columns on XL (Sidebar Widgets) ── */}
        <div className="xl:col-span-4 space-y-6">
          {/* Widget 1: Tin nhắn mới */}
          <section aria-label="Tin nhắn mới" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Tin nhắn mới</h2>
              </div>
              <button
                type="button"
                onClick={handleOpenChat}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-2.5">
              {[
                { name: 'Trần Mai', msg: 'Tối nay solo cờ vua nhé?', time: '2 phút trước', badge: 2 },
                { name: 'Lê Hoàng', msg: 'Đã gửi lời mời thách đấu', time: '10 phút trước', badge: 1 },
                { name: 'Nhóm Lớp 10A7', msg: 'Minh: Kèo Cờ vua lúc 8h nhé!', time: '15 phút trước' },
              ].map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={handleOpenChat}
                  className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 truncate mt-0.5">{m.msg}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
                    {m.badge && (
                      <span className="size-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {m.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              <Button
                onClick={handleOpenChat}
                className="w-full h-9 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-sm mt-1 cursor-pointer"
              >
                <span>Mở hộp thoại chat</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </div>
          </section>

          {/* Widget 2: Giải đấu sắp diễn ra */}
          <section aria-label="Giải đấu sắp diễn ra" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Giải đấu sắp diễn ra</h2>
              </div>
              <button
                type="button"
                onClick={() => toast.info('Danh sách giải đấu Digital Campus Cup')}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-3">
              <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900 border border-white/5">
                <img
                  src="/assets/cyber_mockups/act_game.webp"
                  alt="Digital Campus Cup"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md">
                  SẮP DIỄN RA
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">Digital Campus Cup 2024</h3>
                <p className="text-xs text-slate-400 mt-0.5">Giải đấu đa bộ môn dành cho học sinh, sinh viên</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                  <span>📅 01 - 20 Tháng 11</span>
                  <span>👥 1.2K người tham gia</span>
                </div>
              </div>

              <Button
                onClick={() => toast.success('Đã ghi nhận đăng ký tham gia Digital Campus Cup 2024!')}
                className="w-full h-9 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <span>Đăng ký tham gia ngay</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </div>
          </section>

          {/* Widget 3: Bảng xếp hạng tuần */}
          <section aria-label="Bảng xếp hạng tuần" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Bảng xếp hạng tuần</h2>
              </div>
              <Link to="/leaderboard" className="text-xs font-bold text-sky-400 hover:underline cursor-pointer">
                Xem tất cả
              </Link>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-3">
              {/* Category tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/5 text-[11px]">
                {[
                  { id: 'chess', label: 'Cờ vua' },
                  { id: 'caro', label: 'Cờ caro' },
                  { id: 'racing', label: 'Đua xe' },
                  { id: 'total', label: 'Tổng' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLeaderboardTab(t.id as any)}
                    className={cn(
                      'py-1 rounded-lg text-center font-medium transition-all cursor-pointer',
                      leaderboardTab === t.id
                        ? 'bg-purple-500 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Ranker list */}
              <div className="space-y-2 pt-1">
                {gameLeaderboards[leaderboardTab].map((u) => (
                  <div
                    key={u.rank}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          'size-6 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                          u.rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                            : u.rank === 2
                              ? 'bg-slate-300 text-slate-950'
                              : u.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-400',
                        )}
                      >
                        {u.rank}
                      </span>
                      <img src={u.avatar} alt={u.name} className="size-7 rounded-full border border-white/10" />
                      <span className="text-xs font-bold text-white truncate">{u.name}</span>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0">{u.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
