import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressSummary } from '@/components/progress/ProgressSummary'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  ArrowRight,
  BookOpen,
  DoorOpen,
  Gamepad2,
  Plus,
  Radio,
  Sparkles,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

function getLoiChaoTheoGio(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Chào buổi sáng'
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const { rooms, socialState, presenceMap } = useCampus()

  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)

  const displayName = nguoiDung.ten || nguoiDung.username
  const lopText = nguoiDung.lop?.ten ? `Lớp ${nguoiDung.lop.ten}` : 'Học sinh toàn trường'
  const loiChao = useMemo(() => getLoiChaoTheoGio(), [])

  // Friends & presence projection
  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () => buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers),
    [rooms, friends, presenceMap, blockedUsers],
  )

  // Smart continuation: Find if any friend is actively in a study room
  const activeFriendStudy = useMemo(() => {
    for (const friend of friends) {
      const presence = presenceMap[friend.id]
      if (presence?.activity?.type === 'room' && presence.activity.roomId) {
        const targetRoom = rooms.find((r) => r.id === presence.activity?.roomId)
        return {
          friend,
          roomId: presence.activity.roomId,
          roomName: targetRoom?.ten || `Phòng #${presence.activity.roomId}`,
        }
      }
    }
    return null
  }, [friends, presenceMap, rooms])

  // Top active rooms (up to 4 rooms, prioritized by friend presence and occupancy)
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
      {/* 1. Context Hero: Personal, Motivating & Clear Action Dominance */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-primary/10 p-5 sm:p-6 shadow-sm">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                {loiChao}
              </span>
              <span className="text-muted-foreground/60 text-xs">·</span>
              <span className="text-xs font-semibold text-muted-foreground">{lopText}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Xin chào, {displayName}!
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Chào mừng bạn đến không gian học tập số. Hãy bắt đầu ôn luyện bài học hoặc kết nối cùng các bạn nhé!
            </p>
          </div>

          {/* Primary & Secondary Action CTAs */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <Button
              size="default"
              onClick={() => navigate('/learn')}
              className="h-10 px-5 gap-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              <BookOpen className="h-4 w-4" />
              <span>Vào học ngay</span>
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={() => setMoTaoPhong(true)}
              className="h-10 px-3.5 gap-1.5 text-xs font-semibold border-border/80 bg-card/60 hover:bg-white/5 transition-colors"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span>Tạo phòng mới</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Smart Continuation Card (Only when a friend is currently studying in a room) */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent p-3.5 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                Bạn bè đang học tập: <span className="text-indigo-400">{activeFriendStudy.friend.displayName}</span>
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Đang ở trong {activeFriendStudy.roomName}. Cùng vào học nhé!
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/room/phong-${activeFriendStudy.roomId}`)}
            className="h-8 px-3 text-xs font-semibold gap-1 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-sm"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Vào học cùng</span>
          </Button>
        </div>
      )}

      {/* 3. Consolidated Gamified Progress Rail */}
      <ProgressSummary />

      {/* 4. Visually Differentiated Destination Cards */}
      <section aria-label="Lối tắt nhanh" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Destination: Học tập (Cyan brand theme) */}
        <Card
          onClick={() => navigate('/learn')}
          className="group cursor-pointer border border-cyan-500/25 bg-gradient-to-br from-card to-cyan-500/5 hover:border-cyan-500/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-inner group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-foreground group-hover:text-cyan-400 transition-colors">
                  Học Tập 📚
                </h3>
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-[10px] font-bold text-cyan-300">
                  {rooms.length} phòng
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                Phòng học lớp, toàn trường và thảo luận bài
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Destination: Đấu trường Game (Emerald theme) */}
        <Card
          onClick={() => navigate('/arena')}
          className="group cursor-pointer border border-emerald-500/25 bg-gradient-to-br from-card to-emerald-500/5 hover:border-emerald-500/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-foreground group-hover:text-emerald-400 transition-colors">
                  Đấu Trường Game 🎮
                </h3>
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
                  4 trò chơi
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                Caro, Cờ lật, 2048 & Rắn Deluxe
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Destination: Cộng đồng (Purple theme) */}
        <Card
          onClick={() => navigate('/community')}
          className="group cursor-pointer border border-purple-500/25 bg-gradient-to-br from-card to-purple-500/5 hover:border-purple-500/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-inner group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-foreground group-hover:text-purple-400 transition-colors">
                  Cộng Đồng 👥
                </h3>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-[10px] font-bold text-purple-300">
                  {friends.length} bạn bè
                </Badge>
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                Bạn bè, hoạt động và kết nối trường lớp
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Featured Active Rooms */}
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
            className="h-8 gap-1 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10"
          >
            <span>Xem tất cả ({rooms.length})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {activeRoomsPreview.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Chưa có phòng học nào đang mở"
            description="Hãy tạo phòng học đầu tiên để cùng các bạn trao đổi bài và thảo luận nhóm!"
            action={{
              label: 'Tạo phòng học ngay',
              icon: Plus,
              onClick: () => setMoTaoPhong(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
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
