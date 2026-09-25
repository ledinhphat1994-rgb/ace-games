import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PhongSanh } from '@shared/protocol/campus'
import type { RoomFriendInfo } from './room-discovery'
import { ArrowRight, CirclePlay, Lock, Users } from 'lucide-react'

interface RoomCardProps {
  room: PhongSanh
  friends?: RoomFriendInfo[]
  onVaoPhong?: (room: PhongSanh) => void
  layout?: 'grid' | 'compact'
}

export function RoomCard({ room, friends, onVaoPhong }: RoomCardProps) {
  const dayPhong = room.soNguoi >= room.sucChua
  const tiLeLapDay = Math.min(100, Math.round((room.soNguoi / Math.max(1, room.sucChua)) * 100))
  const phamVi = room.phamVi === 'truong' ? 'Toàn trường' : room.lopTen || 'Lớp'
  const banBe = friends ?? []

  return (
    <div
      data-testid={`room-card-${room.id}`}
      onClick={() => onVaoPhong?.(room)}
      className="group flex cursor-pointer flex-col rounded-2xl border border-border-subtle bg-surface p-5 transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised/60"
    >
      <div className="min-w-0">
        <h3 className="flex items-start gap-1.5 text-[0.9375rem] leading-6 font-semibold text-text-primary">
          <span className="min-w-0 break-words">{room.ten}</span>
          {room.coMatKhau && (
            <span title="Phòng có mật khẩu" className="mt-[5px] inline-flex shrink-0">
              <Lock className="size-3.5 text-text-tertiary" aria-label="Phòng có mật khẩu" />
            </span>
          )}
        </h3>
        <p className="mt-0.5 text-[0.8125rem] break-words text-text-secondary">
          {room.chuPhongTen}
          <span className="px-1.5 text-text-tertiary">·</span>
          <span className="text-text-tertiary">{phamVi}</span>
        </p>
      </div>

      {room.moTa && (
        <p className="mt-3 text-[0.8125rem] leading-relaxed break-words text-text-tertiary">{room.moTa}</p>
      )}

      {room.dangPhat && (
        <p className="mt-3 flex min-w-0 items-start gap-1.5 text-xs leading-5 text-text-secondary">
          <CirclePlay className="mt-[3px] size-3.5 shrink-0 text-brand" />
          <span className="min-w-0 break-words">{room.dangPhat}</span>
        </p>
      )}

      {/* Bạn bè đang ở trong phòng — chỉ có khi presence đã xác thực (buildRoomFriendsMap fail-closed) */}
      {banBe.length > 0 && (
        <div data-testid={`room-friends-indicator-${room.id}`} className="mt-3 flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 -space-x-1.5">
            {banBe.slice(0, 3).map((ban) =>
              ban.avatar ? (
                <img
                  key={ban.id}
                  src={ban.avatar}
                  alt=""
                  className="size-5 rounded-full object-cover ring-2 ring-surface"
                />
              ) : (
                <span
                  key={ban.id}
                  className="flex size-5 items-center justify-center rounded-full bg-social/20 text-[9px] font-semibold text-social uppercase ring-2 ring-surface"
                >
                  {ban.displayName.slice(0, 1)}
                </span>
              ),
            )}
          </div>
          <span className="min-w-0 text-xs break-words text-social">
            {banBe.length === 1
              ? `${banBe[0].displayName} đang ở đây`
              : `${banBe[0].displayName} và ${banBe.length - 1} bạn khác đang ở đây`}
          </span>
        </div>
      )}

      <div className="mt-auto flex items-end gap-4 pt-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-text-secondary">
              <Users className="size-3.5 text-text-tertiary" />
              <span className="font-medium tabular-nums">
                {room.soNguoi}/{room.sucChua}
              </span>
            </span>
            {dayPhong && <span className="font-medium text-danger">Đã đầy</span>}
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-overlay">
            <div
              className={cn('h-full rounded-full transition-[width] duration-300', dayPhong ? 'bg-danger' : 'bg-brand')}
              style={{ width: `${tiLeLapDay}%` }}
            />
          </div>
        </div>

        <Button
          size="sm"
          disabled={dayPhong}
          onClick={(e) => {
            e.stopPropagation()
            onVaoPhong?.(room)
          }}
          className="shrink-0"
        >
          <span>{dayPhong ? 'Đã đầy' : 'Vào phòng'}</span>
          {!dayPhong && <ArrowRight className="transition-transform duration-150 group-hover:translate-x-0.5" />}
        </Button>
      </div>
    </div>
  )
}
