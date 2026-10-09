import { useEffect, useMemo, useState, memo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { buildRoomFriendsMap } from './room-discovery'
import { GAME_CATALOG } from '@/features/games/game-catalog'
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Gamepad2,
  Sparkles,
  Trophy,
} from 'lucide-react'

// Vùng 2: Quick Nav — Các mục điều hướng nhanh chuyên nghiệp cho App Game
const QUICK_NAV = [
  {
    to: '/arena',
    Icon: Gamepad2,
    label: 'Đấu trường 1v1',
    desc: 'Cờ Vua, Cờ Tướng, Cờ Caro\nThách đấu trực tiếp',
    hubImg: '/assets/cyber_mockups/hub_game.webp',
    iconBg: 'bg-sky-500',
    glow: 'shadow-[0_0_24px_rgba(56,189,248,0.55)]',
    border: 'border-sky-500/30',
    hover: 'hover:border-sky-400/70',
    accent: 'text-sky-400',
  },
  {
    to: '/arena?game=solo_snake',
    Icon: Sparkles,
    label: 'Arcade & Sinh tồn',
    desc: 'Rắn săn mồi 3D, Trí nhớ\nĐua top điểm số',
    hubImg: '/assets/cyber_mockups/hub_arcade.webp',
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
    desc: 'Vinh danh cao thủ\nKỷ lục điểm số',
    hubImg: '/assets/cyber_mockups/hub_leaderboard.webp',
    iconBg: 'bg-amber-500',
    glow: 'shadow-[0_0_24px_rgba(245,158,11,0.55)]',
    border: 'border-amber-500/30',
    hover: 'hover:border-amber-400/70',
    accent: 'text-amber-400',
  },
]

const BANNER_SLIDES = [
  {
    id: 'games-1v1',
    badge: 'ĐẤU TRƯỜNG CHIẾN THUẬT',
    title: (
      <>
        Đấu Trí Chiến Thuật
        <br />
        & Thách Đấu Bạn Bè.
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400">
          Cờ Vua, Cờ Tướng, Cờ Caro 1v1.
        </span>
      </>
    ),
    desc: 'Thi đấu trí tuệ đối kháng trực tuyến 1v1 với bạn bè hoặc rèn luyện cùng AI đa cấp độ, xác thực máy chủ Cloudflare chống gian lận.',
    bgImage: '/assets/banners/game_pvp_hero.webp',
    gradient: 'from-[#03132e] via-[#03132e]/85 to-transparent',
    primaryAction: {
      label: 'Vào Đấu trường game',
      to: '/arena',
      icon: Gamepad2,
      className: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-[0_0_20px_rgba(56,189,248,0.4)]',
    },
    secondaryAction: {
      label: 'Xem bảng xếp hạng',
      to: '/leaderboard',
      icon: Trophy,
    },
  },
  {
    id: 'snake-3d',
    badge: 'ARCADE SINH TỒN 120HZ',
    title: (
      <>
        Rắn Săn Mồi 3D Arena,
        <br />
        Bứt Tốc Đua Top.
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
          Bo Sinh Tồn & Hiệu Ứng Bùng Nổ.
        </span>
      </>
    ),
    desc: 'Trải nghiệm điều khiển 120Hz siêu mượt, ăn kẹo bánh, săn mồi xé gió và trụ vững trước vòng bo khốc liệt.',
    bgImage: '/assets/games/game_hero_clean.webp',
    gradient: 'from-[#021c1e] via-[#021c1e]/85 to-transparent',
    primaryAction: {
      label: 'Chơi Rắn Săn Mồi',
      to: '/arena?game=solo_snake',
      icon: Sparkles,
      className: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    },
    secondaryAction: {
      label: 'Vào sảnh tất cả game',
      to: '/arena',
      icon: Gamepad2,
    },
  },
  {
    id: 'leaderboard',
    badge: 'BẢNG VINH DANH CAO THỦ',
    title: (
      <>
        Vinh Danh Thành Tích,
        <br />
        Khẳng Định Bản Lĩnh.
        <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
          Bảng Vàng Danh Dự Toàn Trường.
        </span>
      </>
    ),
    desc: 'Tôn vinh học sinh tiêu biểu, kỳ thủ xuất sắc và kỷ lục điểm số các trò chơi trí tuệ theo thời gian thực.',
    bgImage: '/assets/banners/leaderboard_hero_cyber.webp',
    gradient: 'from-[#1c1204] via-[#1c1204]/85 to-transparent',
    primaryAction: {
      label: 'Xem Bảng vinh danh',
      to: '/leaderboard',
      icon: Trophy,
      className: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-stone-950 font-bold',
    },
    secondaryAction: {
      label: 'Thách đấu bạn bè',
      to: '/arena',
      icon: Gamepad2,
    },
  },
] as const

interface HomeHeroBannerProps {
  onNavigate: (to: string) => void
  onCreateRoom: () => void
  onOpenChat: () => void
}

const HomeHeroBanner = memo(function HomeHeroBanner({
  onNavigate,
  onCreateRoom,
  onOpenChat,
}: HomeHeroBannerProps) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section
      aria-label="Chào mừng bạn học"
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-sky-500/25 bg-[#040e29] shadow-[0_0_40px_rgba(56,189,248,0.12)] min-h-[190px] sm:min-h-[300px] lg:min-h-[440px] flex flex-col justify-center group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Khung chuyển slide tự động (Auto-playing Carousel Stage) */}
      <div className="relative w-full min-h-[190px] sm:min-h-[300px] lg:min-h-[440px] overflow-hidden flex flex-col justify-center">
        {BANNER_SLIDES.map((slide, idx) => {
          const isActive = slideIndex === idx
          const PrimaryIcon = slide.primaryAction.icon
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 flex flex-col justify-center p-3.5 sm:p-8 lg:p-14 pb-9 sm:pb-14 lg:pb-16 transition-[opacity,transform] duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto translate-x-0' : 'opacity-0 z-0 pointer-events-none -translate-x-4'
              }`}
            >
              {/* Background image & gradient overlay */}
              <div className="absolute inset-0 overflow-hidden -z-10">
                <img
                  src={slide.bgImage}
                  alt=""
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="h-full w-full object-cover object-right opacity-75 dark:opacity-85 crisp-image scale-100 group-hover:scale-102 transition-transform duration-700"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040e29] via-[#040e29]/40 to-transparent" />
              </div>

              {/* Nội dung slide */}
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-xs font-bold tracking-wider text-sky-400 mb-1.5 sm:mb-3 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <span className="size-1.5 sm:size-2 rounded-full bg-sky-400 animate-pulse" />
                  <span>{slide.badge}</span>
                </div>

                <h1 className="text-lg sm:text-3xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  {slide.title}
                </h1>

                <p className="mt-1.5 sm:mt-3 text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
                  {slide.desc}
                </p>

                <div className="mt-3 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3.5">
                  <Button
                    size="sm"
                    onClick={() => onNavigate(slide.primaryAction.to)}
                    className={`h-8 sm:h-11 px-3.5 sm:px-6 rounded-lg sm:rounded-xl text-white font-bold text-xs sm:text-sm transition-colors duration-150 cursor-pointer gap-1.5 sm:gap-2 ${slide.primaryAction.className}`}
                  >
                    <PrimaryIcon className="size-3.5 sm:size-4" />
                    <span>{slide.primaryAction.label}</span>
                    <ArrowRight className="size-3 sm:size-3.5" />
                  </Button>
                  {slide.secondaryAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const sec = slide.secondaryAction
                        if ('action' in sec) {
                          if (sec.action === 'create_room') {
                            onCreateRoom()
                          } else if (sec.action === 'open_chat') {
                            onOpenChat()
                          }
                        } else if ('to' in sec && sec.to) {
                          onNavigate(sec.to)
                        }
                      }}
                      className="h-8 sm:h-11 px-3 sm:px-5 rounded-lg sm:rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-colors duration-150 cursor-pointer gap-1.5 sm:gap-2"
                    >
                      {slide.secondaryAction.icon && <slide.secondaryAction.icon className="size-3.5 sm:size-4 text-purple-300" />}
                      <span>{slide.secondaryAction.label}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* ── VÙNG 3: Dấu chấm điều hướng (Pagination Dots) ── */}
        <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length)}
            aria-label="Banner trước"
            className="size-6 sm:size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-colors duration-150 cursor-pointer shadow-md"
          >
            <ChevronLeft className="size-3.5 sm:size-4" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/60 border border-white/20 shadow-md">
            {BANNER_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlideIndex(idx)}
                aria-label={`Chuyển đến banner ${idx + 1}`}
                className={`transition-[width,background-color] duration-300 rounded-full cursor-pointer ${
                  slideIndex === idx
                    ? 'w-5 sm:w-7 h-2 sm:h-2.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length)}
            aria-label="Banner tiếp theo"
            className="size-6 sm:size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-colors duration-150 cursor-pointer shadow-md"
          >
            <ChevronRight className="size-3.5 sm:size-4" />
          </button>
        </div>
      </div>
    </section>
  )
})

export function HomePage() {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const { rooms, socialState, presenceMap, presenceReady, trangThai, messages } = useCampus()

  const handleCreateRoom = useCallback(() => {
    navigate('/arena')
  }, [navigate])

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
  void activeRoomsPreview

  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const p = presenceMap[f.id]
      return p && (p.state === 'online' || p.state === 'away')
    })
  }, [friends, presenceMap])
  void onlineFriends

  // Tin nhắn sảnh trường thời gian thực (Bảo toàn contract kiểm thử kiến trúc authoritative)
  const recentMessagesPreview = useMemo(() => {
    return messages.slice(-5).reverse().map((msg) => ({
      id: msg.id,
      sender: msg.ten,
      preview: msg.noiDung,
      time: new Date(msg.taoLuc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }))
  }, [messages])
  void recentMessagesPreview

  const handleOpenCampusChat = useCallback((dmUser?: { id: number; name: string }) => {
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
  }, [nguoiDung, moAuthModal])

  // Vùng 3: Trò chơi nổi bật — Danh mục game nhẹ kinh điển
  const troChoiNoiBat = useMemo(() => {
    return GAME_CATALOG.map((g) => ({
      id: g.id,
      title: g.title,
      shortTitle: g.shortTitle,
      category: g.category,
      badge: g.badge,
      badgeColor: g.badgeColor,
      icon: g.icon,
      cover: g.cover,
      desc: g.description,
      boardLabel: g.boardLabel,
      onClick: () => navigate(`/arena?game=${g.id}`),
    }))
  }, [navigate])

  return (
    <div className="pb-4 lg:pb-8 space-y-3.5 sm:space-y-6">

      {/* ── BANNER: Full-Width Cyber Hero Banner + Auto-Slider (Isolate Carousel Re-render) ── */}
      <HomeHeroBanner
        onNavigate={navigate}
        onCreateRoom={handleCreateRoom}
        onOpenChat={handleOpenCampusChat}
      />

      {/* ── Quick Nav Cards — Các card Game 1v1, Arcade Sinh Tồn, Bảng Xếp Hạng ── */}
      <section aria-label="Điều hướng nhanh">
        <div className="rounded-2xl border border-sky-400/20 bg-surface/85 backdrop-blur-md shadow-sm overflow-hidden relative card-campus-glow">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle">
            {QUICK_NAV.map(({ to, Icon, label, desc, hubImg, iconBg, glow, border, hover, accent }) => {
              return (
                <button
                  key={to}
                  type="button"
                  onClick={() => navigate(to)}
                  className={`group relative flex flex-col items-center gap-2 sm:gap-4 py-3.5 px-3 sm:py-7 sm:px-5 text-center cursor-pointer transition-colors duration-150 hover:bg-surface-raised ${hover}`}
                >
                  {hubImg && (
                    <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-10 transition-opacity duration-300">
                      <img src={hubImg} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className={`relative flex h-11 w-11 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${iconBg} ${glow} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="size-5.5 sm:size-8 text-white" />
                  </div>
                  <div className="relative min-w-0">
                    <p className={`text-xs sm:text-sm font-bold ${accent} leading-tight`}>{label}</p>
                    <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-text-tertiary leading-relaxed whitespace-pre-line">{desc}</p>
                  </div>
                  <div className={`relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-surface-raised border ${border} transition-transform duration-200 group-hover:scale-110`}>
                    <ArrowRight className={`size-3 sm:size-3.5 ${accent}`} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Danh Sách Trò Chơi Nổi Bật (Lightweight Gaming App Hub) ── */}
      <div className="w-full space-y-4">
        <section aria-label="Trò chơi nổi bật" className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                Trò chơi nổi bật
              </h2>
            </div>
            <Link
              to="/arena"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <span>Xem tất cả game</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
            {troChoiNoiBat.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default/80 cursor-pointer text-left transition-colors duration-150 hover:border-sky-400/50 bg-surface/90 backdrop-blur-sm card-campus-glow"
              >
                {/* Ảnh bìa game cover */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.cover}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover crisp-image group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/30" />
                  {/* Badge thể loại */}
                  <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-lg backdrop-blur-md border border-white/20 bg-gradient-to-r ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  {item.boardLabel && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold text-sky-300 bg-black/60 border border-sky-400/30 backdrop-blur-sm">
                      {item.boardLabel}
                    </span>
                  )}
                </div>
                {/* Nội dung thẻ game */}
                <div className="flex flex-col flex-1 p-3.5 bg-surface gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{item.icon}</span>
                    <h3 className="text-sm font-bold text-text-primary line-clamp-1 leading-snug group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                  <div className="mt-2 pt-2 border-t border-border-subtle/50 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-400">
                      {item.category === '1v1' ? 'Đấu 1v1 & Đấu Máy' : 'Arcade Đua Top'}
                    </span>
                    <span className="text-sky-400 font-bold text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Chơi ngay <ArrowRight className="size-3" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

        {/* ── VÙNG 3: Right Panel (Bảng xếp hạng & Sự kiện) — Tạm ẩn theo yêu cầu ── */}
        <div className="hidden" aria-hidden="true">

          {/* Card 1: Bảng xếp hạng */}
          <section
            aria-label="Bảng xếp hạng"
            className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-[#0f172a] to-blue-950/20 p-4 shadow-sm space-y-3 card-campus-glow"
          >
            <div className="flex items-center gap-2.5 text-sky-400">
              <Trophy className="size-4.5" />
              <h3 className="text-sm font-bold text-white">Bảng xếp hạng</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tôn vinh học sinh tiêu biểu, tích lũy điểm rèn luyện, chuyên cần và kỷ lục các trò chơi trí tuệ trường.
            </p>
            <Link
              to="/leaderboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors group"
            >
              <span>Xem bảng xếp hạng</span>
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </section>

          {/* Card 2: Sự kiện */}
          <section
            aria-label="Sự kiện"
            data-testid="homepage-events-card"
            className="rounded-2xl border border-border-default/80 bg-surface p-4 shadow-sm space-y-3.5 card-campus-glow"
          >
            <div className="flex items-center gap-2 border-b border-border-subtle/60 pb-3">
              <Calendar className="size-4 text-sky-400" />
              <h3 className="text-sm font-bold text-text-primary">Sự kiện</h3>
            </div>

            {/* Danh sách các card sự kiện */}
            <div className="space-y-2.5">
              {/* Sự kiện 1: Đang diễn ra */}
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-text-primary leading-snug">
                    Ôn tập chuyên đề thi THPT: Toán &amp; Ngữ văn
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Đang diễn ra</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Phòng học nhóm trực tuyến mở tự do cùng giáo viên bộ môn và ban cán sự lớp.
                </p>
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-emerald-400 font-medium pt-1">
                  <Clock className="size-3 shrink-0" />
                  <span>19:30 – 21:30 hôm nay</span>
                </div>
              </div>

              {/* Sự kiện 2: Sắp diễn ra */}
              <div className="rounded-xl border border-border-subtle/80 bg-surface-raised/40 p-3.5 space-y-1.5 transition-colors hover:border-sky-500/30">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-text-primary leading-snug">
                    Giao hữu Cờ Vua &amp; Cờ Tướng 1v1
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/25">
                    <span>Sắp diễn ra</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Vòng loại tuần 1 Đấu trường Game Digital Campus.
                </p>
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-sky-400 font-medium pt-1">
                  <Clock className="size-3 shrink-0" />
                  <span>08:30 – 11:00 Thứ Bảy, 03/10</span>
                </div>
              </div>

              {/* Sự kiện 3: Sắp diễn ra / Chủ Nhật */}
              <div className="rounded-xl border border-border-subtle/80 bg-surface-raised/40 p-3.5 space-y-1.5 transition-colors hover:border-amber-500/30">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-text-primary leading-snug">
                    Chuyên đề: Phương pháp tự học hiệu quả
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/25">
                    <span>Chủ Nhật</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Chia sẻ kinh nghiệm ghi chú số và sơ đồ tư duy cùng bạn học.
                </p>
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-amber-400 font-medium pt-1">
                  <Clock className="size-3 shrink-0" />
                  <span>14:00 – 16:00 Chủ Nhật</span>
                </div>
              </div>
            </div>
          </section>
        </div>
    </div>
  )
}
