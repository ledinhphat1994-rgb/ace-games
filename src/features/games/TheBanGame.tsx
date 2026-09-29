// Thẻ một bàn trong sảnh trò chơi (cùng kiểu thẻ phòng học): ai đang ngồi, trạng thái, thời gian lượt, người xem.

import { ArrowRight, Clock, Eye } from 'lucide-react'
import type { BanSanh } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GameArt } from './GameArt'

interface TheBanGameProps {
  ban: BanSanh
  onVao: () => void
}

const MAU = ['bg-sky-500', 'bg-rose-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-teal-500']

function ChuCai({ ten }: { ten: string | null }) {
  if (!ten) {
    return <span className="flex size-7 items-center justify-center rounded-full border border-dashed border-white/25 text-xs text-text-tertiary">?</span>
  }
  let h = 0
  for (let i = 0; i < ten.length; i++) h = (h * 31 + ten.charCodeAt(i)) % 997
  return (
    <span className={cn('flex size-7 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-[#0e1527]', MAU[h % MAU.length])}>
      {ten.trim().charAt(0).toUpperCase()}
    </span>
  )
}

export function TheBanGame({ ban, onVao }: TheBanGameProps) {
  const dangCho = ban.trangThai === 'waiting'
  const tenChu = ban.tenChu ?? 'Ẩn danh'

  return (
    <div
      onClick={onVao}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-white/[0.05]"
      data-testid={`ban-${ban.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
          <GameArt gameType={ban.gameType} variant="icon" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[0.9375rem] leading-6 font-semibold text-text-primary" title={tenChu}>
            {tenChu}
          </h3>
          <span className={cn('mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold', dangCho ? 'text-emerald-300' : 'text-amber-300')}>
            <span className={cn('size-1.5 rounded-full', dangCho ? 'animate-pulse bg-emerald-400' : 'bg-amber-400')} />
            {dangCho ? 'Chờ đối thủ' : 'Đang đấu'}
          </span>
        </div>
        <span className="flex shrink-0 -space-x-1.5" title={`${tenChu} · ${ban.tenKhach ?? 'Ghế trống'}`}>
          <ChuCai ten={ban.tenChu} />
          <ChuCai ten={ban.tenKhach} />
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="flex items-center gap-3 text-xs font-semibold tabular-nums text-text-secondary">
          <span className="inline-flex items-center gap-1" title="Thời gian mỗi lượt">
            <Clock className="size-3.5 text-text-tertiary" />
            {ban.turnTimerSeconds}s
          </span>
          <span className="inline-flex items-center gap-1" title="Người xem">
            <Eye className="size-3.5 text-text-tertiary" />
            {ban.soNguoiXem}
          </span>
        </p>
        <Button
          size="sm"
          variant={dangCho ? 'default' : 'outline'}
          onClick={(e) => {
            e.stopPropagation()
            onVao()
          }}
          className="shrink-0 rounded-xl"
        >
          {dangCho ? 'Vào bàn' : 'Xem'}
          {dangCho && <ArrowRight className="transition-transform duration-150 group-hover:translate-x-0.5" />}
        </Button>
      </div>
    </div>
  )
}
