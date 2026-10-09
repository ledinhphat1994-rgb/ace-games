// Thẻ một bàn trong sảnh trò chơi: ai đang ngồi, trạng thái, thời gian lượt, người xem.

import { ArrowRight, Clock, Eye } from 'lucide-react'
import type { BanSanh } from '@shared/protocol/game'
import { cn } from '@/lib/utils'
import { GameArt } from './GameArt'
import { EloRankAvatarFrame } from './EloRankAvatarFrame'

interface TheBanGameProps {
  ban: BanSanh
  onVao: () => void
}

function ChuCai({ ten }: { ten: string | null }) {
  return (
    <EloRankAvatarFrame
      ten={ten || 'Chờ đối thủ'}
      hasPlayer={Boolean(ten)}
      sizeClassName="size-7"
      className="ring-2 ring-surface"
    />
  )
}

export function TheBanGame({ ban, onVao }: TheBanGameProps) {
  const dangCho = ban.trangThai === 'waiting'
  const tenChu = ban.tenChu ?? 'Ẩn danh'

  return (
    <article
      className="group flex flex-col justify-between gap-3.5 rounded-2xl skeuo-subcard-base p-4 transition-colors duration-150 hover:border-sky-400/50 select-none min-h-[168px]"
      data-testid={`ban-${ban.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="size-11 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-raised">
          <GameArt gameType={ban.gameType} variant="icon" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[0.9375rem] font-semibold text-text-primary" title={tenChu}>
            {tenChu}
          </h3>
          <span
            className={cn(
              'mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold',
              dangCho ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400',
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                dangCho ? 'animate-pulse bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400',
              )}
            />
            {dangCho ? 'Chờ đối thủ' : 'Đang đấu'}
          </span>
        </div>
        <span className="flex shrink-0 -space-x-1.5" title={[tenChu, ban.tenKhach].filter(Boolean).join(' · ')}>
          <ChuCai ten={ban.tenChu} />
          <ChuCai ten={ban.tenKhach} />
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <p className="flex items-center gap-3 text-xs font-semibold tabular-nums text-text-secondary">
          <span className="inline-flex items-center gap-1" title="Thời gian mỗi lượt">
            <Clock className="size-3.5 text-text-tertiary" />
            {ban.turnTimerSeconds === 0
              ? 'Vô hạn'
              : ban.turnTimerSeconds >= 60 && ban.turnTimerSeconds % 60 === 0
                ? `${ban.turnTimerSeconds / 60}p`
                : `${ban.turnTimerSeconds}s`}
          </span>
          <span className="inline-flex items-center gap-1" title="Người xem">
            <Eye className="size-3.5 text-text-tertiary" />
            {ban.soNguoiXem}
          </span>
        </p>
        <button
          type="button"
          onClick={onVao}
          className={cn(
            'shrink-0 h-8 px-3.5 rounded-xl font-semibold text-xs cursor-pointer transition-colors duration-150 flex items-center gap-1',
            dangCho ? 'skeuo-btn-cta-amber' : 'skeuo-btn-cancel',
          )}
        >
          <span>{dangCho ? 'Vào bàn' : 'Xem'}</span>
          {dangCho && <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />}
        </button>
      </div>
    </article>
  )
}
