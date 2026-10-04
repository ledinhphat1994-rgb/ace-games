import { Clock, Eye } from 'lucide-react'
import type { BanSanh } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { GameArt } from './GameArt'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface GameTableCardProps {
  table: BanSanh
  onEnter: () => void
  /** Ẩn tên trò chơi khi thẻ đã nằm trong ngữ cảnh chỉ 1 trò chơi (hộp thoại bàn của một trò). */
  hideGameBadge?: boolean
}

export function GameTableCard({ table, onEnter, hideGameBadge = false }: GameTableCardProps) {
  const info = GAME_CATALOG_BY_ID[table.gameType]
  const dangCho = table.trangThai === 'waiting'
  const tenChu = table.tenChu ?? 'Ẩn danh'
  const tenKhach = table.tenKhach ?? 'Ẩn danh'

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-surface-overlay/60">
      <div className="size-10 shrink-0 overflow-hidden rounded-lg">
        <GameArt gameType={table.gameType} variant="icon" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words text-text-primary">
          {tenChu}
          {!dangCho && (
            <>
              <span className="px-1.5 text-xs font-normal text-text-tertiary">vs</span>
              {tenKhach}
            </>
          )}
        </p>
        <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-text-tertiary">
          <span className={dangCho ? 'font-medium text-brand' : 'font-medium text-warning'}>
            {dangCho ? 'Chờ đối thủ' : 'Đang đấu'}
          </span>
          {!hideGameBadge && <span>{info.shortTitle}</span>}
          <span className="inline-flex shrink-0 items-center gap-1">
            <Clock className="size-3" />
            {table.turnTimerSeconds === 0
              ? 'Vô hạn'
              : table.turnTimerSeconds >= 60 && table.turnTimerSeconds % 60 === 0
                ? `${table.turnTimerSeconds / 60}p`
                : `${table.turnTimerSeconds}s`}
          </span>
          {table.soNguoiXem > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1" title={`${table.soNguoiXem} người xem`}>
              <Eye className="size-3" />
              {table.soNguoiXem}
            </span>
          )}
        </p>
      </div>

      <Button
        size="xs"
        variant={dangCho ? 'default' : 'outline'}
        onClick={onEnter}
        className="shrink-0"
        aria-label={dangCho ? `Vào bàn của ${tenChu}` : `Xem trận của ${tenChu}`}
      >
        {dangCho ? 'Vào bàn' : 'Xem'}
      </Button>
    </div>
  )
}
