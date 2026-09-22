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
  Plus,
  UserPlus,
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
  const lopText = nguoiDung.lop?.ten ? `Lớp ${nguoiDung.lop.ten}` : 'Campus Toàn trường'
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

  // Quick Launch 4-card grid
  const destinationItems: HomeDestinationItem[] = [
    {
      id: 'learn',
      title: 'Học tập',
      subtitle: 'Tài liệu & ôn tập',
      artwork: '/assets/learning/card_learning.webp',
      href: '/learning',
      icon: <BookOpen className="h-5 w-5" />,
      accentColor: 'blue',
    },
    {
      id: 'arena',
      title: 'Đấu trường Game',
      subtitle: 'Caro · 2048 · Rắn',
      artwork: '/assets/games/card_game.webp',
      href: '/arena',
      icon: <Gamepad2 className="h-5 w-5" />,
      accentColor: 'green',
      badge: 'HOT',
    },
    {
      id: 'community',
      title: 'Bạn bè & Cộng đồng',
      subtitle: 'Trò chuyện & kết nối',
      artwork: '/assets/community/card_community.webp',
      href: '/community',
      icon: <Users className="h-5 w-5" />,
      accentColor: 'purple',
    },
    {
      id: 'rooms',
      title: 'Phòng học nhóm',
      subtitle: 'Không gian học trực tuyến',
      artwork: '/assets/learning/room_study.webp',
      href: '/learn',
      icon: <DoorOpen className="h-5 w-5" />,
      accentColor: 'amber',
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
    <div className="space-y-5 sm:space-y-6">
      {/* ── 1. Modern Teen Hero Banner ── */}
      <CampusHeroBanner
        badgeText={`${loiChao} · ${lopText}`}
        title={`Xin chào, ${displayName}!`}
        subtitle="Bắt đầu ôn luyện bài học hoặc kết nối cùng các bạn trong không gian số."
        primaryAction={{
          label: 'Vào học ngay',
          icon: <BookOpen className="h-4 w-4" />,
          onClick: () => navigate('/learning'),
        }}
        secondaryAction={{
          label: 'Tạo phòng học',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setMoTaoPhong(true),
        }}
      />

      {/* ── 2. Smart Continuation Banner (Friend actively studying) ── */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3.5 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                Bạn bè đang học: <span className="text-indigo-400 font-extrabold">{activeFriendStudy.friend.displayName}</span>
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {activeFriendStudy.roomName} — tham gia học chung ngay!
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/room/phong-${activeFriendStudy.roomId}`)}
            className="shrink-0 gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold shadow-md shadow-indigo-500/25"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Vào cùng</span>
          </Button>
        </div>
      )}

      {/* ── 3. Compact Progress & Gamification Strip ── */}
      <ProgressSummary />

      {/* ── 4. Quick Launch 4-Tile Grid ── */}
      <section aria-label="Lối tắt truy cập nhanh">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {destinationItems.map((item) => (
            <HomeDestinationCard
              key={item.id}
              item={item}
              onClick={() => navigate(item.href)}
            />
          ))}
        </div>
      </section>

      {/* ── 5. Main Content Area: Active Rooms + Online Friends ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left 2 columns: Featured Active Rooms */}
        <section aria-label="Phòng học đang hoạt động" className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Phòng học nổi bật
              </h2>
              {rooms.length > 0 && (
                <span className="text-xs text-slate-400 font-mono">({rooms.length})</span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/learn')}
              className="h-8 gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {activeRoomsPreview.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Chưa có phòng học nào đang mở"
              description="Tạo phòng học đầu tiên để cùng thảo luận nhóm hoặc ôn tập bài giảng!"
              action={{
                label: 'Tạo phòng học ngay',
                onClick: () => setMoTaoPhong(true),
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

        {/* Right 1 column: Live Online Friends Widget */}
        <section aria-label="Bạn bè trực tuyến" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Bạn bè online
              </h2>
              <span className="text-xs text-slate-400 font-mono">({onlineFriends.length})</span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/community')}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              Cộng đồng
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0c1222]/85 p-3.5 backdrop-blur-md shadow-lg min-h-[160px] flex flex-col justify-center">
            {onlineFriends.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-300">Chưa có bạn bè trực tuyến</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Kết nối bạn bè cùng lớp để cùng nhau học tập nhé!
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className="h-7 text-xs border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 mt-1"
                >
                  Tìm bạn bè
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {onlineFriends.slice(0, 6).map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-xs shadow-sm">
                          {friend.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0c1222]" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {friend.displayName}
                      </span>
                    </div>

                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Online
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
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
