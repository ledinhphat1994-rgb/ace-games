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
  Trophy,
  Users,
  Sparkles,
  Target,
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
      {/* ── 1. Hero Banner (Design Reference 1, 2, 3, 4) ── */}
      <section
        aria-label="Lời chào và giới thiệu"
        className="relative overflow-hidden rounded-3xl border border-border-default/80 bg-surface shadow-xl"
      >
        {/* Background Image with Ambient Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/campus/hero_banner.webp"
            alt="Digital Campus"
            className="h-full w-full object-cover object-center opacity-35 dark:opacity-40 img-crisp transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/90 to-transparent dark:from-canvas dark:via-canvas/80" />
          {/* Subtle ambient light spots */}
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-brand/12 blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-24 size-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/35 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand mb-3.5 shadow-xs backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-brand animate-pulse" />
            <span>Digital Campus v2.4 · Xin chào, {displayName}! 👋</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.6rem] font-black text-text-primary tracking-tight leading-[1.18]">
            Học tập thông minh. Đấu trường sôi động. Kết nối bạn bè.
          </h1>

          <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-text-secondary leading-relaxed max-w-2xl">
            Không gian số dành riêng cho học sinh — cùng bạn bè khám phá bài giảng, trao đổi học tập, so tài mini-games và gắn kết mỗi ngày.
          </p>

          {/* Platform Status Chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Realtime
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 backdrop-blur-sm">
              🔥 Chuỗi 7 ngày liên tục
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-brand/25 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand backdrop-blur-sm">
              🎓 Lớp 10A7 2026-2027
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/learn')}
              className="h-11 px-7 rounded-xl bg-gradient-to-r from-brand to-brand hover:from-brand-hover hover:to-brand text-brand-foreground font-bold text-sm shadow-md shadow-brand/25 hover:shadow-brand/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span>Bắt đầu ngay</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── 2. Smart Continuation Banner (Friend actively studying) ── */}
      {activeFriendStudy && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-brand/10 p-3 sm:p-4 backdrop-blur-md shadow-sm">
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
            className="shrink-0 gap-1.5 bg-brand hover:bg-brand/90 text-brand-foreground font-bold text-xs h-9 px-3.5 shadow-sm"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            <span>Vào cùng</span>
          </Button>
        </div>
      )}

      {/* ── 3. 4 Quick Access Feature Cards (Image 1, 2, 3, 4) ── */}
      <section aria-label="Lối tắt chính">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
          {/* Card 1: Học tập */}
          <div
            onClick={() => navigate('/learn')}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-surface to-surface hover:border-sky-400 hover:glow-cyan hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 group-hover:scale-105 group-hover:bg-sky-500/25 transition-all">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-sky-500/15 border border-sky-500/25 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">
                Trực tuyến
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-sky-400 transition-colors">
                  Học tập
                </h2>
                <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="mt-1 text-xs text-text-secondary">Phòng học, slide PDF & bảng phấn</p>
            </div>
          </div>

          {/* Card 2: Game */}
          <div
            onClick={() => navigate('/arena')}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-surface to-surface hover:border-purple-400 hover:glow-purple hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 group-hover:scale-105 group-hover:bg-purple-500/25 transition-all">
                <Gamepad2 className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 text-[10px] font-bold text-purple-400">
                1v1 & Solo
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-purple-400 transition-colors">
                  Đấu trường Game
                </h2>
                <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="mt-1 text-xs text-text-secondary">Cờ vua, cờ ca-rô & đố trí tuệ</p>
            </div>
          </div>

          {/* Card 3: Cộng đồng */}
          <div
            onClick={() => navigate('/community')}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-pink-500/25 bg-gradient-to-br from-pink-500/10 via-surface to-surface hover:border-pink-400 hover:glow-emerald hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/15 text-pink-400 border border-pink-500/30 group-hover:scale-105 group-hover:bg-pink-500/25 transition-all">
                <Users className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-pink-500/15 border border-pink-500/25 px-1.5 py-0.5 text-[10px] font-bold text-pink-400">
                Mạng xã hội
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-pink-400 transition-colors">
                  Cộng đồng
                </h2>
                <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="mt-1 text-xs text-text-secondary">Bảng tin, sự kiện & kết nối bạn bè</p>
            </div>
          </div>

          {/* Card 4: Bảng xếp hạng */}
          <div
            onClick={() => navigate('/rankings')}
            className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-surface to-surface hover:border-amber-400 hover:glow-amber hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:scale-105 group-hover:bg-amber-500/25 transition-all">
                <Trophy className="h-5 w-5" />
              </div>
              <span className="rounded-md bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                Top học sinh
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-amber-400 transition-colors">
                  Bảng xếp hạng
                </h2>
                <ArrowRight className="h-4 w-4 text-text-tertiary group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="mt-1 text-xs text-text-secondary">Vinh danh thành tích học & chơi</p>
            </div>
          </div>
        </div>
      </section>



      {/* ── 4. Section: Game nổi bật (Featured Games row with cards & covers) ── */}
      <section aria-label="Game nổi bật" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-text-primary">
              Game nổi bật
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/arena')}
            className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Tất cả game</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {GAME_CATALOG.map((game) => (
            <div
              key={game.id}
              onClick={() => navigate(`/arena/${game.id}`)}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default/80 bg-surface hover:border-brand/60 hover:glow-cyan hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xs"
            >
              {/* Cover Image */}
              <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                <img
                  src={game.cover}
                  alt={game.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover img-crisp group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <span className="absolute top-2.5 right-2.5 rounded-lg bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/15">
                  {game.boardLabel || 'Online'}
                </span>
                <span className="absolute bottom-2.5 left-2.5 text-xs sm:text-sm font-black text-white drop-shadow-md">
                  {game.shortTitle}
                </span>
              </div>

              {/* Card Footer */}
              <div className="p-3 flex items-center justify-between gap-1 border-t border-border-subtle bg-surface-raised/40">
                <span className="text-[11px] font-medium text-text-secondary truncate">
                  {game.category === '1v1' ? '1v1 & Đấu AI' : 'Chơi đơn & AI'}
                </span>
                <Button
                  size="sm"
                  className="h-7 px-3 text-[11px] font-bold rounded-lg bg-brand text-brand-foreground hover:bg-brand/90 cursor-pointer shadow-xs"
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

      {/* ── 5. Main Content Area: Active Rooms + Online Friends ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Featured Active Rooms */}
        <section aria-label="Phòng học đang mở" className="lg:col-span-2 space-y-4">
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
                label: 'Tạo phòng học đầu tiên',
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

        {/* Right 1 column: Live Online Friends Widget & Events */}
        <div className="space-y-6">
          {/* Friends Online */}
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
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-text-secondary">Chưa có bạn nào đang online</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/community')}
                    className="h-8 px-3 text-xs border-border-default bg-surface hover:bg-surface-overlay text-text-primary cursor-pointer"
                  >
                    Khám phá bạn học
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {onlineFriends.slice(0, 6).map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-surface-overlay transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-brand font-bold text-xs border border-brand/30">
                            {friend.displayName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-surface" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">
                            {friend.displayName}
                          </p>
                          <p className="text-[10px] text-text-tertiary truncate">Đang online</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-text-secondary hover:text-brand"
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

          {/* Daily Goal & Activity Streak */}
          <section aria-label="Mục tiêu hôm nay" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-brand" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  Mục tiêu hôm nay
                </h2>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                🔥 Chuỗi 7 ngày
              </span>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface/80 p-4 shadow-xs space-y-3 backdrop-blur-md">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">Nhiệm vụ học tập & game</span>
                  <span className="font-bold text-brand tabular-nums">2 / 3</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-overlay overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-emerald-400 transition-all duration-500"
                    style={{ width: '66%' }}
                  />
                </div>
                <p className="text-[11px] text-text-secondary">
                  Hoàn thành thêm 1 phòng học hoặc trận đấu để nhận <span className="font-bold text-amber-300">+50 XP</span>
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => navigate('/learn')}
                className="w-full h-8 text-xs font-bold rounded-xl bg-brand hover:bg-brand/90 text-brand-foreground shadow-xs cursor-pointer"
              >
                Tiếp tục học ngay
              </Button>
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
