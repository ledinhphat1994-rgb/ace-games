import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProgressSummary } from '@/components/progress/ProgressSummary'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  ArrowRight,
  BookOpen,
  Gamepad2,
  Plus,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const { rooms, socialState, presenceMap } = useCampus()

  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)

  const displayName = nguoiDung.ten || nguoiDung.username
  const lopText = nguoiDung.lop?.ten ? ` · ${nguoiDung.lop.ten}` : ''

  // Friends & presence projection
  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () => buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers),
    [rooms, friends, presenceMap, blockedUsers],
  )

  // Top active rooms (up to 4 rooms)
  const activeRoomsPreview = useMemo(() => {
    return [...rooms]
      .sort((a, b) => {
        const friendsA = roomFriendsMap.get(a.id)?.length ?? 0
        const friendsB = roomFriendsMap.get(b.id)?.length ?? 0
        if (friendsA !== friendsB) return friendsB - friendsA
        return b.soNguoi - a.soNguoi
      })
      .slice(0, 4)
  }, [rooms, roomFriendsMap])

  const xuLyVaoPhong = (room: PhongSanh) => {
    if (room.soNguoi >= room.sucChua) {
      toast.error('Phòng học đã đầy số lượng người tham gia!')
      return
    }
    if (room.coMatKhau) {
      setPhongCanMatKhau(room)
      return
    }
    navigate(`/room/phong-${room.id}`)
  }

  return (
    <div className="space-y-6">
      {/* 1. Greeting & Motivation Banner */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-[#0f172a]/90 via-[#0f172a]/60 to-primary/10 p-5 sm:p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Chào mừng trở lại{lopText}
              </span>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
              Xin chào, {displayName}!
            </h1>
            <p className="mt-1 text-xs text-muted-foreground max-w-lg">
              Hôm nay bạn muốn học tập môn gì hay giao lưu cùng các bạn trong trường?
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/learn')}
              className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4" />
              <span>Vào học ngay</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMoTaoPhong(true)}
              className="gap-1.5 text-xs font-semibold border-border/80 hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo phòng mới</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Consolidated Progress Summary */}
      <ProgressSummary />

      {/* 3. Quick Destinations */}
      <section aria-label="Lối tắt nhanh" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Destination: Học tập */}
        <Card
          onClick={() => navigate('/learn')}
          className="cursor-pointer border border-border/70 bg-card hover:border-primary/50 transition-all hover:scale-[1.01] hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-inner">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">Học Tập 📚</h3>
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {rooms.length} phòng
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                Phòng học lớp, toàn trường và thảo luận bài
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Destination: Đấu trường Game */}
        <Card
          onClick={() => navigate('/arena')}
          className="cursor-pointer border border-border/70 bg-card hover:border-emerald-500/50 transition-all hover:scale-[1.01] hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">Đấu Trường Game 🎮</h3>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
                  4 trò chơi
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                Caro, Cờ lật, 2048 & Rắn Deluxe
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Destination: Cộng đồng */}
        <Card
          onClick={() => navigate('/community')}
          className="cursor-pointer border border-border/70 bg-card hover:border-purple-500/50 transition-all hover:scale-[1.01] hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-inner">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">Cộng Đồng 👥</h3>
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {friends.length} bạn
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                Bạn bè, hoạt động và kết nối trường lớp
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Active Rooms Preview */}
      <section aria-label="Phòng học đang hoạt động" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <h2 className="text-sm font-bold text-foreground">Phòng học nổi bật</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learn')}
            className="h-8 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
          >
            <span>Xem tất cả ({rooms.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {activeRoomsPreview.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-6 text-center bg-card/20">
            <p className="text-xs text-muted-foreground">
              Hiện chưa có phòng học nào đang mở. Bạn có thể tạo phòng mới để bắt đầu học!
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMoTaoPhong(true)}
              className="mt-3 h-8 gap-1 text-xs border-border/70"
            >
              <Plus className="h-3.5 w-3.5" />
              Tạo phòng học
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {activeRoomsPreview.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                friends={roomFriendsMap.get(room.id)}
                onVaoPhong={xuLyVaoPhong}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create Room Modal */}
      <CreateStudyRoomDialog
        open={moTaoPhong}
        onOpenChange={setMoTaoPhong}
      />

      {/* Password Modal */}
      <PasswordRoomDialog
        room={phongCanMatKhau}
        onClose={() => setPhongCanMatKhau(null)}
        onSuccess={(room) => {
          setPhongCanMatKhau(null)
          navigate(`/room/phong-${room.id}`)
        }}
      />
    </div>
  )
}
