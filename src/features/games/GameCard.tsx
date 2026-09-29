// Thẻ trò chơi trong trang Game: ảnh bìa, tên, mô tả, Vào sảnh. Số liệu (bàn, người chơi, người xem)
// chỉ Quản trị trường xem ở dải Thống kê của trang — thẻ không hiện số cho người tham gia.
import { DoorOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GameArt } from './GameArt'
import type { GameDefinition } from './game-catalog'

interface GameCardProps {
  game: GameDefinition
  waiting: number
  /** Mở sảnh của trò chơi: mọi bàn đang mở + Chơi ngay · Tạo phòng · Vào phòng · Tìm phòng. */
  onMoSanh: () => void
}

export function GameCard({ game, waiting, onMoSanh }: GameCardProps) {
  const laDoiKhang = game.category === '1v1'

  return (
    <article
      data-testid={`game-card-${game.id}`}
      onClick={onMoSanh}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#101728] to-[#0a0f1d] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-brand/60 hover:shadow-2xl hover:shadow-brand/15"
    >
      {/* Artwork container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-white/5 bg-black/40">
        <GameArt
          gameType={game.id}
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

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

        <div className="mt-auto pt-4">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMoSanh()
            }}
            aria-label={`Vào sảnh ${game.shortTitle}`}
            data-testid={`game-card-lobby-${game.id}`}
            className="w-full font-bold bg-brand text-brand-foreground hover:bg-brand/90 shadow-md shadow-brand/20 group/btn h-9"
          >
            <DoorOpen className="size-4 transition-transform group-hover/btn:scale-110" />
            Vào sảnh
          </Button>
        </div>
      </div>
    </article>
  )
}
