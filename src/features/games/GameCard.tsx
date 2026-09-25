import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GameArt } from './GameArt'
import type { GameDefinition } from './game-catalog'

interface GameCardProps {
  game: GameDefinition
  /** Số bàn đang chờ đối thủ (dữ liệu trực tiếp từ GameLobbyDO) — chỉ có nghĩa với trò đối kháng. */
  waiting: number
  onPlay: () => void
  onOpenTables?: () => void
}

// Thẻ trò chơi: dạng hàng ngang gọn trên điện thoại, dạng thẻ có ảnh bìa từ màn hình sm trở lên.
export function GameCard({ game, waiting, onPlay, onOpenTables }: GameCardProps) {
  const laDoiKhang = game.category === '1v1'

  return (
    <article
      data-testid={`game-card-${game.id}`}
      className="group flex gap-4 rounded-2xl border border-border-subtle bg-surface p-3 transition-colors duration-150 hover:border-border-strong sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0"
    >
      <div className="relative aspect-square w-24 shrink-0 self-start overflow-hidden rounded-xl sm:aspect-video sm:w-full sm:rounded-none sm:border-b sm:border-border-subtle">
        <GameArt gameType={game.id} className="transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        {laDoiKhang && waiting > 0 && (
          <span className="absolute top-3 left-3 hidden items-center gap-1.5 rounded-full border border-white/10 bg-canvas/75 px-2.5 py-1 text-xs font-medium text-text-primary backdrop-blur-md sm:inline-flex">
            <span className="size-1.5 rounded-full bg-success" />
            {waiting} bàn đang chờ
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 text-[0.9375rem] leading-6 font-semibold break-words text-text-primary">
            {game.shortTitle}
          </h3>
          <span className="shrink-0 text-xs text-text-tertiary">
            {laDoiKhang ? `1v1 · ${game.boardLabel}` : 'Chơi đơn'}
          </span>
        </div>
        <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-text-secondary">{game.description}</p>
        {laDoiKhang && waiting > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-success sm:hidden">
            <span className="size-1.5 rounded-full bg-success" />
            {waiting} bàn đang chờ
          </p>
        )}

        <div className="day-loc-deu mt-auto pt-3 [--the-nho-nhat:5.5rem] sm:pt-4">
          <Button size="sm" onClick={onPlay} aria-label={`Chơi ngay ${game.shortTitle}`}>
            <Play className="fill-current" />
            Chơi ngay
          </Button>
          {laDoiKhang && onOpenTables && (
            <Button size="sm" variant="outline" onClick={onOpenTables} aria-label={`Xem bàn ${game.shortTitle}`}>
              Bàn · <span className="tabular-nums">{waiting}</span>
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
