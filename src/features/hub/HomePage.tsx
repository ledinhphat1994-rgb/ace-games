import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { useDragScroll } from '@/hooks/use-drag-scroll'
import { Button } from '@/components/ui/button'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { GAME_CATALOG } from '@/features/games/game-catalog'
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  MessageSquare,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatFriendArea } from '@/features/hub/social-semantics'

// Vùng 2: Quick Nav — 4 mục điều hướng nhanh tích hợp trong banner
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
    desc: 'Chơi để phát triển\nnâng tầm trải nghiệm',
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

  const friendsDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })

  const [slideIndex, setSlideIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)

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

  // Tin nhắn sảnh trường thời gian thực
  const recentMessagesPreview = useMemo(() => {
    return messages.slice(-5).reverse().map((msg) => ({
      id: msg.id,
      sender: msg.ten,
      preview: msg.noiDung,
      time: new Date(msg.taoLuc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }))
  }, [messages])

  // Danh sách các Slide tự chạy cho VÙNG 1
  const bannerSlides = useMemo(() => [
    {
      id: 'overview',
      badge: nguoiDung?.ten ? `DIGITAL CAMPUS • ${nguoiDung.ten.toUpperCase()}` : 'DIGITAL CAMPUS • GDTX ĐỊNH QUÁN',
      title: (
        <>
          Học tập · Kết nối
          <br />
          Chơi game · Phát triển
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
            Tất cả trong một nơi.
          </span>
        </>
      ),
      desc: 'Cùng nhau học tập, chơi game, kết nối bạn bè và phát triển kỹ năng để tạo nên một cộng đồng học sinh mạnh mẽ hơn.',
      bgImage: '/assets/cyber_mockups/home_hero_bg.webp',
      gradient: 'from-[#020c24] via-[#020c24]/85 to-transparent',
      primaryAction: {
        label: 'Bắt đầu khám phá',
        to: '/learn',
        icon: BookOpen,
        className: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_0_20px_rgba(56,189,248,0.4)]',
      },
      secondaryAction: {
        label: 'Xem đấu trường game',
        to: '/arena',
        icon: Gamepad2,
      },
    },
    {
      id: 'learning',
      badge: 'PHÒNG HỌC TRỰC TUYẾN • GDTX ĐỊNH QUÁN',
      title: (
        <>
          Khám phá tri thức,
          <br />
          kiến tạo tương lai.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
            Học nhóm & Tương tác trực tiếp.
          </span>
        </>
      ),
      desc: 'Không gian học nhóm tương tác với bảng vẽ trực tiếp, tài liệu ôn thi chuẩn SGK và video bài giảng đồng bộ cùng bạn học.',
      bgImage: '/assets/cyber_mockups/classroom_hero_bg.webp',
      gradient: 'from-[#03132e] via-[#03132e]/85 to-transparent',
      primaryAction: {
        label: 'Vào sảnh học tập',
        to: '/learn',
        icon: BookOpen,
        className: 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      },
      secondaryAction: {
        label: 'Tạo phòng học mới',
        action: 'create_room' as const,
        icon: Sparkles,
      },
    },
    {
      id: 'games',
      badge: 'ĐẤU TRƯỜNG TRÒ CHƠI • DIGITAL CAMPUS',
      title: (
        <>
          Đấu Trí Chiến Thuật
          <br />
          & Thử Thách Trí Tuệ.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400">
            Cờ Vua, Cờ Tướng, Cờ Caro 1v1.
          </span>
        </>
      ),
      desc: 'Thi đấu trí tuệ đối kháng trực tuyến 1v1 với bạn bè hoặc rèn luyện cùng AI đa cấp độ, xác thực máy chủ Cloudflare chống gian lận.',
      bgImage: '/assets/cyber_mockups/game_hero_bg.webp',
      gradient: 'from-[#14062a] via-[#14062a]/85 to-transparent',
      primaryAction: {
        label: 'Vào Đấu trường game',
        to: '/arena',
        icon: Gamepad2,
        className: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
      },
      secondaryAction: {
        label: 'Xem bảng xếp hạng',
        to: '/leaderboard',
        icon: Trophy,
      },
    },
    {
      id: 'community',
      badge: 'CỘNG ĐỒNG HỌC SINH • GDTX ĐỊNH QUÁN',
      title: (
        <>
          Kết nối bạn bè,
          <br />
          cùng nhau tiến bộ.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
            Chia sẻ bài viết & Trò chuyện tức thì.
          </span>
        </>
      ),
      desc: 'Không gian kết nối trao đổi trực tuyến — theo dõi bạn học đang online, trò chuyện kênh trường và tham gia cộng đồng sôi nổi.',
      bgImage: '/assets/cyber_mockups/community_hero_bg.webp',
      gradient: 'from-[#031d1a] via-[#031d1a]/85 to-transparent',
      primaryAction: {
        label: 'Khám phá cộng đồng',
        to: '/community',
        icon: Users,
        className: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
      },
      secondaryAction: {
        label: 'Kênh trò chuyện trường',
        action: 'open_chat' as const,
        icon: MessageSquare,
      },
    },
  ], [nguoiDung])

  // Cơ chế tự chạy Banner (Carousel Auto-play 4.5s) — Dừng khi hover chuột (Pause on hover)
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % bannerSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, bannerSlides.length])

  const xuLyVaoPhong = (room: PhongSanh) => {
    if (room.soNguoi >= room.sucChua) {
      toast.error('Phòng học đã đầy')
      return
    }
    if (room.coMatKhau) {
      setPhongCanMatKhau(room)
      return
    }
    navigate(`/room/phong-${room.id}`)
  }

  const handleOpenCampusChat = (dmUser?: { id: number; name: string }) => {
    if (!nguoiDung) { moAuthModal?.('dang_nhap'); return }
    if (dmUser) {
      window.dispatchEvent(
        new CustomEvent('campus:open-dm', {
          detail: { id: dmUser.id, displayName: dmUser.name, username: `user_${dmUser.id}`, avatar: null, role: 'student' },
        }),
      )
    } else {
      window.dispatchEvent(new CustomEvent('campus:open-chat'))
    }
  }

  // Vùng 3: Hoạt động nổi bật — dữ liệu thật từ hệ thống
  const hoatDongNoiBat = useMemo(() => {
    const items = []
    // HỌC TẬP: phòng học đang mở (thật) hoặc CTA tạo phòng
    if (activeRoomsPreview[0]) {
      const r = activeRoomsPreview[0]
      items.push({
        tag: 'HỌC TẬP', tagColor: 'bg-sky-500',
        image: '/assets/learning/room_study.webp',
        title: r.ten,
        desc: `${r.soNguoi}/${r.sucChua} học sinh đang tham gia`,
        meta: `GV ${r.chuPhongTen}`,
        onClick: () => xuLyVaoPhong(r),
      })
    } else {
      items.push({
        tag: 'HỌC TẬP', tagColor: 'bg-sky-500',
        image: '/assets/learning/room_study.webp',
        title: 'Mở phòng học nhóm',
        desc: 'Tạo phòng học để cùng bạn bè trao đổi bài vở và tài liệu ôn thi',
        meta: 'Nhấn để tạo phòng',
        onClick: () => {
          if (!nguoiDung) { moAuthModal('dang_nhap'); return }
          setMoTaoPhong(true)
        },
      })
    }
    // GAME: từ catalog thật
    const g = GAME_CATALOG[0]
    if (g) {
      items.push({
        tag: 'GAME', tagColor: 'bg-purple-500',
        image: '/assets/games/cover_chess.webp',
        title: `Đấu trường trí tuệ · ${g.shortTitle}`,
        desc: 'Thi đấu trí tuệ đối kháng trực tuyến 1v1 hoặc rèn luyện cùng AI',
        meta: '1v1 & Đấu AI',
        onClick: () => navigate(`/arena?game=${g.id}`),
      })
    }
    // CỘNG ĐỒNG: dữ liệu presence thật
    items.push({
      tag: 'CỘNG ĐỒNG', tagColor: 'bg-emerald-500',
      image: '/assets/community/community_hero.webp',
      title: 'Ngày hội Kết nối bạn học',
      desc: onlineFriends.length > 0 ? `${onlineFriends.length} bạn học đang trực tuyến` : 'Không gian kết nối và trao đổi cùng bạn bè toàn trường',
      meta: 'Digital Campus · Online',
      onClick: () => navigate('/community'),
    })
    return items
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomsPreview, onlineFriends, nguoiDung, navigate])

  return (
    <div className="pb-12 space-y-6">

      {/* ── BANNER: Full-Width Cyber Hero Banner + Auto-Slider ── */}
      <section
        aria-label="Chào mừng bạn học"
        className="relative overflow-hidden rounded-3xl border border-sky-500/25 bg-[#040e29] shadow-[0_0_40px_rgba(56,189,248,0.12)] min-h-[440px] lg:min-h-[480px] flex flex-col justify-center group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Khung chuyển slide tự động (Auto-playing Carousel Stage) */}
        <div className="relative w-full min-h-[440px] lg:min-h-[480px] overflow-hidden flex flex-col justify-center">
          {bannerSlides.map((slide, idx) => {
            const isActive = slideIndex === idx
            const PrimaryIcon = slide.primaryAction.icon
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 flex flex-col justify-center p-8 sm:p-12 lg:p-16 pb-16 sm:pb-18 lg:pb-18 transition-all duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto translate-x-0' : 'opacity-0 z-0 pointer-events-none -translate-x-4'
                }`}
              >
                {/* Background image & gradient overlay */}
                <div className="absolute inset-0 overflow-hidden -z-10">
                  <img
                    src={slide.bgImage}
                    alt=""
                    className="h-full w-full object-cover object-right opacity-75 dark:opacity-85 crisp-image scale-100 group-hover:scale-102 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040e29] via-[#040e29]/40 to-transparent" />
                </div>

                {/* Nội dung slide */}
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-400 mb-3 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                    <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
                    <span>{slide.badge}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                    {slide.title}
                  </h1>

                  <p className="mt-3.5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                    {slide.desc}
                  </p>

                  <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3.5">
                    <Button
                      size="lg"
                      onClick={() => navigate(slide.primaryAction.to)}
                      className={`h-11 px-6 rounded-xl text-white font-bold text-sm transition-all cursor-pointer gap-2 ${slide.primaryAction.className}`}
                    >
                      <PrimaryIcon className="size-4" />
                      <span>{slide.primaryAction.label}</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                    {slide.secondaryAction && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          if (slide.secondaryAction.action === 'create_room') {
                            if (!nguoiDung) { moAuthModal('dang_nhap'); return }
                            setMoTaoPhong(true)
                          } else if (slide.secondaryAction.action === 'open_chat') {
                            handleOpenCampusChat()
                          } else if (slide.secondaryAction.to) {
                            navigate(slide.secondaryAction.to)
                          }
                        }}
                        className="h-11 px-5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer gap-2"
                      >
                        {slide.secondaryAction.icon && <slide.secondaryAction.icon className="size-4 text-purple-300" />}
                        <span>{slide.secondaryAction.label}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* ── VÙNG 3: Dấu chấm điều hướng (Pagination Dots) — SÁT CHÍNH GIỮA CẠNH DƯỚI CỦA BANNER ── */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSlideIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
              aria-label="Banner trước"
              className="size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-md"
            >
              <ChevronLeft className="size-4" />
            </button>

            {/* Mấy dấu chấm chuyển banner tự động */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
              {bannerSlides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  aria-label={`Chuyển đến banner ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    slideIndex === idx
                      ? 'w-7 h-2.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]'
                      : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSlideIndex((prev) => (prev + 1) % bannerSlides.length)}
              aria-label="Banner tiếp theo"
              className="size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-md"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Quick Nav Cards — 4 card Học tập, Game, Cộng đồng, Bảng xếp hạng ── */}
      <section aria-label="Điều hướng nhanh">
        <div className="rounded-2xl border border-sky-400/20 bg-surface/85 backdrop-blur-md shadow-sm overflow-hidden relative">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border-subtle">
            {QUICK_NAV.map(({ to, Icon, label, desc, hubImg, iconBg, glow, border, hover, accent }, idx) => {
              const isCurrentSlide = slideIndex === idx
              return (
                <button
                  key={to}
                  type="button"
                  onClick={() => navigate(to)}
                  className={`group relative flex flex-col items-center gap-4 py-7 px-5 text-center cursor-pointer transition-all duration-200 hover:bg-surface-raised ${
                    isCurrentSlide ? 'bg-surface-raised/40' : ''
                  } ${hover}`}
                >
                  {hubImg && (
                    <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                      <img src={hubImg} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${iconBg} ${glow} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="size-8 text-white" />
                  </div>
                  <div className="relative min-w-0">
                    <p className={`text-sm font-bold ${accent} leading-tight`}>{label}</p>
                    <p className="mt-1 text-[11px] text-text-tertiary leading-relaxed whitespace-pre-line">{desc}</p>
                  </div>
                  <div className={`relative flex h-7 w-7 items-center justify-center rounded-full bg-surface-raised border ${border} transition-all duration-200 group-hover:scale-110`}>
                    <ArrowRight className={`size-3.5 ${accent}`} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Bố cục 2 cột: Vùng 3 (8 col) + Vùng 5 (4 col) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

        {/* ── VÙNG 3: Hoạt động nổi bật — 8 cột ── */}
        <div className="xl:col-span-8 min-w-0">
          <section aria-label="Hoạt động nổi bật" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                Hoạt động nổi bật
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {hoatDongNoiBat.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={item.onClick}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default/80 cursor-pointer text-left transition-colors duration-150 hover:border-brand/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-surface/90 backdrop-blur-sm"
                >
                  {/* Ảnh bìa + Vùng 2: Badge được fix chuẩn, tinh tế, không trùng lặp */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover crisp-image group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />
                    {/* Vùng 2: Huy hiệu danh mục sắc nét, thiết kế pill bo tròn hiện đại */}
                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md border border-white/20 ${item.tagColor}`}>
                      {item.tag}
                    </span>
                  </div>
                  {/* Nội dung thẻ (Đã xóa toàn bộ Vùng X thừa thãi theo yêu cầu) */}
                  <div className="flex flex-col flex-1 p-4 bg-surface gap-1.5">
                    <h3 className="text-sm font-bold text-text-primary line-clamp-1 leading-snug group-hover:text-brand transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ── VÙNG 5: Right Panel — 4 cột ── */}
        <div className="xl:col-span-4 space-y-5 self-start">

          {/* 5a: Bạn bè đang online (không có "Xem tất cả" - dùng sidebar /community) */}
          <section aria-label="Bạn bè đang online" className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold text-text-primary">Bạn bè đang online</h2>
              {onlineFriends.length > 0 && (
                <span className="ml-auto text-[11px] font-bold text-emerald-400">{onlineFriends.length} online</span>
              )}
            </div>
            <div className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm shadow-sm overflow-hidden">
              {onlineFriends.length > 0 ? (
                <div
                  ref={friendsDrag.ref}
                  {...friendsDrag.events}
                  className="overflow-y-auto max-h-[240px] scrollbar-thin cursor-grab active:cursor-grabbing select-none touch-pan-y divide-y divide-border-subtle"
                >
                  {onlineFriends.map((f) => {
                    const presence = presenceMap[f.id]
                    const statusText = formatFriendArea(presence, true)
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-2.5 px-4 py-3 hover:bg-surface-raised transition-colors group">
                        <button
                          type="button"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setNguoiXem({
                              id: f.id,
                              ten: f.displayName,
                              avatar: f.avatar,
                              lopTen: f.lopTen,
                              anchorRect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom },
                            })
                          }}
                          className="flex items-center gap-3 min-w-0 text-left cursor-pointer group/friend-btn focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand rounded-lg"
                          aria-label={`Xem thông tin ${f.displayName}`}
                          title={`Xem thông tin ${f.displayName}`}
                        >
                          <div className="relative shrink-0">
                            <AnhNguoiDung avatar={f.avatar} ten={f.displayName} className="h-8 w-8 rounded-full group-hover/friend-btn:ring-2 group-hover/friend-btn:ring-brand/40 transition-all" />
                            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-surface" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate group-hover/friend-btn:text-brand transition-colors">{f.displayName}</p>
                            <p className="text-[11px] text-text-tertiary truncate">{statusText}</p>
                          </div>
                        </button>
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

          {/* 5b: Tin nhắn sảnh trường */}
          <section aria-label="Tin nhắn sảnh trường" className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-sky-400" />
              <h2 className="text-sm font-bold text-text-primary">Tin nhắn sảnh trường</h2>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm p-3 shadow-sm">
              {recentMessagesPreview.length > 0 ? (
                <div className="overflow-y-auto max-h-[220px] scrollbar-thin space-y-2 pr-1">
                  {recentMessagesPreview.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => handleOpenCampusChat()}
                      className="p-2.5 rounded-xl hover:bg-surface-raised transition-colors cursor-pointer border border-transparent hover:border-sky-500/20"
                    >
                      <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-1">
                        <span className="font-bold text-sky-400">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {msg.preview}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-text-tertiary">Chưa có tin nhắn mới trong sảnh</p>
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

          {/* 5c: Bảng thi đua & Kỷ lục */}
          <section aria-label="Bảng thi đua" className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-surface to-amber-950/15 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-amber-500/15">
              <Trophy className="size-4 text-amber-400" />
              <h3 className="text-xs font-bold text-text-primary">Bảng thi đua &amp; Kỷ lục trường</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Theo dõi bảng vinh danh học tập, chuỗi ngày chuyên cần và kỷ lục các giải đấu cờ của trường.
              </p>
              <Link
                to="/leaderboard"
                className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors group"
              >
                <span>Xem bảng xếp hạng</span>
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
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
      <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />
    </div>
  )
}
