import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Crown,
  Flame,
  Gamepad2,
  MessageCircle,
  MessageSquare,
  Play,
  Plus,
  Sparkles,
  Trophy,
  Users,
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

  // Fallback demo online friends when user has no added friends yet
  const displayOnlineFriends = useMemo(() => {
    if (onlineFriends.length > 0) {
      return onlineFriends.map((f) => ({
        id: f.id,
        name: f.displayName,
        avatar: f.avatar,
        status: presenceMap[f.id]?.activity?.type === 'room' ? 'Đang học bài' : 'Đang trực tuyến',
      }))
    }
    return [
      { id: 101, name: 'Trần Khánh Vy', avatar: null, status: 'Đang học • 2 phút trước' },
      { id: 102, name: 'Lê Hoàng Duy', avatar: null, status: 'Đang chơi Valorant' },
      { id: 103, name: 'Phạm Quỳnh Anh', avatar: null, status: 'Đang hoạt động' },
      { id: 104, name: 'Đỗ Minh Khoa', avatar: null, status: 'Đang học • 12 phút trước' },
      { id: 105, name: 'Nguyễn Hoàng Anh', avatar: null, status: 'Đang online' },
    ]
  }, [onlineFriends, presenceMap])

  // Recent messages preview
  const recentMessagesPreview = useMemo(() => {
    if (messages.length > 0) {
      return messages.slice(-3).reverse().map((m) => ({
        id: m.id,
        sender: m.ten,
        preview: m.noiDung,
        time: new Date(m.taoLuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        badge: 1,
      }))
    }
    return [
      { id: 1, sender: 'Nhóm Lớp 10A7', preview: 'Lê Hoàng: Mai nhớ nộp bài nha!', time: '10:24', badge: 3 },
      { id: 2, sender: 'Trần Mai', preview: 'Bạn: Oke, cảm ơn nhé!', time: '09:18', badge: 1 },
      { id: 3, sender: 'Câu lạc bộ Game DC', preview: 'Nguyễn Minh: Tối nay solo cờ vua nhé!', time: 'Hôm qua', badge: 12 },
    ]
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

  // 4 glowing Hub Cards matching E:\phát\hình thiết kế web
  const hubCards = [
    {
      to: '/learn',
      title: 'Học tập',
      subtitle: 'Kiến thức hôm nay kiến tạo tương lai',
      icon: BookOpen,
      cropImg: '/assets/cyber_mockups/hub_learn.webp',
      glowColor: 'hover:border-sky-500/60 hover:shadow-[0_0_24px_rgba(56,189,248,0.25)]',
      iconBg: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
    },
    {
      to: '/arena',
      title: 'Game',
      subtitle: 'Chơi để phát triển nâng tầm trải nghiệm',
      icon: Gamepad2,
      cropImg: '/assets/cyber_mockups/hub_game.webp',
      glowColor: 'hover:border-purple-500/60 hover:shadow-[0_0_24px_rgba(168,85,247,0.25)]',
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    },
    {
      to: '/community',
      title: 'Cộng đồng',
      subtitle: 'Kết nối bạn bè cùng nhau tiến bộ',
      icon: Users,
      cropImg: '/assets/cyber_mockups/hub_community.webp',
      glowColor: 'hover:border-emerald-500/60 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    },
    {
      to: '/leaderboard',
      title: 'Bảng xếp hạng',
      subtitle: 'Tôn vinh nỗ lực lan tỏa cảm hứng',
      icon: Trophy,
      cropImg: '/assets/cyber_mockups/hub_leaderboard.webp',
      glowColor: 'hover:border-amber-500/60 hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    },
  ]

  // 3 Featured Activities matching E:\phát\hình thiết kế web
  const featuredActivities = [
    {
      id: 1,
      badge: 'HỌC TẬP',
      badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      title: 'Chuỗi workshop kỹ năng học tập',
      desc: 'Phương pháp học hiệu quả cho mùa thi',
      date: 'Thứ 7, 19/10/2024 • Online',
      img: '/assets/cyber_mockups/act_study.webp',
      to: '/learn',
    },
    {
      id: 2,
      badge: 'GAME',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      title: 'Digital Campus Cup 2024',
      desc: 'Giải đấu game lớn nhất dành cho học sinh',
      date: '01 - 20/11/2024 • Online',
      img: '/assets/cyber_mockups/act_game.webp',
      to: '/arena',
    },
    {
      id: 3,
      badge: 'CỘNG ĐỒNG',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      title: 'Ngày hội Kết nối sinh viên mới',
      desc: 'Gặp gỡ, giao lưu và mở rộng mối quan hệ',
      date: '25/10/2024 • Đại học Quốc gia',
      img: '/assets/cyber_mockups/act_community.webp',
      to: '/community',
    },
  ]

  // Upcoming Events timeline
  const upcomingEvents = [
    {
      dateNumber: '15',
      month: 'Th10',
      title: 'Lớp Toán nâng cao',
      time: '08:00 - 09:30 • Phòng A1.02',
      icon: BookOpen,
      color: 'text-sky-400',
    },
    {
      dateNumber: '17',
      month: 'Th10',
      title: 'Workshop AI cho học sinh',
      time: '13:30 - 15:00 • Online',
      icon: Sparkles,
      color: 'text-purple-400',
    },
    {
      dateNumber: '20',
      month: 'Th10',
      title: 'Digital Campus Cup 2024',
      time: 'Cả ngày • Online',
      icon: Gamepad2,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="pb-12">
      {/* ── Main 3-Column Layout (Sidebar is on the left in AppShell) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Center Area: 8 Columns on XL ── */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 1. Hero Grand Hall Banner */}
          <section
            aria-label="Lời chào và giới thiệu"
            className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-[#0b1220] shadow-[0_0_40px_rgba(56,189,248,0.08)] group"
          >
            {/* Background Artwork */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src="/assets/cyber_mockups/home_hero_bg.webp"
                alt="Digital Campus Hero"
                className="h-full w-full object-cover object-right opacity-40 dark:opacity-45 scale-100 group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 p-6 sm:p-9 lg:p-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-400 mb-4 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
                <span>DIGITAL CAMPUS • {displayName}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.25]">
                Học tập • Kết nối
                <br />
                Chơi game • Phát triển
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
                  Tất cả trong một nơi.
                </span>
              </h1>

              <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
                Cùng nhau học tập, chơi game, kết nối bạn bè và phát triển kỹ năng để tạo nên một cộng đồng học sinh,
                sinh viên mạnh mẽ hơn.
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <Button
                  size="lg"
                  onClick={() => navigate('/learn')}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer"
                >
                  <span>Bắt đầu khám phá</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/learn')}
                  className="h-11 px-5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer gap-2"
                >
                  <Play className="h-4 w-4 fill-white text-white" />
                  <span>Xem video giới thiệu</span>
                </Button>
              </div>
            </div>
          </section>

          {/* 2. Four Hub Cards */}
          <section aria-label="Các khu vực chính" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            {hubCards.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className={cn(
                    'group relative flex flex-col justify-between p-4 rounded-2xl border border-border-default/70 bg-[#0f172a] hover:bg-[#152037] transition-all duration-200 cursor-pointer shadow-sm overflow-hidden',
                    card.glowColor,
                  )}
                >
                  {/* Top Bar with Icon & Circular Arrow */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-xl border shadow-xs transition-transform duration-200 group-hover:scale-105',
                        card.iconBg,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-slate-300 group-hover:text-white group-hover:bg-brand group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="relative z-10">
                    <h2 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                      {card.title}
                    </h2>
                    <p className="mt-1 text-[11px] sm:text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {card.subtitle}
                    </p>
                  </div>
                </Link>
              )
            })}
          </section>

          {/* 3. Hoạt động nổi bật (3 Cards) */}
          <section aria-label="Hoạt động nổi bật" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
                <h2 className="text-lg font-bold text-text-primary tracking-tight">Hoạt động nổi bật</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {featuredActivities.map((act) => (
                <Link
                  key={act.id}
                  to={act.to}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default/70 bg-[#0f172a] hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.18)] transition-all duration-200 cursor-pointer"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <img
                      src={act.img}
                      alt={act.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                    <span
                      className={cn(
                        'absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border backdrop-blur-md',
                        act.badgeClass,
                      )}
                    >
                      {act.badge}
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-1">
                        {act.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">{act.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{act.date}</span>
                      <div className="size-6 rounded-full bg-white/10 flex items-center justify-center text-slate-300 group-hover:text-white group-hover:bg-brand transition-colors">
                        <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 4. Live Study Rooms (If rooms are active) */}
          {activeRoomsPreview.length > 0 && (
            <section aria-label="Phòng học đang mở" className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-base sm:text-lg font-bold text-text-primary">Phòng học đang mở</h2>
                  <span className="text-xs text-text-secondary font-mono">({rooms.length})</span>
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
                    <span>Vào sảnh</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

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
            </section>
          )}

          {/* 5. Community Callout Banner */}
          <section className="relative overflow-hidden rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-900 p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 shrink-0 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                <Crown className="size-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Tham gia cộng đồng Digital Campus ngay hôm nay
                </h3>
                <p className="mt-0.5 text-xs text-slate-300 leading-relaxed">
                  Học tập hiệu quả hơn, chơi game vui hơn và kết nối cùng hàng ngàn học sinh, sinh viên trên toàn quốc.
                </p>
              </div>
            </div>

            <Button
              onClick={() => (nguoiDung ? handleOpenCampusChat() : moAuthModal?.('dang_ky'))}
              className="shrink-0 h-10 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>{nguoiDung ? 'Mở sảnh trò chuyện' : 'Tạo tài khoản miễn phí'}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </section>
        </div>

        {/* ── Right Area: 4 Columns on XL (Sidebar Widgets) ── */}
        <div className="xl:col-span-4 space-y-6">
          {/* Widget 1: Bạn bè đang online */}
          <section aria-label="Bạn bè đang online" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  Bạn bè đang online ({displayOnlineFriends.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/community?tab=friends')}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-2">
              {displayOnlineFriends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <AnhNguoiDung
                        avatar={f.avatar}
                        ten={f.name}
                        className="h-9 w-9 rounded-full border border-sky-400/30"
                      />
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f172a]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-sky-400 transition-colors">
                        {f.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{f.status}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenCampusChat({ id: f.id, name: f.name })}
                    aria-label={`Nhắn tin cho ${f.name}`}
                    className="size-7 rounded-lg bg-white/5 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <MessageCircle className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Widget 2: Trò chuyện gần đây */}
          <section aria-label="Trò chuyện gần đây" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Trò chuyện gần đây</h2>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCampusChat()}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-2">
              {recentMessagesPreview.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => handleOpenCampusChat()}
                  className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {msg.sender.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                        {msg.sender}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 truncate mt-0.5">{msg.preview}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">{msg.time}</span>
                    {msg.badge && (
                      <span className="size-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {msg.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Widget 3: Sự kiện sắp diễn ra */}
          <section aria-label="Sự kiện sắp diễn ra" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Sự kiện sắp diễn ra</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-2.5">
              {upcomingEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  onClick={() => navigate('/community')}
                >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-11 rounded-xl bg-slate-800/80 border border-white/5 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-black text-white leading-none">{evt.dateNumber}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{evt.month}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                          {evt.title}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{evt.time}</p>
                      </div>
                    </div>

                    <ArrowRight className="size-3.5 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                )
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
