import { Clock, Eye, Swords } from 'lucide-react'
import type { BanSanh } from '@shared/protocol/game'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GAME_CATALOG_BY_ID } from './game-catalog'

interface GameTableCardProps {
  table: BanSanh
  onEnter: () => void
}

export function GameTableCard({ table, onEnter }: GameTableCardProps) {
  const info = GAME_CATALOG_BY_ID[table.gameType]
  const dangCho = table.trangThai === 'waiting'
  const tenKhach = table.tenKhach ?? (dangCho ? 'Đang chờ đối thủ…' : 'Ẩn danh')

  return (
    <div className="group relative flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3.5 transition-all hover:border-cyan-500/40 hover:bg-slate-900/95 sm:gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 text-xl shadow-inner">
        {info.icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-bold text-white">{table.tenChu ?? 'Ẩn danh'}</span>
          <Swords className="size-3 shrink-0 text-slate-500" />
          <span className="truncate text-sm font-semibold text-slate-300">{tenKhach}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <Badge variant="outline" className="h-4.5 border-slate-700 bg-slate-800/60 px-1.5 text-[10px] text-slate-300">
            {info.shortTitle}
          </Badge>
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
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
            <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />
            Đang chờ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-300">
            <span className="size-1.5 animate-pulse rounded-full bg-orange-400" />
            Trực tiếp
          </span>
        )}
        <Button
          size="sm"
          onClick={onEnter}
          className={
            dangCho
              ? 'h-7 gap-1 bg-cyan-600 px-2.5 text-[11px] font-bold hover:bg-cyan-500'
              : 'h-7 gap-1 bg-slate-800 px-2.5 text-[11px] font-bold text-slate-200 hover:bg-slate-700'
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
