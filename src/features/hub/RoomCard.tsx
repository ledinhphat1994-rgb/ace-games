// Thẻ phòng học trong sảnh: thiết kế chuẩn Image 4 (ThePhongGame)
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

const MON: Record<
  MonHoc,
  { label: string; icon: LucideIcon; iconColor: string; badge: string; borderHover: string }
> = {
  toan: {
    label: 'Toán',
    icon: Calculator,
    iconColor: 'text-sky-400',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    borderHover: 'hover:border-sky-500/40',
  },
  'ngu-van': {
    label: 'Ngữ Văn',
    icon: BookOpen,
    iconColor: 'text-rose-400',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    borderHover: 'hover:border-rose-500/40',
  },
  'tieng-anh': {
    label: 'Tiếng Anh',
    icon: Languages,
    iconColor: 'text-indigo-400',
    badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    borderHover: 'hover:border-indigo-500/40',
  },
  'vat-li': {
    label: 'Vật Lí',
    icon: Atom,
    iconColor: 'text-cyan-400',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    borderHover: 'hover:border-cyan-500/40',
  },
  'hoa-hoc': {
    label: 'Hóa Học',
    icon: FlaskConical,
    iconColor: 'text-fuchsia-400',
    badge: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
    borderHover: 'hover:border-fuchsia-500/40',
  },
  'sinh-hoc': {
    label: 'Sinh Học',
    icon: Leaf,
    iconColor: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    borderHover: 'hover:border-emerald-500/40',
  },
  'lich-su': {
    label: 'Lịch Sử',
    icon: Landmark,
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    borderHover: 'hover:border-amber-500/40',
  },
  'dia-li': {
    label: 'Địa Lí',
    icon: Globe2,
    iconColor: 'text-teal-400',
    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    borderHover: 'hover:border-teal-500/40',
  },
  'tin-hoc': {
    label: 'Tin Học',
    icon: Code2,
    iconColor: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    borderHover: 'hover:border-blue-500/40',
  },
  gdcd: {
    label: 'GDCD',
    icon: Scale,
    iconColor: 'text-orange-400',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    borderHover: 'hover:border-orange-500/40',
  },
  khac: {
    label: 'Tổng hợp',
    icon: GraduationCap,
    iconColor: 'text-brand',
    badge: 'bg-brand/15 text-brand border-brand/30',
    borderHover: 'hover:border-brand/40',
  },
}

export function RoomCard({ room, friends, onVaoPhong }: RoomCardProps) {
  const dayPhong = room.soNguoi >= room.sucChua
  const banBe = friends ?? []
  const hasFriends = banBe.length > 0
  const mon = MON[room.monHoc ?? 'khac'] ?? MON.khac
  const Icon = mon.icon

  return (
    <article
      data-testid={`room-card-${room.id}`}
      onClick={() => onVaoPhong?.(room)}
      className={cn(
        'group relative flex flex-col justify-between gap-3.5 rounded-2xl p-4 transition-colors duration-150 cursor-pointer',
        hasFriends
          ? 'skeuo-subcard-active-cyan'
          : 'skeuo-subcard-base hover:border-sky-400/50',
        dayPhong && 'opacity-85',
      )}
    >
      {/* ── Hàng trên cùng: Nhãn môn + Badge Lớp / Mật khẩu / Bạn bè + Số phòng ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Nhãn môn học nhận diện dễ dàng */}
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border',
              mon.badge,
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            <span>{mon.label}</span>
          </span>

          {/* Badge Lớp học */}
          {room.phamVi === 'lop' && room.lopTen && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-surface-overlay border border-border-default px-2 py-0.5 text-[11px] font-semibold text-text-secondary shadow-xs">
              <span>Lớp {room.lopTen}</span>
            </span>
          )}

          {/* Badge Mật khẩu */}
          {room.coMatKhau && (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold shadow-xs"
              aria-label="Phòng có mật khẩu"
            >
              <Lock className="size-3 text-amber-400" />
              <span>Mật khẩu</span>
            </span>
          )}

          {/* Badge Bạn bè */}
          {hasFriends && (
            <span
              className="inline-flex items-center gap-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/35 px-2 py-0.5 text-[11px] font-bold shadow-xs"
              title={`Bạn bè đang học: ${banBe.map((b) => b.displayName).join(', ')}`}
            >
              <Users className="size-3 text-sky-400" />
              <span>Có bạn bè</span>
            </span>
          )}
        </div>

        {/* Số phòng góc trên bên phải */}
        <span className="font-mono text-xs font-bold text-text-tertiary shrink-0">
          #{room.id}
        </span>
      </div>

      {/* ── Phần giữa: Logo môn to nổi bật + Tiêu đề phòng + Tên chủ phòng mờ ── */}
      <div className="flex items-center gap-3.5">
        {/* Logo môn to nổi bật như trong Image 4 */}
        <div className="size-16 sm:size-18 shrink-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised/80 flex items-center justify-center shadow-xs p-1 group-hover:scale-105 transition-transform duration-200">
          <Icon className={cn('size-8 sm:size-9', mon.iconColor)} />
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className="text-[0.9375rem] font-bold text-text-primary leading-tight truncate group-hover:text-sky-400 transition-colors"
            title={room.ten}
          >
            {room.ten}
          </h3>

          {/* Dòng tên chủ phòng chữ ẩn mờ theo yêu cầu */}
          <p className="mt-1 text-xs text-text-tertiary font-normal truncate" title={`Chủ phòng: ${room.chuPhongTen}`}>
            {room.chuPhongTen || 'Chủ phòng'}
          </p>

          {room.dangPhat && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-brand truncate" title={room.dangPhat}>
              <CirclePlay className="size-3 shrink-0" />
              <span className="truncate">{room.dangPhat}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Hàng dưới cùng: Trạng thái / Sĩ số / Bạn bè + Nút hành động ── */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-2.5 border-t border-border-subtle/70">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          {/* Trạng thái phòng */}
          {!dayPhong ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sẵn sàng</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-rose-400">
              <span className="size-2 rounded-full bg-rose-400" />
              <span>Đã đầy</span>
            </span>
          )}

          {/* Sĩ số */}
          <span
            className="inline-flex items-center gap-1 text-text-tertiary font-medium tabular-nums"
            title={`Sĩ số: ${room.soNguoi}/${room.sucChua}`}
          >
            <Users className="size-3.5" />
            <span>
              {room.soNguoi}/{room.sucChua}
            </span>
          </span>

          {/* Bạn bè trong phòng */}
          {hasFriends && (
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

        {/* Nút hành động */}
        <Button
          size="sm"
          disabled={dayPhong}
          onClick={(e) => {
            e.stopPropagation()
            onVaoPhong?.(room)
          }}
          className="h-8.5 px-3.5 rounded-xl font-bold text-xs shadow-xs transition-colors duration-150 gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white cursor-pointer active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          <span>{dayPhong ? 'Đã đầy' : 'Vào phòng'}</span>
          {!dayPhong && <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </div>
    </article>
  )
}
