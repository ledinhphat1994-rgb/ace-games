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
  Calendar,
  Crown,
  DoorOpen,
  Gamepad2,
  MapPin,
  MessageSquare,
  Plus,
  Trophy,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

const LEADERBOARD_LINK = { to: '/leaderboard', label: 'Bảng xếp hạng' }

// Vùng 2: Quick Nav config với hub images và glow colors
const QUICK_NAV = [
  {
    to: '/learn',
    Icon: BookOpen,
    label: 'Học tập',
    desc: 'Kiến thức hôm nay\nkiến tạo tương lai',
    hubImg: '/assets/cyber_mockups/hub_learn.webp',
    iconBg: 'bg-sky-500',
    glow: 'shadow-[0_0_24px_rgba(56,189,248,0.55)]',
    border: 'border-sky-500/30',
    hover: 'hover:border-sky-400/70',
    accent: 'text-sky-400',
  },
  {
    to: '/arena',
    Icon: Gamepad2,
    label: 'Game',
    desc: 'Chơi để phát triển\nnăng tầm trải nghiệm',
    hubImg: '/assets/cyber_mockups/hub_game.webp',
    iconBg: 'bg-purple-500',
    glow: 'shadow-[0_0_24px_rgba(168,85,247,0.55)]',
    border: 'border-purple-500/30',
    hover: 'hover:border-purple-400/70',
    accent: 'text-purple-400',
  },
  {
    to: '/community',
    Icon: Users,
    label: 'Cộng đồng',
    desc: 'Kết nối bạn bè\ncùng nhau tiến bộ',
    hubImg: '/assets/cyber_mockups/hub_community.webp',
    iconBg: 'bg-emerald-500',
    glow: 'shadow-[0_0_24px_rgba(16,185,129,0.55)]',
    border: 'border-emerald-500/30',
    hover: 'hover:border-emerald-400/70',
    accent: 'text-emerald-400',
  },
  {
    to: '/leaderboard',
    Icon: Trophy,
    label: 'Bảng xếp hạng',
    desc: 'Tôn vinh nỗ lực\nlan tỏa cảm hứng',
    hubImg: '/assets/cyber_mockups/hub_leaderboard.webp',
    iconBg: 'bg-amber-500',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.55)]',
    border: 'border-amber-500/30',
    hover: 'hover:border-amber-400/70',
    accent: 'text-amber-400',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const { rooms, socialState, presenceMap, presenceReady, trangThai, messages } = useCampus()

  const roomsDrag = useDragScroll<HTMLDivElement>({ direction: 'horizontal' })
  const friendsDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })
  const messagesDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })

  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)

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

  const activeRoomsPreview = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const friendsA = roomFriendsMap.get(a.id)?.length ?? 0
      const friendsB = roomFriendsMap.get(b.id)?.length ?? 0
      if (friendsA !== friendsB) return friendsB - friendsA
      return b.soNguoi - a.soNguoi
    })
  }, [rooms, roomFriendsMap])

  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const p = presenceMap[f.id]
      return p && (p.state === 'online' || p.state === 'away')
    })
  }, [friends, presenceMap])

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

  // Vùng 3: Hoạt động nổi bật — dùng dữ liệu thật từ hệ thống
  const hoatDongNoiBat = useMemo(() => {
    const items = []
    // HỌC TẬP: phòng học đang mở (nếu có)
    if (activeRoomsPreview[0]) {
      const r = activeRoomsPreview[0]
      items.push({
        tag: 'HỌC TẬP',
        tagColor: 'bg-sky-500',
        image: '/assets/cyber_mockups/act_study.webp',
        title: r.ten,
        desc: `${r.soNguoi}/${r.sucChua} học sinh đang tham gia`,
        meta: `GV ${r.chuPhongTen}`,
        onClick: () => xuLyVaoPhong(r),
      })
    } else {
      items.push({
        tag: 'HỌC TẬP',
        tagColor: 'bg-sky-500',
        image: '/assets/cyber_mockups/act_study.webp',
        title: 'Mở phòng học nhóm',
        desc: 'Tạo phòng học để cùng bạn bè trao đổi bài vở',
        meta: 'Nhấn để tạo phòng',
        onClick: () => {
          if (!nguoiDung) { moAuthModal('dang_nhap'); return }
          setMoTaoPhong(true)
        },
      })
    }
    // GAME: trò chơi đặc sắc từ catalog thật
    const featuredGame = GAME_CATALOG[0]
    if (featuredGame) {
      items.push({
        tag: 'GAME',
        tagColor: 'bg-purple-500',
        image: featuredGame.cover,
        title: `Digital Campus Cup · ${featuredGame.shortTitle}`,
        desc: featuredGame.description,
        meta: '1v1 & Đấu AI',
        onClick: () => navigate(`/arena?game=${featuredGame.id}`),
      })
    }
    // CỘNG ĐỒNG: dùng dữ liệu presence thật
    items.push({
      tag: 'CỘNG ĐỒNG',
      tagColor: 'bg-emerald-500',
      image: '/assets/cyber_mockups/act_community.webp',
      title: 'Ngày hội Kết nối lớp 10A7',
      desc: `${onlineFriends.length > 0 ? `${onlineFriends.length} bạn học đang trực tuyến` : 'Kết nối và trao đổi cùng cả lớp'}`,
      meta: 'Digital Campus · Online',
      onClick: () => navigate('/community'),
    })
    return items
  }, [activeRoomsPreview, onlineFriends, nguoiDung, navigate])

  return (
    <div className="pb-12 space-y-6">

      {/* ── VÙNG 1: Full-Width Cyber Hero Banner ── */}
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

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Học tập · Kết nối
            <br />
            Chơi game · Phát triển
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
              Tất cả trong một nơi.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Cùng nhau học tập, chơi game, kết nối bạn bè và phát triển kỹ năng để tạo nên một cộng đồng học sinh, sinh viên mạnh mẽ hơn.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <Button
              size="lg"
              onClick={() => navigate('/learn')}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer gap-2"
            >
              <BookOpen className="size-4" />
              <span>Bắt đầu khám phá</span>
              <ArrowRight className="size-3.5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/arena')}
              className="h-11 px-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer gap-2"
            >
              <Gamepad2 className="size-4 text-purple-300" />
              <span>Xem video giới thiệu</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ── VÙNG 2: Quick Nav Cards — 4 mục trong container chung ── */}
      <section aria-label="Điều hướng nhanh">
        <div className="rounded-2xl border border-border-default/60 bg-surface shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border-subtle">
            {QUICK_NAV.map(({ to, Icon, label, desc, hubImg, iconBg, glow, border, hover, accent }) => (
              <button
                key={to}
                type="button"
                onClick={() => navigate(to)}
                className={`group relative flex flex-col items-center gap-4 py-7 px-5 text-center cursor-pointer transition-all duration-200 hover:bg-surface-raised ${hover}`}
              >
                {/* Hub image background (subtle) */}
                {hubImg && (
                  <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                    <img src={hubImg} alt="" className="h-full w-full object-cover" />
                  </div>
                )}

                {/* Large glowing icon */}
                <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${iconBg} ${glow} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="size-8 text-white" />
                </div>

                {/* Label + description */}
                <div className="relative min-w-0">
                  <p className={`text-sm font-bold ${accent} leading-tight`}>{label}</p>
                  <p className="mt-1 text-[11px] text-text-tertiary leading-relaxed whitespace-pre-line">{desc}</p>
                </div>

                {/* Arrow */}
                <div className={`relative flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised border ${border} transition-all duration-200 group-hover:scale-110`}>
                  <ArrowRight className={`size-3.5 ${accent}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bố cục 2 cột: Vùng 3+4 (8 col) + Vùng 5 (4 col) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* ── VÙNG 3+4: Khu vực chính — 8 cột ── */}
        <div className="xl:col-span-8 space-y-7 min-w-0">

          {/* ── VÙNG 3a: Phòng học trực tuyến (carousel ngang) ── */}
          <section aria-label="Phòng học trực tuyến" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Phòng học trực tuyến
                </h2>
                <span className="text-xs text-text-tertiary font-mono">({activeRoomsPreview.length} phòng)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!nguoiDung) { moAuthModal('dang_nhap'); return }
                  setMoTaoPhong(true)
                }}
                className="h-8 gap-1.5 text-xs font-semibold border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo phòng</span>
              </Button>
            </div>

            {activeRoomsPreview.length > 0 ? (
              <div ref={roomsDrag.ref} {...roomsDrag.events} className="smooth-carousel gap-4 pb-3 pt-1 scrollbar-none">
                {activeRoomsPreview.map((room) => (
                  <div key={room.id} className="shrink-0 w-[290px] sm:w-[330px]">
                    <RoomCard room={room} friends={roomFriendsMap.get(room.id)} onVaoPhong={xuLyVaoPhong} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border-default/80 bg-surface p-8 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
                  <DoorOpen className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">Chưa có phòng học nào đang mở</p>
                  <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                    Bạn có thể tự tạo phòng học nhóm để cùng bạn bè trao đổi bài vở.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    if (!nguoiDung) { moAuthModal('dang_nhap'); return }
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

          {/* ── VÙNG 3b: Hoạt động nổi bật ── */}
          <section aria-label="Hoạt động nổi bật" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Hoạt động nổi bật
                </h2>
              </div>
              <Link
                to="/learn"
                className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand/80 transition-colors"
              >
                Xem tất cả
                <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {hoatDongNoiBat.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={item.onClick}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default/80 cursor-pointer text-left transition-all duration-200 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
                >
                  {/* Image background */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover crisp-image group-hover:scale-105 transition-transform duration-400"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    {/* Category tag */}
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${item.tagColor} shadow-sm`}>
                      {item.tag}
                    </span>
                  </div>

                  {/* Card content */}
                  <div className="flex flex-col flex-1 gap-2 p-4 bg-surface">
                    <h3 className="text-sm font-bold text-text-primary line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">{item.desc}</p>
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-border-subtle">
                      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                        <MapPin className="size-3" />
                        <span>{item.meta}</span>
                      </div>
                      <ArrowRight className="size-3.5 text-text-tertiary group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── VÙNG 4: CTA Community Banner với Crown ── */}
          <section
            aria-label="Tham gia cộng đồng"
            className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-[#1a0533] via-[#160840] to-[#0d1a40] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,1),_transparent_50%)]" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,1),_transparent_50%)]" />

            <div className="relative z-10 min-w-0">
              {/* Crown icon */}
              <div className="flex items-center gap-2 mb-3">
                <Crown className="size-5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Cộng đồng Digital Campus</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                Tham gia cộng đồng Digital Campus
                <br />
                <span className="text-violet-300">ngay hôm nay</span>
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
                Học hiệu quả hơn, chơi game vui hơn và kết nối bạn bè cùng hàng ngàn học sinh, sinh viên trong toàn quốc.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => navigate('/community')}
              className="relative z-10 shrink-0 h-11 px-6 rounded-xl bg-gradient-to-r from-brand to-violet-600 hover:from-sky-400 hover:to-violet-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all cursor-pointer gap-2 whitespace-nowrap"
            >
              <span>Tạo tài khoản miễn phí</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </section>
        </div>

        {/* ── VÙNG 5: Right Panel ── */}
        <div className="xl:col-span-4 space-y-5 self-start">

          {/* Vùng 5a: Bạn bè đang online */}
          <section aria-label="Bạn bè đang online" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-sm font-bold text-text-primary">Bạn bè đang online</h2>
              </div>
              <Link to="/community" className="flex items-center gap-0.5 text-[11px] font-semibold text-brand hover:text-brand/80">
                Xem tất cả <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="rounded-2xl border border-border-default/80 bg-surface shadow-sm overflow-hidden">
              {onlineFriends.length > 0 ? (
                <div
                  ref={friendsDrag.ref}
                  {...friendsDrag.events}
                  className="overflow-y-auto max-h-[260px] scrollbar-thin cursor-grab active:cursor-grabbing select-none touch-pan-y divide-y divide-border-subtle"
                >
                  {onlineFriends.map((f) => {
                    const presence = presenceMap[f.id]
                    const statusText =
                      presence?.activity?.type === 'room' ? 'Đang trong phòng học'
                      : presence?.state === 'away' ? 'Tạm vắng'
                      : 'Đang trực tuyến'
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-2.5 px-4 py-3 hover:bg-surface-raised transition-colors group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            <AnhNguoiDung avatar={f.avatar} ten={f.displayName} className="h-8 w-8 rounded-full" />
                            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-surface" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">{f.displayName}</p>
                            <p className="text-[11px] text-text-tertiary truncate">{statusText}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenCampusChat({ id: f.id, name: f.displayName })}
                          title="Nhắn tin trực tiếp"
                          className="h-7 w-7 text-text-tertiary hover:text-brand hover:bg-brand/10 cursor-pointer"
                        >
                          <MessageSquare className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2 px-4">
                  <Users className="size-7 text-text-tertiary mx-auto" />
                  <p className="text-xs text-text-secondary">Chưa có bạn bè nào đang trực tuyến</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/community')} className="h-7 px-3 text-[11px] rounded-lg border-brand/30 bg-brand/10 text-brand hover:bg-brand/20">
                    Tìm bạn học
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Vùng 5b: Trò chuyện gần đây */}
          <section aria-label="Trò chuyện gần đây" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-3.5 text-brand" />
                <h2 className="text-sm font-bold text-text-primary">Trò chuyện gần đây</h2>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCampusChat()}
                className="flex items-center gap-0.5 text-[11px] font-semibold text-brand hover:text-brand/80"
              >
                Xem tất cả <ArrowRight className="size-3" />
              </button>
            </div>
            <div className="rounded-2xl border border-border-default/80 bg-surface shadow-sm overflow-hidden">
              {recentMessagesPreview.length > 0 ? (
                <div
                  ref={messagesDrag.ref}
                  {...messagesDrag.events}
                  className="overflow-y-auto max-h-[240px] scrollbar-thin cursor-grab active:cursor-grabbing select-none touch-pan-y divide-y divide-border-subtle"
                >
                  {recentMessagesPreview.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenCampusChat()}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-surface-raised transition-colors cursor-pointer"
                    >
                      <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand/15 border border-brand/20 text-brand mt-0.5">
                        <MessageSquare className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-brand truncate">{msg.sender}</span>
                          <span className="text-[10px] text-text-tertiary shrink-0 ml-2">{msg.time}</span>
                        </div>
                        <p className="text-[11px] text-text-secondary line-clamp-1 leading-relaxed">{msg.preview}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2 px-4">
                  <MessageSquare className="size-7 text-text-tertiary mx-auto" />
                  <p className="text-xs text-text-secondary">Chưa có tin nhắn nào trong sảnh</p>
                  <Button variant="outline" size="sm" onClick={() => handleOpenCampusChat()} className="h-7 px-3 text-[11px] rounded-lg border-brand/30 bg-brand/10 text-brand hover:bg-brand/20">
                    Mở sảnh trò chuyện
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Vùng 5c: Sự kiện sắp diễn ra */}
          <section aria-label="Sự kiện sắp diễn ra" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-violet-400" />
                <h2 className="text-sm font-bold text-text-primary">Sự kiện sắp diễn ra</h2>
              </div>
              <Link to="/community" className="flex items-center gap-0.5 text-[11px] font-semibold text-brand hover:text-brand/80">
                Xem tất cả <ArrowRight className="size-3" />
              </Link>
            </div>
            {/* Bảng xếp hạng nhanh thay cho sự kiện (không có events API) */}
            <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-surface to-amber-950/15 overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-amber-500/15">
                <Trophy className="size-4 text-amber-400" />
                <h3 className="text-xs font-bold text-text-primary">Bảng thi đua &amp; Kỷ lục lớp</h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Theo dõi bảng vinh danh học tập, chuỗi ngày chuyên cần và kỷ lục các giải đấu cờ của trường.
                </p>
                <Link
                  to={LEADERBOARD_LINK.to}
                  className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors group"
                >
                  <span>Xem bảng xếp hạng</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
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
