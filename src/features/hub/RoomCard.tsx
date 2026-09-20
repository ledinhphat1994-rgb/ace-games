import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { PhongSanh } from '@shared/protocol/campus'
import type { RoomFriendInfo } from './room-discovery'
import { BookOpen, Lock, Play, Users } from 'lucide-react'

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
  khac: 'Tự học / khác',
}

interface RoomCardProps {
  room: PhongSanh
  friends?: RoomFriendInfo[]
  onVaoPhong?: (room: PhongSanh) => void
}

export function RoomCard({ room, friends, onVaoPhong }: RoomCardProps) {
  const tenMon = room.monHoc ? (TEN_MON_HOC[room.monHoc] ?? room.monHoc) : 'Học tập'
  const dayPhong = room.soNguoi >= room.sucChua

  return (
    <Card
      data-testid={`room-card-${room.id}`}
      className="group flex flex-col justify-between overflow-hidden border-border/70 bg-card hover:border-primary/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardHeader className="gap-2 p-4 pb-2">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs font-semibold border-primary/30 bg-primary/10 text-primary">
            <BookOpen className="h-3 w-3 text-primary" />
            <span>{tenMon}</span>
          </Badge>

          <div className="flex items-center gap-1.5">
            {room.coMatKhau && (
              <Badge variant="secondary" className="gap-1 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                <Lock className="h-2.5 w-2.5" />
                <span>Mật khẩu</span>
              </Badge>
            )}

            <Badge
              variant="outline"
              className={`px-1.5 py-0.5 text-[10px] font-medium ${
                room.phamVi === 'truong'
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                  : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
              }`}
            >
              {room.phamVi === 'truong' ? 'Toàn trường' : (room.lopTen || 'Lớp')}
            </Badge>
          </div>
        </div>

        {/* Room Title & Host */}
        <div className="mt-1">
          <CardTitle className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
            {room.ten}
          </CardTitle>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            Chủ phòng: <span className="font-semibold text-foreground/85">{room.chuPhongTen}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 space-y-2.5">
        {/* Currently playing or description */}
        {room.dangPhat ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-400">
            <Play className="h-3 w-3 shrink-0 text-emerald-400 fill-emerald-400/40" />
            <span className="truncate font-medium">{room.dangPhat}</span>
          </div>
        ) : (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {room.moTa || 'Phòng học tập tự do, trao đổi bài và thảo luận nhóm.'}
          </p>
        )}

        {/* Friend presence stack if any */}
        {friends && friends.length > 0 && (
          <div
            data-testid={`room-friends-indicator-${room.id}`}
            className="flex items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-xs text-indigo-300"
            aria-label={`${friends.length} bạn bè đang ở đây: ${friends.map((f) => f.displayName).join(', ')}`}
            title={friends.map((f) => f.displayName).join(', ')}
          >
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {friends.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-card bg-indigo-600 text-[9px] font-bold text-white uppercase shadow-xs"
                  title={f.displayName}
                >
                  {f.displayName.slice(0, 1)}
                </div>
              ))}
            </div>
            <span className="truncate font-medium text-[11px]">
              {friends.length === 1 ? '1 bạn đang ở đây' : `${friends.length} bạn đang ở đây`}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5 opacity-80" />
          <span className={dayPhong ? 'font-bold text-destructive' : 'font-semibold text-foreground/80'}>
            {room.soNguoi}/{room.sucChua}
          </span>
          {dayPhong && <span className="text-[10px] text-destructive font-semibold">(Đầy)</span>}
        </div>

        <Button
          size="sm"
          className="h-8 px-3 text-xs font-semibold gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={dayPhong}
          onClick={() => onVaoPhong?.(room)}
        >
          {dayPhong ? 'Đã đầy' : 'Vào phòng'}
        </Button>
      </CardFooter>
    </Card>
  )
}
