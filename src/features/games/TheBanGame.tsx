// Thẻ một bàn trong sảnh trò chơi (lưới như thẻ phòng học): ai đang ngồi, trạng thái, thời gian lượt, người xem.

import { Clock, Eye, Swords } from 'lucide-react'
import type { BanSanh } from '@shared/protocol/game'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GameArt } from './GameArt'

interface TheBanGameProps {
  ban: BanSanh
  onVao: () => void
}

export function TheBanGame({ ban, onVao }: TheBanGameProps) {
  const dangCho = ban.trangThai === 'waiting'
  const tenChu = ban.tenChu ?? 'Ẩn danh'

  return (
    <article
      className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-4 transition-colors hover:border-brand/40"
      data-testid={`ban-${ban.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="size-11 shrink-0 overflow-hidden rounded-xl">
          <GameArt gameType={ban.gameType} variant="icon" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] leading-6 font-semibold break-words text-text-primary">
            {tenChu}
            {!dangCho && (
              <>
                <Swords className="mx-1.5 inline size-3.5 text-text-tertiary" />
                {ban.tenKhach ?? 'Ẩn danh'}
              </>
            )}
          </h3>
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              dangCho ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300',
            )}
          >
            <span className={cn('size-1.5 rounded-full', dangCho ? 'animate-pulse bg-emerald-400' : 'bg-amber-400')} />
            {dangCho ? 'Chờ đối thủ' : 'Đang đấu'}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {ban.turnTimerSeconds}s / lượt
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" />
            {ban.soNguoiXem}
          </span>
        </p>
        <Button size="sm" variant={dangCho ? 'default' : 'outline'} onClick={onVao} className="shrink-0">
          {dangCho ? 'Vào bàn' : 'Xem'}
        </Button>
      </div>
    </article>
  )
}
