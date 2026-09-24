import { Button } from '@/components/ui/button'
import type { PhongSanh } from '@shared/protocol/campus'
import type { RoomFriendInfo } from './room-discovery'
import { Lock, Users, ArrowRight } from 'lucide-react'

interface RoomCardProps {
  room: PhongSanh
  friends?: RoomFriendInfo[]
  onVaoPhong?: (room: PhongSanh) => void
  layout?: 'grid' | 'compact'
}

export function RoomCard({ room, friends, onVaoPhong }: RoomCardProps) {
  const dayPhong = room.soNguoi >= room.sucChua

  return (
    <div
      data-testid={`room-card-${room.id}`}
      onClick={() => onVaoPhong?.(room)}
      className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-[#0c1222] p-4 shadow-sm transition-colors hover:border-cyan-500/30 hover:bg-[#0f172a] cursor-pointer"
    >
      <div className="space-y-2">
        {/* Top meta row: Room Title + Scope badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                {room.ten}
              </h3>
              {room.coMatKhau && (
                <span title="Phòng có mật khẩu" className="inline-flex items-center">
                  <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-400 truncate">
              Chủ phòng: <span className="text-slate-300">{room.chuPhongTen}</span>
            </p>
          </div>

          {/* Scope / Class chip (only if useful) */}
          <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            {room.phamVi === 'truong' ? 'Toàn trường' : (room.lopTen || 'Lớp')}
          </span>
        </div>

        {/* Optional short description */}
        {room.moTa && (
          <p className="text-xs text-slate-400 line-clamp-1">{room.moTa}</p>
        )}

        {/* Friends presence (only if authoritative friends inside) */}
        {friends && friends.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
            <span className="text-[11px] font-medium truncate">
              {friends.length === 1 ? '1 bạn bè đang tham gia' : `${friends.length} bạn bè đang tham gia`}
            </span>
          </div>
        )}
      </div>

      {/* Card Footer: Users count + CTA */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
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
          className="h-7 px-3 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 gap-1 transition-colors"
        >
          <span>{dayPhong ? 'Đã đầy' : 'Vào phòng'}</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
