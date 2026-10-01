import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import { GAME_CATALOG } from '@/features/games/game-catalog'
import {
  ArrowRight,
  BookOpen,
  DoorOpen,
  Gamepad2,
  Plus,
  Users,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const { rooms, socialState, presenceMap, presenceReady, trangThai } = useCampus()

  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)

  const displayName = nguoiDung?.ten || nguoiDung?.username || 'Bạn học'

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

  // Top 3 featured games for instant launch
  const featuredGames = useMemo(() => {
    return GAME_CATALOG.slice(0, 3)
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

  const handleOpenChatWith = (_friendId: number, friendName: string) => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
    toast.info(`Đã mở khung chat — gửi lời nhắn tới ${friendName} nhé!`)
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── 1. Hero Grand Hall (Bento Grid: Hiện đại, thanh lịch, êm mắt) ── */}
      <section
        aria-label="Lời chào và giới thiệu"
        className="relative overflow-hidden rounded-2xl border border-border-default bg-surface shadow-xs"
      >
        {/* Background Image with Ambient Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/campus/hero_banner.webp"
            alt="Digital Campus"
            className="h-full w-full object-cover object-right opacity-25 dark:opacity-30 img-crisp transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/92 to-transparent dark:from-surface dark:via-surface/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-9 lg:p-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-1 text-xs font-semibold text-text-secondary mb-3 shadow-xs">
            <span className="size-2 rounded-full bg-brand animate-pulse" />
            <span>Digital Campus · Lớp 10A7 · Xin chào, {displayName}!</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight leading-[1.2]">
            Không gian học tập & đấu trường số
          </h1>

          <p className="mt-3 text-xs sm:text-sm lg:text-base text-text-secondary leading-relaxed max-w-2xl">
            Kết nối phòng học trực tuyến, bài giảng tương tác và thi đấu các bộ môn cờ trí tuệ thời gian thực cùng bạn học.
          </p>

          {/* Canonical Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => setMoTaoPhong(true)}
              className="h-11 px-6 rounded-xl bg-brand hover:bg-brand-hover text-brand-foreground font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Tạo phòng học mới</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/learn')}
              className="h-11 px-5 rounded-xl border-border-default bg-surface hover:bg-surface-raised text-text-primary font-semibold text-sm transition-all cursor-pointer"
            >
              <span>Khám phá các phòng</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. Smart Continuation Banner (Friend actively studying) ── */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-brand/10 p-3 sm:p-4 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand border border-brand/30">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                Bạn bè đang học: <span className="text-brand font-black">{activeFriendStudy.friend.displayName}</span>
              </p>
              <p className="text-xs text-text-secondary truncate">
                {activeFriendStudy.roomName}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate(`/room/phong-${activeFriendStudy.roomId}`)}
            className="shrink-0 gap-1.5 bg-brand hover:bg-brand-hover text-brand-foreground font-bold text-xs h-9 px-3.5 shadow-xs"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Vào cùng</span>
          </Button>
        </div>
      )}

      {/* ── 3. Main Workspace: Live Study Rooms & Instant Arena + Social Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Active Study Rooms & Quick Arena */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Study Rooms */}
          <section aria-label="Phòng học đang mở" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Phòng học đang mở
                </h2>
                {rooms.length > 0 && (
                  <span className="text-xs text-text-secondary font-mono">({rooms.length})</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMoTaoPhong(true)}
                  className="h-8 gap-1.5 text-xs font-semibold border-border-default bg-surface text-text-primary hover:bg-surface-overlay cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tạo phòng</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/learn')}
                  className="h-8 gap-1 text-xs font-bold text-brand hover:text-brand hover:bg-brand/10 cursor-pointer"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {activeRoomsPreview.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Chưa có phòng học nào đang mở"
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

          {/* Quick Arena Launch */}
          <section aria-label="Đấu trường nhanh" className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-brand" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Đấu trường nhanh
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/arena')}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả game</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {featuredGames.map((game) => (
                <div
                  key={game.id}
                  onClick={() => navigate(`/arena/${game.id}`)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default bg-surface hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-xs"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-canvas">
                    <img
                      src={game.cover}
                      alt={game.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover img-crisp group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                    <span className="absolute bottom-2.5 left-3 text-xs sm:text-sm font-bold text-text-primary drop-shadow-xs">
                      {game.shortTitle}
                    </span>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-1 border-t border-border-subtle bg-surface-raised/40">
                    <span className="text-[11px] font-medium text-text-secondary truncate">
                      {game.boardLabel || 'Online'}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs font-semibold rounded-lg bg-brand text-brand-foreground hover:bg-brand-hover cursor-pointer shadow-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/arena/${game.id}`)
                      }}
                    >
                      Chơi ngay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 1 column: Live Online Friends */}
        <div className="space-y-6">
          {/* Friends Online Widget */}
          <section aria-label="Bạn bè online" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  Bạn bè online ({onlineFriends.length})
                </h2>
              </div>

              <button
                type="button"
                onClick={() => navigate('/community?tab=friends')}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default bg-surface p-3.5 shadow-xs">
              {onlineFriends.length === 0 ? (
                <div className="text-center py-5 space-y-2">
                  <p className="text-xs text-text-secondary">Chưa có bạn nào đang online</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/community')}
                    className="h-8 px-3 text-xs border-border-default bg-surface hover:bg-surface-raised text-text-primary cursor-pointer"
                  >
                    Khám phá bạn học
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {onlineFriends.slice(0, 6).map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-surface-raised transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-raised text-text-primary font-bold text-xs border border-border-subtle">
                            {friend.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">
                            {friend.displayName}
                          </p>
                          <p className="text-[10px] text-text-tertiary truncate">Đang trực tuyến</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-text-secondary hover:text-text-primary"
                        onClick={() => handleOpenChatWith(friend.id, friend.displayName)}
                        title={`Nhắn tin cho ${friend.displayName}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
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
