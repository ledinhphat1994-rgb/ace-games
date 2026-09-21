import { Button } from '@/components/ui/button'
import type { PhongSanh } from '@shared/protocol/campus'
import type { RoomFriendInfo } from './room-discovery'
import { Lock, Radio, Users, ArrowRight } from 'lucide-react'

const TEN_MON_HOC: Record<string, string> = {
  toan: 'Toán',
  'ngu-van': 'Ngữ văn',
  'tieng-anh': 'Tiếng Anh',
  'vat-li': 'Vật lí',
  'hoa-hoc': 'Hoá học',
  'sinh-hoc': 'Sinh học',
  'lich-su': 'Lịch sử',
  'dia-li': 'Địa lí',
  'tin-hoc': 'Tin học',
  khac: 'Tự học',
}

function getRoomThumbnail(room: PhongSanh): string {
  const name = (room.ten + ' ' + (room.monHoc || '')).toLowerCase()
  if (name.includes('toán') || room.monHoc === 'toan') return '/assets/learning/room_math.webp'
  if (name.includes('vật') || name.includes('lý') || room.monHoc === 'vat-li') return '/assets/learning/room_physics.webp'
  if (name.includes('game') || name.includes('caro') || room.monHoc === 'tin-hoc') return '/assets/learning/room_tech.webp'
  if (name.includes('youtube') || room.dangPhat) return '/assets/learning/room_youtube.webp'
  if (name.includes('bảo mật') || room.coMatKhau) return '/assets/learning/room_security.webp'
  return '/assets/learning/room_study.webp'
}

interface RoomCardProps {
  room: PhongSanh
  friends?: RoomFriendInfo[]
  onVaoPhong?: (room: PhongSanh) => void
  layout?: 'grid' | 'compact'
}

export function RoomCard({ room, friends, onVaoPhong }: RoomCardProps) {
  const tenMon = room.monHoc ? (TEN_MON_HOC[room.monHoc] ?? room.monHoc) : 'Học tập'
  const dayPhong = room.soNguoi >= room.sucChua
  const thumbnail = getRoomThumbnail(room)

  return (
    <div
      data-testid={`room-card-${room.id}`}
      onClick={() => onVaoPhong?.(room)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222] shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-cyan-500/10 hover:shadow-xl cursor-pointer"
    >
      {/* Visual Thumbnail Header */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-900">
        <img
          src={thumbnail}
          alt={room.ten}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-[#0c1222]/40 to-transparent" />

        {/* State and Category Chips over thumbnail */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 z-10">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-slate-950 backdrop-blur-md shadow-sm">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Trực tiếp
            </span>
            <span className="inline-flex items-center rounded-md bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-200 backdrop-blur-md">
              {tenMon}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {room.coMatKhau && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-950 backdrop-blur-md">
                <Lock className="h-2.5 w-2.5" />
                Khoá
              </span>
            )}
            <span className="inline-flex items-center rounded-md bg-slate-900/80 border border-white/15 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 backdrop-blur-md">
              {room.phamVi === 'truong' ? 'Toàn trường' : (room.lopTen || 'Lớp')}
            </span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 pt-2 flex flex-col justify-between flex-1 gap-3">
        <div>
          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug">
            {room.ten}
          </h3>
          <p className="mt-1 text-xs text-slate-400 line-clamp-1">
            Chủ phòng: <span className="font-semibold text-slate-200">{room.chuPhongTen}</span>
          </p>
        </div>

        {/* Friend presence badge if friends inside */}
        {friends && friends.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 text-xs text-indigo-300">
            <div className="flex -space-x-1 overflow-hidden shrink-0">
              {friends.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white border border-slate-900"
                >
                  {f.displayName.slice(0, 1)}
                </div>
              ))}
            </div>
            <span className="text-[11px] font-medium truncate">
              {friends.length === 1 ? '1 bạn bè đang học' : `${friends.length} bạn bè đang học`}
            </span>
          </div>
        )}

        {/* Card Footer: Users count + CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className={dayPhong ? 'font-bold text-rose-400' : 'font-semibold text-slate-200'}>
              {room.soNguoi}/{room.sucChua}
            </span>
            {dayPhong && <span className="text-[10px] text-rose-400 font-bold">(Đầy)</span>}
          </div>

          <Button
            size="sm"
            disabled={dayPhong}
            onClick={(e) => {
              e.stopPropagation()
              onVaoPhong?.(room)
            }}
            className="h-8 px-3 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 gap-1 transition-all"
          >
            <span>{dayPhong ? 'Đã đầy' : 'Vào phòng'}</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
