import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Brain,
  DoorOpen,
  Gamepad2,
  Shield,
  Sword,
  Trophy,
  Users,
} from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { GameCard } from './GameCard'
import { ThongKeGame } from './ThongKeGame'
import { CAC_GAME_1V1, CAC_GAME_SOLO, type GameDefinition, GAME_CATALOG } from './game-catalog'
import { usePhien } from '@/app/phien'
import { useDragScroll } from '@/hooks/use-drag-scroll'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GameLobbyViewProps {
  onMoSanh: (gameType: GameType) => void
}

export function GameLobbyView({ onMoSanh }: GameLobbyViewProps) {
  const { nguoiDung } = usePhien()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pvp' | 'solo'>('all')

  const categoriesDrag = useDragScroll<HTMLDivElement>({ direction: 'horizontal' })
  const gamesCarouselDrag = useDragScroll<HTMLDivElement>({ direction: 'horizontal' })
  const tablesDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })

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

  const displayedGames = useMemo<GameDefinition[]>(() => {
    if (selectedFilter === 'pvp') return CAC_GAME_1V1
    if (selectedFilter === 'solo') return CAC_GAME_SOLO
    return GAME_CATALOG
  }, [selectedFilter])

  // Danh mục game chuẩn của nền tảng (không fake danh mục)
  const categories = [
    { id: 'all' as const, label: 'Tất cả trò chơi (5)', icon: Gamepad2 },
    { id: 'pvp' as const, label: 'Đối kháng 1v1 (3)', icon: Sword },
    { id: 'solo' as const, label: 'Chơi đơn & Kỷ lục (2)', icon: Brain },
  ]

  return (
    <div className="pb-12 space-y-8">
      {/* 1. Hero Grand Hall Banner (Full-width, Doubled Height) */}
      <section
        aria-label="Đấu trường game Digital Campus"
        className="relative w-full min-h-[440px] lg:min-h-[480px] flex flex-col justify-center overflow-hidden rounded-3xl border border-purple-500/25 bg-[#040e29] shadow-[0_0_40px_rgba(168,85,247,0.15)] group"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/assets/cyber_mockups/game_hero_bg.webp"
            alt="Game Arena Banner"
            className="h-full w-full object-cover object-right opacity-80 dark:opacity-85 crisp-image scale-100 group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020c24] via-[#020c24]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020c24]/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-purple-400 mb-4 shadow-[0_0_12px_rgba(168,85,247,0.2)]">
            <span className="size-2 rounded-full bg-purple-400 animate-pulse" />
            <span>ĐẤU TRƯỜNG TRÒ CHƠI • DIGITAL CAMPUS</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
            Đấu Trí Chiến Thuật & Giải Trí
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Thi đấu cờ vua, cờ tướng, cờ caro đối kháng trực tuyến hoặc luyện tập trí tuệ và phản xạ cùng Máy.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="default"
              onClick={() => onMoSanh('chess')}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer gap-2"
            >
              <Sword className="size-4" />
              <span>Vào sảnh Cờ Vua</span>
              <ArrowRight className="size-3.5" />
            </Button>

            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer"
            >
              <Trophy className="size-4 text-amber-400" />
              <span>Bảng xếp hạng game</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Khu vực chính giữa: 8 Cột trên XL ── */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 2. Thanh lọc danh mục (Kéo qua kéo lại mượt mà - Smooth Drag Scroll) */}
          <section aria-label="Danh mục game" className="space-y-2">
            <div
              ref={categoriesDrag.ref}
              {...categoriesDrag.events}
              className="smooth-carousel flex overflow-x-auto gap-2 pb-2 scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing select-none"
            >
              {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = selectedFilter === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedFilter(cat.id)}
                    className={cn(
                      'shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                      isActive
                        ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'border-border-default/70 bg-[#0f172a] text-slate-300 hover:bg-slate-800 hover:text-white',
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* 3. Băng chuyền trò chơi (Kéo qua kéo lại trơn tru mượt mà - Smooth Horizontal Carousel) */}
          <section aria-label="Trò chơi trực tuyến" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-purple-400" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Danh sách trò chơi ({displayedGames.length})
                </h2>
              </div>
            </div>

            {/* Thanh cuộn ngang mượt mà liên tục cho các thẻ game (không snap khựng khối) */}
            <div
              ref={gamesCarouselDrag.ref}
              {...gamesCarouselDrag.events}
              className="smooth-carousel flex overflow-x-auto gap-4 pb-4 pt-1 scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing select-none"
            >
              {displayedGames.map((game) => (
                <div key={game.id} className="shrink-0 w-[280px] sm:w-[320px]">
                  <GameCard
                    game={game}
                    waiting={hasAuthoritativeData ? (waitingCounts[game.id] ?? 0) : 0}
                    onMoSanh={() => onMoSanh(game.id)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* 4. Danh sách bàn chơi đang mở (Kéo lên kéo xuống - Vertical Scroll) */}
          <section aria-label="Bàn chơi đang mở" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Bàn đấu đang chờ ({tables.length})
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface p-3 shadow-sm">
              {tables.length > 0 ? (
                <div
                  ref={tablesDrag.ref}
                  {...tablesDrag.events}
                  className="overflow-y-auto max-h-[340px] scrollbar-thin space-y-2 pr-1 cursor-grab active:cursor-grabbing select-none touch-pan-y"
                >
                  {tables.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                          <DoorOpen className="size-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {t.tenChu ? `Bàn của ${t.tenChu}` : `Bàn #${t.id}`}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {t.gameType === 'chess'
                              ? 'Cờ Vua'
                              : t.gameType === 'xiangqi'
                                ? 'Cờ Tướng'
                                : t.gameType === 'caro_15'
                                  ? 'Cờ Caro'
                                  : t.gameType}
                            {' • '}
                            {t.trangThai === 'waiting' ? (
                              <span className="text-emerald-400 font-semibold">Đang chờ đối thủ</span>
                            ) : (
                              <span className="text-amber-400">Đang thi đấu</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => onMoSanh(t.gameType)}
                        className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                      >
                        <span>Vào bàn</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Gamepad2 className="size-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">Chưa có bàn chơi nào đang mở</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Hãy bấm vào một trò chơi ở phía trên để tạo bàn đấu mới hoặc so tài ngay với Máy (AI).
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Admin ThongKeGame */}
          <ThongKeGame ban={tables} sanSang={hasAuthoritativeData} />
        </div>

        {/* ── Cột tiện ích bên phải: 4 Cột trên XL (Kéo lên kéo xuống) ── */}
        <div className="xl:col-span-4 space-y-6">
          {/* Tiện ích 1: Hướng dẫn cơ chế thi đấu */}
          <section aria-label="Chế độ chơi" className="rounded-2xl border border-border-default/80 bg-surface p-4 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Chế độ thi đấu
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="size-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <Users className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Đối kháng 1v1 (PvP)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Tạo bàn, mời bạn bè qua mã phòng hoặc ghép ngẫu nhiên cùng học sinh trong trường.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="size-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <Brain className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Luyện tập với Máy (PvE AI)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Rèn luyện chiến thuật ngoại tuyến với AI đa cấp độ: Dễ, Trung bình, Khó.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Xác thực máy chủ chống gian lận</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Tất cả kết quả và kỷ lục trò chơi được máy chủ Cloudflare Worker xác thực nghiêm ngặt.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Tiện ích 2: Bảng xếp hạng kỷ lục Game */}
          <section aria-label="Kỷ lục game" className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-surface to-amber-950/20 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Trophy className="size-4.5" />
              <h3 className="text-sm font-bold text-white">Bảng xếp hạng kỷ lục</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tôn vinh những kỳ thủ cờ vua, cờ tướng, cờ caro và cao thủ săn mồi đạt kỷ lục cao nhất trường.
            </p>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Xem bảng xếp hạng game</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
