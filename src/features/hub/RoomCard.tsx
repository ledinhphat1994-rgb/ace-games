// Thẻ phòng học trong sảnh: ít chữ — biểu tượng môn, tên phòng, chủ phòng, bạn bè đang ở đó, sĩ số.

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

const MON: Record<MonHoc, { icon: LucideIcon; nen: string }> = {
  toan: { icon: Calculator, nen: 'from-sky-500 to-blue-600' },
  'ngu-van': { icon: BookOpen, nen: 'from-rose-500 to-pink-600' },
  'tieng-anh': { icon: Languages, nen: 'from-violet-500 to-indigo-600' },
  'vat-li': { icon: Atom, nen: 'from-brand to-teal-600' },
  'hoa-hoc': { icon: FlaskConical, nen: 'from-fuchsia-500 to-purple-600' },
  'sinh-hoc': { icon: Leaf, nen: 'from-emerald-500 to-green-600' },
  'lich-su': { icon: Landmark, nen: 'from-amber-500 to-orange-600' },
  'dia-li': { icon: Globe2, nen: 'from-lime-500 to-emerald-600' },
  'tin-hoc': { icon: Code2, nen: 'from-slate-500 to-slate-700' },
  gdcd: { icon: Scale, nen: 'from-yellow-500 to-amber-600' },
  khac: { icon: GraduationCap, nen: 'from-brand to-indigo-600' },
}

export function RoomCard({ room, friends, onVaoPhong }: RoomCardProps) {
  const dayPhong = room.soNguoi >= room.sucChua
  const tiLeLapDay = Math.min(100, Math.round((room.soNguoi / Math.max(1, room.sucChua)) * 100))
  const banBe = friends ?? []
  const mon = MON[room.monHoc ?? 'khac'] ?? MON.khac
  const Icon = mon.icon

  return (
    <div
      data-testid={`room-card-${room.id}`}
      onClick={() => onVaoPhong?.(room)}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl border border-border-subtle bg-canvas/60 p-4 transition-all duration-150  hover:border-brand/40 hover:bg-surface-overlay"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-text-primary shadow-lg ring-1 ring-white/15',
            mon.nen,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-start gap-1.5 text-[0.9375rem] leading-6 font-semibold text-text-primary">
            <span className="min-w-0 break-words" title={room.ten}>
              {room.ten}
            </span>
            {room.coMatKhau && <Lock className="mt-[5px] size-3.5 shrink-0 text-text-tertiary" aria-label="Phòng có mật khẩu" />}
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

      <div className="mt-auto flex items-center gap-3">
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
                    <img key={ban.id} src={ban.avatar} alt="" className="size-5 rounded-full object-cover ring-2 ring-surface" />
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
          className="shrink-0 rounded-xl"
        >
          <span>{dayPhong ? 'Đã đầy' : 'Vào phòng'}</span>
          {!dayPhong && <ArrowRight className="transition-transform duration-150 group-hover:translate-x-0.5" />}
        </Button>
      </div>
    </div>
  )
}
