import { Play, Swords, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GameArt } from './GameArt'
import type { GameDefinition } from './game-catalog'
import { cn } from '@/lib/utils'

export interface GameCardStats {
  banCount: number
  playersCount: number
  spectatorsCount: number
}

interface GameCardProps {
  game: GameDefinition
  waiting: number
  stats?: GameCardStats
  onPlay: () => void
  onOpenTables?: () => void
}

export function GameCard({ game, waiting, stats, onPlay }: GameCardProps) {
  const laDoiKhang = game.category === '1v1'
  // Vùng 6: Đồng bộ màu badge theo nội dung giống nhau (1v1 & Đấu Máy: cyan neon; Đấu AI & Solo: tím neon)
  const badgeColor = laDoiKhang
    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/10'
    : 'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-500/10'

  return (
    <article
      data-testid={`game-card-${game.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#101728] to-[#0a0f1d] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/15"
    >
      {/* Artwork container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5 bg-black/40">
        <GameArt
          gameType={game.id}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top-left Category & Mode Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md shadow-sm',
              badgeColor
            )}
          >
            {laDoiKhang ? <Swords className="size-3" /> : <Bot className="size-3" />}
            {laDoiKhang ? '1v1 & Đấu Máy' : 'Đấu AI & Solo'}
          </span>
        </div>

        {/* Top-right Waiting tables indicator */}
        {laDoiKhang && waiting > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {waiting} bàn chờ
          </span>
        )}
      </div>

      {/* Body container */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-extrabold tracking-tight text-white group-hover:text-brand transition-colors">
            {game.shortTitle}
          </h3>
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
            {game.boardLabel || 'Bàn cờ'}
          </span>
        </div>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
          {game.description}
        </p>

        {/* Vùng 6: Thống kê 3 chỉ số (Số bàn, Số người chơi, Số người xem) & Nút Chơi ngay */}
        <div className="mt-auto pt-4 space-y-2.5">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/5 bg-white/[0.03] p-1.5 text-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-text-tertiary">Số bàn</span>
              <span className="text-xs font-bold text-white tabular-nums">
                {stats?.banCount ?? (laDoiKhang ? waiting : 0)}
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-white/5">
              <span className="text-[10px] text-text-tertiary">Số người chơi</span>
              <span className="text-xs font-bold text-emerald-400 tabular-nums">
                {stats?.playersCount ?? 0}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-text-tertiary">Số người xem</span>
              <span className="text-xs font-bold text-cyan-400 tabular-nums">
                {stats?.spectatorsCount ?? 0}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onPlay}
            aria-label={`Chơi ngay ${game.shortTitle}`}
            className="w-full font-bold bg-brand text-brand-foreground hover:bg-brand/90 shadow-md shadow-brand/20 group/btn h-9"
          >
            <Play className="size-4 fill-current transition-transform group-hover/btn:scale-110" />
            Chơi ngay
          </Button>
        </div>
      </div>
    </article>
  )
}
