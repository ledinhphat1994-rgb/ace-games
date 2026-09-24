import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ProgressSummary } from '@/components/progress/ProgressSummary'
import { CampusHeroBanner } from '@/components/campus/CampusHeroBanner'
import type { ReactNode } from 'react'
import { HomeDestinationCard, type HomeDestinationItem, HOME_DESTINATIONS } from './HomeDestinationCard'
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

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const { rooms, socialState, presenceMap, presenceReady, trangThai } = useCampus()

  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)

  const displayName = nguoiDung.ten || nguoiDung.username

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () =>
      buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers, {
        presenceReady,
        connectionStatus: trangThai,
      }),
    [rooms, friends, presenceMap, blockedUsers, presenceReady, trangThai],
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

  // Quick Launch 4-card grid: Label-first, no subtitles, no fake badges
  const destinationItems: HomeDestinationItem[] = useMemo(() => {
    const iconMap: Record<string, ReactNode> = {
      learn: <BookOpen className="h-5 w-5" />,
      arena: <Gamepad2 className="h-5 w-5" />,
      community: <Users className="h-5 w-5" />,
      rooms: <DoorOpen className="h-5 w-5" />,
    }
    return HOME_DESTINATIONS.map((dest) => ({
      ...dest,
      icon: iconMap[dest.id],
    }))
  }, [])

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
    <div className="space-y-3.5 sm:space-y-5 lg:space-y-6">
      {/* ── 1. Modern Teen Hero Banner (Reduced, dominant CTA, no badge) ── */}
      <CampusHeroBanner
        title={`Xin chào, ${displayName}!`}
        subtitle="Không gian học tập và kết nối số 10A7."
        primaryAction={{
          label: 'Vào học ngay',
          icon: <BookOpen className="h-4 w-4" />,
          onClick: () => navigate('/learning'),
        }}
      />

      {/* ── 2. Smart Continuation Banner (Friend actively studying) ── */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-xl sm:rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-2.5 sm:p-3 backdrop-blur-md shadow-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                Bạn bè đang học: <span className="text-cyan-400 font-extrabold">{activeFriendStudy.friend.displayName}</span>
              </p>
              <p className="text-xs text-slate-400 truncate">
                {activeFriendStudy.roomName}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/room/phong-${activeFriendStudy.roomId}`)}
            className="shrink-0 gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 text-xs h-7 sm:h-8 px-2.5 sm:px-3"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Vào cùng</span>
          </Button>
        </div>
      )}

      {/* ── 3. Compact Progress & Gamification Strip ── */}
      <ProgressSummary />

      {/* ── 4. Quick Launch 4-Tile Grid (Label-first) ── */}
      <section aria-label="Lối tắt truy cập nhanh">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
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
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Phòng học nổi bật
              </h2>
              {rooms.length > 0 && (
                <span className="text-xs text-slate-400 font-mono">({rooms.length})</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMoTaoPhong(true)}
                className="h-8 gap-1 text-xs font-semibold border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo phòng</span>
              </Button>

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
          </div>

          {activeRoomsPreview.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Chưa có phòng học"
              action={{
                label: 'Tạo phòng',
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
              <Users className="h-4 w-4 text-cyan-400" />
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

          <div className="rounded-xl sm:rounded-2xl border border-white/5 bg-[#0c1222]/60 p-3 sm:p-3.5 backdrop-blur-md min-h-[110px] sm:min-h-[130px] flex flex-col justify-center">
            {onlineFriends.length === 0 ? (
              <div className="text-center py-2.5 space-y-1.5">
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-400 border border-white/10">
                  <UserPlus className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">Chưa có bạn online</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/community')}
                  className="h-6 sm:h-7 px-2.5 text-xs border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                >
                  Tìm bạn
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {onlineFriends.slice(0, 6).map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold text-xs shadow-sm">
                          {friend.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0c1222]" />
                      </div>
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {friend.displayName}
                      </span>
                    </div>
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
