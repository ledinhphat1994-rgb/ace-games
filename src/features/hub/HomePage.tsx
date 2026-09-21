import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressSummary } from '@/components/progress/ProgressSummary'
import { CampusHeroBanner } from '@/components/campus/CampusHeroBanner'
import { HomeDestinationCard, type HomeDestinationItem } from './HomeDestinationCard'
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

  // Online friends list
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const p = presenceMap[f.id]
      return p && (p.state === 'online' || p.state === 'away')
    })
  }, [friends, presenceMap])

  const destinationItems: HomeDestinationItem[] = [
    {
      id: 'learn',
      title: 'Học tập',
      subtitle: 'Khám phá kiến thức',
      tags: ['Phòng học', 'Tài liệu', 'Trao đổi'],
      artwork: '/assets/learning/card_learning.webp',
      href: '/learning',
      icon: <BookOpen className="h-5 w-5" />,
      accentColor: 'blue',
    },
    {
      id: 'arena',
      title: 'Đấu trường Game',
      subtitle: 'Thư giãn & thử thách',
      tags: ['Caro', '2048', 'Rắn'],
      artwork: '/assets/games/card_game.webp',
      href: '/arena',
      icon: <Gamepad2 className="h-5 w-5" />,
      accentColor: 'green',
    },
    {
      id: 'community',
      title: 'Cộng đồng',
      subtitle: 'Kết nối, cùng phát triển',
      tags: ['Bạn bè', 'Trực tuyến', 'Kết nối'],
      artwork: '/assets/community/card_community.webp',
      href: '/community',
      icon: <Users className="h-5 w-5" />,
      accentColor: 'purple',
    },
  ]

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
      {/* ── 1. Cinematic Hero Banner (Contract for future Admin banner) ── */}
      <CampusHeroBanner
        badgeText={`${loiChao} · ${lopText}`}
        title={`Xin chào, ${displayName}!`}
        motto={nguoiDung.tieuDeHoSo || 'Học hôm nay, tiến xa hơn ngày mai.'}
        subtitle="Bắt đầu ôn luyện bài học hoặc kết nối cùng các bạn trong không gian số."
        primaryAction={{
          label: 'Vào học ngay',
          icon: <BookOpen className="h-4 w-4" />,
          onClick: () => navigate('/learning'),
        }}
        secondaryAction={{
          label: 'Tạo phòng học',
          icon: <Sparkles className="h-4 w-4" />,
          onClick: () => setMoTaoPhong(true),
        }}
        slogan="Cùng nhau tạo nên phiên bản tốt hơn mỗi ngày"
      />

      {/* ── 2. Smart continuation (friend actively studying) ─ */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-500/25 bg-indigo-950/20 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                Bạn bè đang học: <span className="text-indigo-400">{activeFriendStudy.friend.displayName}</span>
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {activeFriendStudy.roomName} — cùng vào học ngay nhé!
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/room/phong-${activeFriendStudy.roomId}`)}
            className="shrink-0 gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-md shadow-indigo-500/20"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            Vào cùng
          </Button>
        </div>
      )}

      {/* ── 3. Progress / Gamification Strip ───────────────── */}
      <ProgressSummary />

      {/* ── 4. Main Grid: Destination Cards + Sidebar Widgets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 columns: Destination Cards + Active Rooms */}
        <div className="lg:col-span-3 space-y-6">
          {/* Destination Cards */}
          <section aria-label="Khám phá không gian">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {destinationItems.map((item) => (
                <HomeDestinationCard
                  key={item.id}
                  item={item}
                  onClick={() => navigate(item.href)}
                />
              ))}
            </div>
          </section>

          {/* Active Rooms */}
          <section aria-label="Phòng học đang hoạt động" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
                <h2 className="text-base font-extrabold text-white">Phòng học nổi bật</h2>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/learn')}
                className="h-8 gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
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
                  onClick: () => setMoTaoPhong(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Right 1 column: Sidebar Widgets (Online Friends + Quote Banner) */}
        <div className="space-y-4">
          {/* Online Friends Widget */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Bạn bè online ({onlineFriends.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="text-[11px] font-semibold text-cyan-400 hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            <div className="pt-3">
              {onlineFriends.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400">Chưa có bạn bè nào đang online</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/community')}
                    className="text-xs text-cyan-400 h-auto p-0 mt-1"
                  >
                    Kết nối bạn bè ngay
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {onlineFriends.slice(0, 5).map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-950 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                            {friend.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                        </div>
                        <span className="text-xs font-medium text-slate-200 truncate">
                          {friend.displayName}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium">Trực tuyến</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Inspirational Quote Landscape Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg min-h-[120px] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
              style={{ backgroundImage: 'url(/assets/campus/quote_landscape.webp)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-[#0c1222]/80 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-1">
              <span className="text-cyan-400 text-lg font-serif leading-none">&ldquo;</span>
              <p className="text-xs font-semibold text-slate-200 italic leading-relaxed">
                Kiến thức hôm nay là cơ hội của ngày mai.
              </p>
              <p className="text-[10px] text-cyan-300/70 font-medium pt-1">
                Better Students · Brighter Tomorrow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {phongCanMatKhau && (
        <PasswordRoomDialog
          room={phongCanMatKhau}
          onSuccess={(roomId) => {
            setPhongCanMatKhau(null)
            navigate(`/room/phong-${roomId}`)
          }}
          onClose={() => setPhongCanMatKhau(null)}
        />
      )}

      <CreateStudyRoomDialog
        open={moTaoPhong}
        onOpenChange={setMoTaoPhong}
        onSuccess={(roomId) => {
          setMoTaoPhong(false)
          navigate(`/room/phong-${roomId}`)
        }}
      />
    </div>
  )
}
