import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { useDragScroll } from '@/hooks/use-drag-scroll'
import { Button } from '@/components/ui/button'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { GAME_CATALOG } from '@/features/games/game-catalog'
import {
  ArrowRight,
  BookOpen,
  DoorOpen,
  Gamepad2,
  MessageSquare,
  Plus,
  Trophy,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

const LEADERBOARD_LINK = { to: '/leaderboard', label: 'Bảng xếp hạng' }

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const { rooms, socialState, presenceMap, presenceReady, trangThai, messages } = useCampus()

  const roomsDrag = useDragScroll<HTMLDivElement>({ direction: 'horizontal' })
  const gamesDrag = useDragScroll<HTMLDivElement>({ direction: 'horizontal' })
  const friendsDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })
  const messagesDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })

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

  // Danh sách phòng học đang mở (sắp xếp bạn bè lên trước, rồi đến phòng đông người)
  const activeRoomsPreview = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const friendsA = roomFriendsMap.get(a.id)?.length ?? 0
      const friendsB = roomFriendsMap.get(b.id)?.length ?? 0
      if (friendsA !== friendsB) return friendsB - friendsA
      return b.soNguoi - a.soNguoi
    })
  }, [rooms, roomFriendsMap])

  // Bạn bè thật đang online từ presenceMap (không fake data)
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const p = presenceMap[f.id]
      return p && (p.state === 'online' || p.state === 'away')
    })
  }, [friends, presenceMap])

  // Tin nhắn thật từ Campus Chat (10 tin mới nhất để người dùng kéo cuộn đọc)
  const recentMessagesPreview = useMemo(() => {
    return messages
      .slice(-10)
      .reverse()
      .map((m) => ({
        id: m.id,
        sender: m.ten,
        preview: m.noiDung,
        time: new Date(m.taoLuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }))
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

  const handleOpenCampusChat = (dmUser?: { id: number; name: string }) => {
    if (!nguoiDung) {
      moAuthModal?.('dang_nhap')
      return
    }
    if (dmUser) {
      window.dispatchEvent(
        new CustomEvent('campus:open-dm', {
          detail: {
            id: dmUser.id,
            displayName: dmUser.name,
            username: `user_${dmUser.id}`,
            avatar: null,
            role: 'student',
          },
        }),
      )
    } else {
      window.dispatchEvent(new CustomEvent('campus:open-chat'))
    }
  }

  return (
    <div className="pb-12 space-y-8">
      {/* 1. Full-Width Cyber Hero Banner (Cao gấp đôi ~460px, ngang trọn vẹn màn hình) */}
      <section
        aria-label="Chào mừng bạn học"
        className="relative overflow-hidden rounded-3xl border border-sky-500/25 bg-[#040e29] shadow-[0_0_40px_rgba(56,189,248,0.12)] min-h-[440px] lg:min-h-[480px] flex flex-col justify-center p-8 sm:p-12 lg:p-16 group"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/assets/cyber_mockups/home_hero_bg.webp"
            alt="Digital Campus Hero"
            className="h-full w-full object-cover object-right opacity-75 dark:opacity-85 crisp-image scale-100 group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020c24] via-[#020c24]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020c24]/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-400 mb-4 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
            <span>DIGITAL CAMPUS • LỚP 10A7</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
            Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">{displayName}</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Không gian học tập trực tuyến, thi đấu trí tuệ và kết nối bạn học tại Trung tâm GDTX Định Quán.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Button
              size="lg"
              onClick={() => navigate('/learn')}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer gap-2"
            >
              <BookOpen className="size-4" />
              <span>Vào phòng học</span>
              <ArrowRight className="size-3.5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/arena')}
              className="h-11 px-5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer gap-2"
            >
              <Gamepad2 className="size-4 text-purple-400" />
              <span>Đấu trường game</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Bố cục 2 cột bên dưới (8 cột chính + 4 cột tiện ích) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Khu vực chính giữa: 8 cột trên XL ── */}
        <div className="xl:col-span-8 space-y-7 min-w-0">
          {/* 2. Phòng học trực tuyến (Kéo qua kéo lại mượt mà trơn tru không giật khấc) */}
          <section aria-label="Phòng học trực tuyến" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Phòng học trực tuyến
                </h2>
                <span className="text-xs text-text-tertiary font-mono">
                  ({activeRoomsPreview.length} phòng)
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!nguoiDung) {
                    moAuthModal('dang_nhap')
                    return
                  }
                  setMoTaoPhong(true)
                }}
                className="h-8 gap-1.5 text-xs font-semibold border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo phòng</span>
              </Button>
            </div>

            {/* Thanh kéo ngang mượt mà cho phòng học */}
            {activeRoomsPreview.length > 0 ? (
              <div
                ref={roomsDrag.ref}
                {...roomsDrag.events}
                className="smooth-carousel gap-4 pb-3 pt-1 scrollbar-none"
              >
                {activeRoomsPreview.map((room) => (
                  <div key={room.id} className="shrink-0 w-[290px] sm:w-[330px]">
                    <RoomCard
                      room={room}
                      friends={roomFriendsMap.get(room.id)}
                      onVaoPhong={xuLyVaoPhong}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border-default/80 bg-surface p-8 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
                  <DoorOpen className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Chưa có phòng học nào đang mở</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Bạn có thể tự tạo phòng học nhóm để cùng bạn bè trao đổi bài vở, chia sẻ tài liệu và video bài giảng.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!nguoiDung) {
                      moAuthModal('dang_nhap')
                      return
                    }
                    setMoTaoPhong(true)
                  }}
                  className="h-8 px-4 rounded-xl bg-brand text-brand-foreground font-bold text-xs"
                >
                  <Plus className="size-3.5 mr-1" />
                  <span>Tạo phòng học đầu tiên</span>
                </Button>
              </div>
            )}
          </section>

          {/* 3. Đấu trường trò chơi (Kéo qua kéo lại mượt mà trơn tru không giật khối) */}
          <section aria-label="Đấu trường trò chơi" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="size-4.5 text-purple-400" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Đấu trường trò chơi
                </h2>
                <span className="text-xs text-text-tertiary">
                  (5 trò chơi trí tuệ & giải trí)
                </span>
              </div>
            </div>

            {/* Thanh kéo ngang mượt mà cho 5 trò chơi */}
            <div
              ref={gamesDrag.ref}
              {...gamesDrag.events}
              className="smooth-carousel gap-4 pb-3 pt-1 scrollbar-none"
            >
              {GAME_CATALOG.map((game) => (
                <div
                  key={game.id}
                  onClick={() => navigate(`/arena?game=${game.id}`)}
                  className="shrink-0 w-[240px] sm:w-[260px] group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-default/80 bg-surface hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-all duration-200 cursor-pointer"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <img
                      src={game.cover}
                      alt={game.title}
                      loading="lazy"
                      className="h-full w-full object-cover crisp-image group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061536] via-transparent to-transparent" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border backdrop-blur-md bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {game.badge}
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{game.icon}</span>
                        <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                          {game.shortTitle}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {game.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-purple-400 font-bold">
                      <span>Chơi ngay</span>
                      <div className="size-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Cột tiện ích bên phải: 4 cột trên XL (Kéo lên kéo xuống) ── */}
        <div className="xl:col-span-4 space-y-6">
          {/* Tiện ích 1: Bạn bè trực tuyến (Kéo lên kéo xuống) */}
          <section aria-label="Bạn bè trực tuyến" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  Bạn bè trực tuyến ({onlineFriends.length})
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface p-3 shadow-sm">
              {onlineFriends.length > 0 ? (
                <div
                  ref={friendsDrag.ref}
                  {...friendsDrag.events}
                  className="overflow-y-auto max-h-[260px] scrollbar-thin space-y-1.5 pr-1 cursor-grab active:cursor-grabbing select-none touch-pan-y"
                >
                  {onlineFriends.map((f) => {
                    const presence = presenceMap[f.id]
                    const statusText =
                      presence?.activity?.type === 'room'
                        ? 'Đang trong phòng học'
                        : presence?.state === 'away'
                          ? 'Tạm vắng'
                          : 'Đang trực tuyến'
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-surface-raised transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <AnhNguoiDung
                              avatar={f.avatar}
                              ten={f.displayName}
                              className="h-8 w-8 rounded-full border border-sky-400/30"
                            />
                            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border border-[#061536]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                              {f.displayName}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{statusText}</p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenCampusChat({ id: f.id, name: f.displayName })}
                          title="Nhắn tin trực tiếp"
                          className="h-7 w-7 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                        >
                          <MessageSquare className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <Users className="size-7 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Chưa có bạn bè nào đang trực tuyến</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/community')}
                    className="h-7 px-3 text-[11px] rounded-lg border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                  >
                    <span>Tìm bạn học</span>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Tiện ích 2: Trò chuyện sảnh trường (Kéo lên kéo xuống) */}
          <section aria-label="Trò chuyện sảnh trường" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-sky-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  Tin nhắn sảnh trường
                </h2>
              </div>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface p-3 shadow-sm">
              {recentMessagesPreview.length > 0 ? (
                <div
                  ref={messagesDrag.ref}
                  {...messagesDrag.events}
                  className="overflow-y-auto max-h-[280px] scrollbar-thin space-y-2 pr-1 cursor-grab active:cursor-grabbing select-none touch-pan-y"
                >
                  {recentMessagesPreview.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenCampusChat()}
                      className="p-2.5 rounded-xl hover:bg-surface-raised transition-colors cursor-pointer border border-transparent hover:border-sky-500/20"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-bold text-sky-400">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {msg.preview}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">Chưa có tin nhắn mới trong sảnh</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCampusChat()}
                    className="h-7 px-3 text-[11px] rounded-lg border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                  >
                    <span>Mở khung trò chuyện</span>
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Tiện ích 3: Thẻ Bảng xếp hạng thi đua */}
          <section aria-label="Bảng vinh danh" className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-surface to-amber-950/20 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Trophy className="size-4.5" />
              <h3 className="text-sm font-bold text-white">Bảng thi đua & Kỷ lục</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Theo dõi bảng vinh danh học tập, chuỗi ngày chuyên cần và kỷ lục các giải đấu cờ của trường.
            </p>
            <Link
              to={LEADERBOARD_LINK.to}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <span>Xem bảng xếp hạng</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </div>
      </div>

      {/* Dialogs */}
      {phongCanMatKhau && (
        <PasswordRoomDialog
          room={phongCanMatKhau}
          onClose={() => setPhongCanMatKhau(null)}
          onSuccess={(roomId) => {
            setPhongCanMatKhau(null)
            navigate(`/room/phong-${roomId}`)
          }}
        />
      )}

      {moTaoPhong && (
        <CreateStudyRoomDialog
          open={moTaoPhong}
          onOpenChange={setMoTaoPhong}
          onSuccess={(roomId) => {
            setMoTaoPhong(false)
            navigate(`/room/phong-${roomId}`)
          }}
        />
      )}
    </div>
  )
}
