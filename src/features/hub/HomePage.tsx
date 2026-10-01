// Digital Campus v2: Canonical Home Page (Approved Reference Design)
// src/features/hub/HomePage.tsx

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
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import {
  ArrowRight,
  BookOpen,
  DoorOpen,
  Gamepad2,
  Plus,
  Users,
  Trophy,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const { rooms, socialState, presenceMap, presenceReady, trangThai, messages } = useCampus()

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
    const friendWithRoom = friends.find((f) => {
      const act = presenceMap[f.id]?.activity
      return act?.type === 'room' && Boolean(act.roomId)
    })
    if (!friendWithRoom) return null
    const act = presenceMap[friendWithRoom.id]?.activity
    const roomId = act?.roomId as number
    const targetRoom = rooms.find((r) => r.id === roomId)
    return {
      friend: friendWithRoom,
      roomId,
      roomName: targetRoom?.ten || `Phòng #${roomId}`,
    }
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

  // Recent messages preview (last 3 messages from real campus chat)
  const recentMessagesPreview = useMemo(() => {
    return messages.slice(-3).reverse()
  }, [messages])

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
      moAuthModal?.('dang_nhap')
      return
    }
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
    toast.info(`Đã mở khung chat — gửi lời nhắn tới ${friendName} nhé!`)
  }

  const handleOpenCampusChat = () => {
    if (!nguoiDung) {
      moAuthModal?.('dang_nhap')
      return
    }
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
  }

  // Four canonical destination definitions (Approved Reference Design)
  const destinationTiles = [
    {
      to: '/learn',
      title: 'Học tập',
      description: 'Kiến thức hôm nay, kiến tạo tương lai',
      icon: BookOpen,
      borderStyle: 'hover:border-sky-500/50',
      iconContainerStyle: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    },
    {
      to: '/arena',
      title: 'Game',
      description: 'Chơi để phát triển, nâng tầm trải nghiệm',
      icon: Gamepad2,
      borderStyle: 'hover:border-purple-500/50',
      iconContainerStyle: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
    },
    {
      to: '/community',
      title: 'Cộng đồng',
      description: 'Kết nối bạn bè, cùng nhau tiến bộ',
      icon: Users,
      borderStyle: 'hover:border-emerald-500/50',
      iconContainerStyle: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    },
    {
      to: '/rankings',
      title: 'Bảng xếp hạng',
      description: 'Tôn vinh nỗ lực, lan tỏa cảm hứng',
      icon: Trophy,
      borderStyle: 'hover:border-amber-500/50',
      iconContainerStyle: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* ── 1. Hero Grand Hall (Approved Reference Design) ── */}
      <section
        aria-label="Lời chào và giới thiệu"
        className="relative overflow-hidden rounded-2xl border border-border-default/80 bg-surface shadow-xs"
      >
        {/* Background Image with Ambient Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/brand/campus-hero.webp"
            alt="Digital Campus"
            className="h-full w-full object-cover object-right opacity-30 dark:opacity-35 img-crisp transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent dark:from-surface dark:via-surface/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-9 lg:p-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-1 text-xs font-semibold text-text-secondary mb-3.5 shadow-xs">
            <span className="size-2 rounded-full bg-brand animate-pulse" />
            <span>Digital Campus · Lớp 10A7 · Xin chào, {displayName}!</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight leading-[1.25]">
            Học tập • Kết nối
            <br />
            Chơi game • Phát triển
            <br />
            <span className="text-brand">Tất cả trong một nơi.</span>
          </h1>

          <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-text-secondary leading-relaxed max-w-2xl">
            Cùng nhau học tập, chơi game, kết nối bạn bè và phát triển kỹ năng để tạo nên một cộng đồng học sinh năng động.
          </p>

          {/* Canonical CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/learn')}
              className="h-11 px-6 rounded-xl bg-brand hover:bg-brand-hover text-brand-foreground font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <span>Bắt đầu khám phá</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setMoTaoPhong(true)}
              className="h-11 px-5 rounded-xl border-border-default bg-surface hover:bg-surface-raised text-text-primary font-semibold text-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Tạo phòng học mới</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. Four Destination Surfaces (Reference Image 7) ── */}
      <section aria-label="Các khu vực chính" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {destinationTiles.map((tile) => {
          const Icon = tile.icon
          return (
            <div
              key={tile.to}
              onClick={() => navigate(tile.to)}
              className={cn(
                'group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-border-default/80 bg-surface hover:bg-surface-raised/80 transition-all duration-200 cursor-pointer shadow-xs',
                tile.borderStyle,
              )}
            >
              {/* Icon Container */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl border shadow-xs transition-transform duration-200 group-hover:scale-105',
                    tile.iconContainerStyle,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-overlay text-text-tertiary group-hover:text-text-primary group-hover:translate-x-0.5 transition-all">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-brand transition-colors">
                  {tile.title}
                </h2>
                <p className="mt-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">
                  {tile.description}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── 3. Smart Continuation Banner (Friend actively studying) ── */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-brand/10 p-3.5 sm:p-4 backdrop-blur-md shadow-xs">
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

      {/* ── 4. Main Workspace (2 columns) + Right Contextual Rail (1 column) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Area: Live Study Rooms & Instant Arena (8 columns on lg/xl) ── */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Active Study Rooms */}
          <section aria-label="Phòng học đang mở" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
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
          <section aria-label="Đấu trường nhanh" className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4.5 w-4.5 text-brand" />
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
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default/80 bg-surface hover:border-brand/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-xs"
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

        {/* ── Right Utility Rail: Live Online Friends & Recent Chat (4 columns on lg/xl) ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Priority A: Friends Online */}
          <section aria-label="Bạn bè online" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
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

            <div className="rounded-2xl border border-border-default/80 bg-surface p-3.5 shadow-xs">
              {onlineFriends.length === 0 ? (
                <div className="text-center py-5 space-y-2">
                  <p className="text-xs text-text-secondary">Chưa có bạn nào đang online</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/community?tab=friends')}
                    className="h-8 px-3 text-xs border-border-default bg-surface hover:bg-surface-raised text-text-primary cursor-pointer"
                  >
                    Khám phá bạn học
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {onlineFriends.slice(0, 6).map((friend) => {
                    const presence = presenceMap[friend.id]
                    const activityText =
                      presence?.activity?.type === 'room'
                        ? 'Đang học bài'
                        : 'Trực tuyến'

                    return (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-surface-raised transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <AnhNguoiDung
                              avatar={friend.avatar}
                              ten={friend.displayName}
                              className="h-8 w-8 rounded-full border border-border-subtle"
                            />
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">
                              {friend.displayName}
                            </p>
                            <p className="text-[10px] text-text-tertiary truncate">{activityText}</p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-text-secondary hover:text-text-primary shrink-0"
                          onClick={() => handleOpenChatWith(friend.id, friend.displayName)}
                          title={`Nhắn tin cho ${friend.displayName}`}
                          aria-label={`Nhắn tin cho ${friend.displayName}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Priority B: Recent Campus Chat Preview */}
          <section aria-label="Trò chuyện trường" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  Trò chuyện trường
                </h2>
              </div>

              <button
                type="button"
                onClick={handleOpenCampusChat}
                className="text-xs font-bold text-brand hover:underline cursor-pointer"
              >
                Mở chat
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface p-3.5 shadow-xs">
              {recentMessagesPreview.length === 0 ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-text-secondary">Chưa có tin nhắn mới</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenCampusChat}
                    className="h-8 px-3 text-xs border-border-default bg-surface hover:bg-surface-raised text-text-primary cursor-pointer"
                  >
                    Bắt đầu trò chuyện
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentMessagesPreview.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={handleOpenCampusChat}
                      className="group p-2 rounded-xl bg-surface-raised/40 hover:bg-surface-raised transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
                        <span className="font-bold text-text-primary truncate">
                          {msg.ten}
                        </span>
                        <span className="text-[10px] text-text-tertiary shrink-0">
                          {new Date(msg.taoLuc).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-1 break-words group-hover:text-text-primary transition-colors">
                        {msg.noiDung}
                      </p>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenCampusChat}
                    className="w-full mt-1 h-8 text-xs font-semibold text-brand hover:bg-brand/10 cursor-pointer"
                  >
                    <span>Vào khung chat toàn trường</span>
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Quick Shortcuts */}
          <section aria-label="Lối tắt" className="rounded-2xl border border-border-default/80 bg-surface p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-text-primary">Lối tắt nhanh</h2>
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/me')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors text-left cursor-pointer"
              >
                <span>Hồ sơ & Thành tựu cá nhân</span>
                <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/rankings')}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors text-left cursor-pointer"
              >
                <span>Bảng vinh danh tuần</span>
                <ArrowRight className="h-3.5 w-3.5 text-text-tertiary" />
              </button>
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
