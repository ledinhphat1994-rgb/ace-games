import { Clock, Eye, Swords } from 'lucide-react'
import type { BanSanh } from '@shared/protocol/game'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface GameTableCardProps {
  table: BanSanh
  onEnter: () => void
  /** Ẩn badge tên trò chơi khi thẻ đã nằm trong ngữ cảnh chỉ 1 trò chơi (cột sảnh theo game đang chọn). */
  hideGameBadge?: boolean
}

export function GameTableCard({ table, onEnter, hideGameBadge = false }: GameTableCardProps) {
  const info = GAME_CATALOG_BY_ID[table.gameType]
  const dangCho = table.trangThai === 'waiting'
  const tenKhach = table.tenKhach ?? (dangCho ? 'Đang chờ đối thủ…' : 'Ẩn danh')

  return (
    <div className="group relative flex items-center gap-3 rounded-2xl border border-border-default bg-surface/70 p-3.5 transition-all hover:border-brand/40 hover:bg-surface-raised sm:gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface-raised text-xl shadow-inner">
        {info.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-bold text-foreground">{table.tenChu ?? 'Ẩn danh'}</span>
          <Swords className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-semibold text-muted-foreground">{tenKhach}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {!hideGameBadge && (
            <Badge variant="outline" className="h-4.5 border-border-default bg-surface-raised px-1.5 text-[10px] text-muted-foreground">
              {info.shortTitle}
            </Badge>
          )}
          <span className="inline-flex items-center gap-0.5">
            <Clock className="size-3" />
            {table.turnTimerSeconds}s/lượt
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Eye className="size-3" />
            {table.soNguoiXem} người xem
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {dangCho ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
            Đang chờ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold text-warning">
            <span className="size-1.5 animate-pulse rounded-full bg-warning" />
            Trực tiếp
          </span>
        )}
        <Button
          size="sm"
          onClick={onEnter}
          className={
            dangCho
              ? 'h-7 gap-1 bg-brand text-slate-950 font-bold hover:bg-brand-hover px-2.5 text-[11px] cursor-pointer'
              : 'h-7 gap-1 bg-surface-raised border border-border-default text-foreground hover:bg-surface-overlay px-2.5 text-[11px] font-bold cursor-pointer'
          }
        >
          {dangCho ? (
            <>
              <Swords className="size-3" /> Tham gia
            </>
          ) : (
            <>
              <Eye className="size-3" /> Xem trực tiếp
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
