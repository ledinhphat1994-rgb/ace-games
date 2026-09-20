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
      className="group flex flex-col justify-between hover:border-brand/40 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
    >
      <CardHeader className="gap-2 p-4 pb-2">
        {/* Scope + lock badges */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Badge variant="default" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {tenMon}
          </Badge>

          <div className="flex items-center gap-1.5">
            {room.coMatKhau && (
              <Badge variant="warning" className="gap-1">
                <Lock className="h-2.5 w-2.5" />
                Mật khẩu
              </Badge>
            )}

            <Badge variant={room.phamVi === 'truong' ? 'social' : 'secondary'}>
              {room.phamVi === 'truong' ? 'Toàn trường' : (room.lopTen || 'Lớp')}
            </Badge>
          </div>
        </div>

        {/* Title + host */}
        <div className="mt-1">
          <CardTitle className="line-clamp-1 group-hover:text-brand transition-colors">
            {room.ten}
          </CardTitle>
          <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">
            Chủ phòng: <span className="font-semibold text-text-primary">{room.chuPhongTen}</span>
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-2 space-y-2">
        {/* Currently playing */}
        {room.dangPhat ? (
          <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-2.5 py-1.5 text-xs text-success">
            <Play className="h-3 w-3 shrink-0 fill-success/40" />
            <span className="truncate font-medium">{room.dangPhat}</span>
          </div>
        ) : (
          <p className="line-clamp-2 text-xs text-text-secondary leading-relaxed">
            {room.moTa || 'Phòng học tự do, trao đổi bài và thảo luận nhóm.'}
          </p>
        )}

        {/* Friend presence */}
        {friends && friends.length > 0 && (
          <div
            data-testid={`room-friends-indicator-${room.id}`}
            className="flex items-center gap-2 rounded-lg border border-social/20 bg-social/8 px-2 py-1 text-xs text-social"
            aria-label={`${friends.length} bạn bè đang ở đây: ${friends.map((f) => f.displayName).join(', ')}`}
            title={friends.map((f) => f.displayName).join(', ')}
          >
            <div className="flex -space-x-1.5 overflow-hidden shrink-0">
              {friends.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-social text-[9px] font-bold text-white uppercase"
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

      <CardFooter className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Users className="h-3.5 w-3.5 opacity-70" />
          <span className={dayPhong ? 'font-bold text-destructive' : 'font-semibold text-text-primary'}>
            {room.soNguoi}/{room.sucChua}
          </span>
          {dayPhong && <span className="text-[10px] text-destructive">(Đầy)</span>}
        </div>

        <Button
          size="sm"
          disabled={dayPhong}
          onClick={() => onVaoPhong?.(room)}
          className="h-8 gap-1"
        >
          {dayPhong ? 'Đã đầy' : 'Vào phòng'}
        </Button>
      </CardFooter>
    </Card>
  )
}
