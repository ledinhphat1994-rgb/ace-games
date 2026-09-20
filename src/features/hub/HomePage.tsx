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

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () => buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers),
    [rooms, friends, presenceMap, blockedUsers],
  )

  // Smart continuation: find a friend actively in a study room
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

  // Top active rooms (up to 4), friends-first then occupancy
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
    <div className="space-y-5">
      {/* ── 1. Hero banner ────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border-default hero-gradient p-5 sm:p-6">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-social/5 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Identity + greeting */}
          <div className="space-y-1.5 max-w-lg">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                {loiChao}
              </span>
              <span className="text-border-strong text-xs">·</span>
              <span className="text-xs font-medium text-text-secondary">{lopText}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
              Xin chào, {displayName}!
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Bắt đầu ôn luyện bài học hoặc kết nối cùng các bạn.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <Button
              size="default"
              onClick={() => navigate('/learn')}
              className="gap-2 font-bold shadow-md shadow-brand/20 hover:scale-[1.02] transition-transform"
            >
              <BookOpen className="h-4 w-4" />
              Vào học ngay
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={() => setMoTaoPhong(true)}
            >
              <Plus className="h-4 w-4 text-brand" />
              Tạo phòng
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Smart continuation (friend actively studying) ─ */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-social/25 bg-social/8 p-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-social/15 text-social border border-social/20">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-text-primary truncate">
                Bạn bè đang học: <span className="text-social">{activeFriendStudy.friend.displayName}</span>
              </p>
              <p className="text-[11px] text-text-secondary truncate">
                {activeFriendStudy.roomName} — cùng vào học nhé!
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/room/phong-${activeFriendStudy.roomId}`)}
            className="shrink-0 gap-1 bg-social text-white hover:bg-social/90 shadow-sm"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            Vào học cùng
          </Button>
        </div>
      )}

      {/* ── 3. Progress rail ─────────────────────────────── */}
      <ProgressSummary />

      {/* ── 4. Destination shortcut cards ────────────────── */}
      <section aria-label="Lối tắt nhanh" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Học tập */}
        <Card
          onClick={() => navigate('/learn')}
          className="group cursor-pointer border-brand/20 bg-gradient-to-br from-card to-brand/5 hover:border-brand/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 text-brand shadow-inner group-hover:bg-brand/18 group-hover:scale-105 transition-all">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-text-primary group-hover:text-brand transition-colors truncate">
                  Học Tập 📚
                </h3>
                <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">
                  {rooms.length} phòng
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                Phòng học lớp, toàn trường và thảo luận
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Game */}
        <Card
          onClick={() => navigate('/arena')}
          className="group cursor-pointer border-success/20 bg-gradient-to-br from-card to-success/5 hover:border-success/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-success/25 bg-success/10 text-success shadow-inner group-hover:bg-success/18 group-hover:scale-105 transition-all">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-text-primary group-hover:text-success transition-colors truncate">
                  Đấu Trường 🎮
                </h3>
                <Badge variant="success" className="shrink-0 text-[10px] px-1.5 py-0">
                  4 trò chơi
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                Caro, Cờ lật, 2048 &amp; Rắn Deluxe
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cộng đồng */}
        <Card
          onClick={() => navigate('/community')}
          className="group cursor-pointer border-social/20 bg-gradient-to-br from-card to-social/5 hover:border-social/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
        >
          <CardContent className="flex items-center gap-3.5 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-social/25 bg-social/10 text-social shadow-inner group-hover:bg-social/18 group-hover:scale-105 transition-all">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-text-primary group-hover:text-social transition-colors truncate">
                  Cộng Đồng 👥
                </h3>
                <Badge variant="social" className="shrink-0 text-[10px] px-1.5 py-0">
                  {friends.length} bạn bè
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary line-clamp-1">
                Bạn bè, hoạt động và kết nối lớp
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── 5. Featured active rooms ─────────────────────── */}
      <section aria-label="Phòng học đang hoạt động" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-success animate-pulse" />
            <h2 className="text-sm font-bold text-text-primary">Phòng học nổi bật</h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/learn')}
            className="h-7 gap-1 text-xs font-semibold text-brand hover:text-brand hover:bg-brand/10"
          >
            Xem tất cả ({rooms.length})
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {activeRoomsPreview.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Chưa có phòng học nào đang mở"
            description="Tạo phòng học đầu tiên để cùng các bạn trao đổi bài và thảo luận nhóm!"
            action={{
              label: 'Tạo phòng học ngay',
              icon: Plus,
              onClick: () => setMoTaoPhong(true),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Modals */}
      <CreateStudyRoomDialog open={moTaoPhong} onOpenChange={setMoTaoPhong} />
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
