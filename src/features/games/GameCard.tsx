// Thẻ trò chơi trong trang Game: thiết kế đồng bộ với RoomCard của Sảnh học tập.
// Số liệu bàn chờ chỉ hiện khi có bàn thực tế đang mở. Quản trị trường xem thống kê riêng ở cuối trang.
import { ArrowRight, DoorOpen, Users } from 'lucide-react'
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
      className="group relative flex flex-col justify-between gap-3.5 rounded-2xl border border-border-default/80 bg-surface p-4.5 transition-all duration-200 hover:border-purple-500/40 hover:bg-surface-raised/60 shadow-xs"
    >
      {/* Góc phải trên cùng: Thể loại / Nhãn kích thước bàn */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
        <span className="font-mono text-xs font-semibold text-text-tertiary">
          {nhanKichThuoc}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-purple-500/25 bg-purple-500/10 shadow-xs">
          <img
            src={game.cover}
            alt=""
            loading="lazy"
            className="size-full object-cover crisp-image transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <div className="min-w-0 flex-1 pr-14">
          <h3 className="flex items-start gap-1.5 text-[0.9375rem] leading-6 font-semibold text-text-primary group-hover:text-purple-400 transition-colors">
            <span className="min-w-0 truncate" title={game.shortTitle}>
              {game.shortTitle}
            </span>
          </h3>
          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-text-secondary" title={game.description}>
            {game.description}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 pt-2 border-t border-border-subtle/60">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-text-secondary">
              <Users className="size-3.5 text-text-tertiary" />
              <span>{laDoiKhang ? (waiting > 0 ? `${waiting} bàn chờ` : 'Sẵn sàng ghép') : 'Chơi đơn'}</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-overlay">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
              style={{ width: laDoiKhang ? (waiting > 0 ? '75%' : '35%') : '50%' }}
            />
          </div>
        </div>

        <Button
          size="sm"
          onClick={onMoSanh}
          aria-label={`Vào sảnh ${game.shortTitle}`}
          data-testid={`game-card-lobby-${game.id}`}
          className="h-8 shrink-0 cursor-pointer rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xs transition-all gap-1.5 px-3"
        >
          <DoorOpen className="size-3.5" />
          <span>Vào sảnh</span>
          <ArrowRight className="size-3 opacity-70" />
        </Button>
      </div>
    </article>
  )
}
