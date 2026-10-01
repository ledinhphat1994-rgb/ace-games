// Thẻ phòng học trong sảnh: cấu trúc ngữ nghĩa <article> với nút hành động "Vào phòng" rõ ràng.
// src/features/hub/RoomCard.tsx

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PhongSanh } from '@shared/protocol/campus'
import type { MonHoc } from '@shared/rooms/constants'
import type { RoomFriendInfo } from './room-discovery'
import {
  ArrowRight,
  Atom,
  BookOpen,
  Calculator,
  CirclePlay,
  Code2,
  FlaskConical,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Leaf,
  Lock,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react'

interface RoomCardProps {
  room: PhongSanh
  friends?: RoomFriendInfo[]
  onVaoPhong?: (room: PhongSanh) => void
}

const MON: Record<MonHoc, { icon: LucideIcon; style: string }> = {
  toan: { icon: Calculator, style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  'ngu-van': { icon: BookOpen, style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  'tieng-anh': { icon: Languages, style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  'vat-li': { icon: Atom, style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'hoa-hoc': { icon: FlaskConical, style: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
  'sinh-hoc': { icon: Leaf, style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'lich-su': { icon: Landmark, style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'dia-li': { icon: Globe2, style: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  'tin-hoc': { icon: Code2, style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  gdcd: { icon: Scale, style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  khac: { icon: GraduationCap, style: 'bg-brand/10 text-brand border-brand/20' },
}

export function RoomCard({ room, friends, onVaoPhong }: RoomCardProps) {
  const dayPhong = room.soNguoi >= room.sucChua
  const tiLeLapDay = Math.min(100, Math.round((room.soNguoi / Math.max(1, room.sucChua)) * 100))
  const banBe = friends ?? []
  const mon = MON[room.monHoc ?? 'khac'] ?? MON.khac
  const Icon = mon.icon

  return (
    <article
      data-testid={`room-card-${room.id}`}
      className="group flex flex-col justify-between gap-3.5 rounded-2xl border border-border-default/80 bg-surface p-4.5 transition-all duration-200 hover:border-brand/40 hover:bg-surface-raised/60 shadow-xs"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-xs',
            mon.style,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-start gap-1.5 text-[0.9375rem] leading-6 font-semibold text-text-primary">
            <span className="min-w-0 break-words" title={room.ten}>
              {room.ten}
            </span>
            {room.coMatKhau && (
              <Lock
                className="mt-[5px] size-3.5 shrink-0 text-text-tertiary"
                aria-label="Phòng có mật khẩu"
              />
            )}
          </h3>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-text-tertiary">
            <span className="min-w-0 break-words">{room.chuPhongTen}</span>
            {room.phamVi === 'lop' && room.lopTen && (
              <span className="shrink-0 rounded-md bg-surface-overlay px-1.5 py-px text-[10px] font-semibold text-text-secondary">
                {room.lopTen}
              </span>
            )}
          </p>
        </div>
      </div>

      {room.dangPhat && (
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-text-secondary" title={room.dangPhat}>
          <CirclePlay className="size-3.5 shrink-0 text-brand" />
          <span className="truncate">{room.dangPhat}</span>
        </p>
      )}

      <div className="mt-auto flex items-center gap-3 pt-2 border-t border-border-subtle/60">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold tabular-nums text-text-secondary">
              <Users className="size-3.5 text-text-tertiary" />
              {room.soNguoi}/{room.sucChua}
            </span>
            {/* Bạn bè đang ở trong phòng — chỉ có khi presence đã xác thực (buildRoomFriendsMap fail-closed) */}
            {banBe.length > 0 && (
              <span
                data-testid={`room-friends-indicator-${room.id}`}
                className="flex shrink-0 -space-x-1.5"
                title={banBe.map((b) => b.displayName).join(', ')}
              >
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
                      className="flex size-5 items-center justify-center rounded-full bg-social/25 text-[9px] font-bold text-social uppercase ring-2 ring-surface"
                    >
                      {ban.displayName.slice(0, 1)}
                    </span>
                  ),
                )}
                {banBe.length > 3 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-surface-overlay text-[9px] font-bold text-text-secondary ring-2 ring-surface">
                    +{banBe.length - 3}
                  </span>
                )}
              </span>
            )}
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-overlay">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-300',
                dayPhong ? 'bg-danger' : 'bg-brand',
              )}
              style={{ width: `${tiLeLapDay}%` }}
            />
          </div>
        </div>

        <Button
          size="sm"
          disabled={dayPhong}
          onClick={() => onVaoPhong?.(room)}
          className="shrink-0 rounded-xl font-semibold shadow-xs"
        >
          <span>{dayPhong ? 'Đã đầy' : 'Vào phòng'}</span>
          {!dayPhong && <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </div>
    </article>
  )
}
