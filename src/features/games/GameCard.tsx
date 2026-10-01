// Thẻ trò chơi trong trang Game: ảnh bìa, tên, thể loại/kích thước bàn, Vào sảnh.
// Số liệu bàn chờ chỉ hiện khi có bàn thực tế đang mở. Quản trị trường xem thống kê riêng ở cuối trang.
import { DoorOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GameDefinition } from './game-catalog'

interface GameCardProps {
  game: GameDefinition
  waiting?: number
  /** Mở sảnh của trò chơi: mọi bàn đang mở + Chơi ngay · Tạo phòng · Vào phòng · Tìm phòng. */
  onMoSanh: () => void
}

export function GameCard({ game, waiting = 0, onMoSanh }: GameCardProps) {
  const laDoiKhang = game.category === '1v1'
  const nhanKichThuoc = game.boardLabel
    ? laDoiKhang
      ? `1v1 · ${game.boardLabel}`
      : `Chơi đơn · ${game.boardLabel}`
    : laDoiKhang
      ? '1v1'
      : 'Chơi đơn'

  return (
    <article
      data-testid={`game-card-${game.id}`}
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface transition-all duration-200 hover:border-brand/40 hover:shadow-lg"
    >
      {/* Artwork container — chiếm ~55-60% trọng lượng thị giác của thẻ */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-raised border-b border-border-subtle">
        <img
          src={game.cover}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Bàn chờ trực tiếp — chỉ hiện khi là trò đối kháng và có bàn chờ thực sự */}
        {laDoiKhang && waiting > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-black/75 px-2.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md shadow-sm">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {waiting} bàn chờ
          </span>
        )}
      </div>

      {/* Body container */}
      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-text-primary group-hover:text-brand transition-colors">
            {game.shortTitle}
          </h3>
          <span className="rounded-md border border-border-subtle bg-surface-raised px-2 py-0.5 text-xs font-medium text-text-secondary">
            {nhanKichThuoc}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {game.description}
        </p>

        <div className="mt-auto pt-4">
          <Button
            size="default"
            onClick={onMoSanh}
            aria-label={`Vào sảnh ${game.shortTitle}`}
            data-testid={`game-card-lobby-${game.id}`}
            variant="outline"
            className="w-full h-11 font-semibold group/btn border-border-default hover:bg-brand hover:text-brand-foreground hover:border-brand transition-colors"
          >
            <DoorOpen className="size-4 transition-transform group-hover/btn:scale-110" />
            Vào sảnh
          </Button>
        </div>
      </div>
    </article>
  )
}
