import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { PhongSanh } from '@shared/protocol/campus'
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
  onVaoPhong?: (room: PhongSanh) => void
}

export function RoomCard({ room, onVaoPhong }: RoomCardProps) {
  const tenMon = room.monHoc ? (TEN_MON_HOC[room.monHoc] ?? room.monHoc) : 'Học tập'
  const dayPhong = room.soNguoi >= room.sucChua

  return (
    <Card className="flex flex-col justify-between overflow-hidden border-border/70 transition-all hover:border-border hover:shadow-md">
      <CardHeader className="gap-2 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs font-semibold">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            {tenMon}
          </Badge>

          <div className="flex items-center gap-1.5">
            {room.coMatKhau ? (
              <Badge variant="secondary" className="gap-1 border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                <Lock className="h-3 w-3" />
                Mật khẩu
              </Badge>
            ) : null}

            <Badge
              variant="outline"
              className={
                room.phamVi === 'truong'
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                  : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
              }
            >
              {room.phamVi === 'truong' ? 'Toàn trường' : (room.lopTen || 'Lớp')}
            </Badge>
          </div>
        </div>

        <div>
          <CardTitle className="line-clamp-1 text-base font-bold text-foreground">
            {room.ten}
          </CardTitle>
          <CardDescription className="line-clamp-1 text-xs text-muted-foreground">
            Chủ phòng: <span className="font-medium text-foreground/80">{room.chuPhongTen}</span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3 pt-0">
        {room.dangPhat ? (
          <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
            <Play className="h-3 w-3 shrink-0 text-emerald-400" />
            <span className="truncate font-medium text-foreground/90">{room.dangPhat}</span>
          </div>
        ) : (
          <p className="line-clamp-2 min-h-8 text-xs text-muted-foreground/80">
            {room.moTa || 'Phòng học tập tự do, trao đổi bài và thảo luận nhóm.'}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span className={dayPhong ? 'font-semibold text-destructive' : 'font-medium'}>
            {room.soNguoi}/{room.sucChua}
          </span>
          {dayPhong ? <span className="text-[10px] text-destructive">(Đầy)</span> : null}
        </div>

        <Button
          size="sm"
          className="h-8 gap-1 text-xs font-semibold"
          disabled={dayPhong}
          onClick={() => onVaoPhong?.(room)}
        >
          {dayPhong ? 'Đã đầy' : 'Vào phòng'}
        </Button>
      </CardFooter>
    </Card>
  )
}
