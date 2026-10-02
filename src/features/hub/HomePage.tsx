import { useMemo, useRef, useState } from 'react'
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
import { GAME_CATALOG } from '@/features/games/game-catalog'
import {
  ArrowRight,
  BookOpen,
  Crown,
  Gamepad2,
  MapPin,
  MessageSquare,
  Send,
  Trophy,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

// Vùng 2: Quick Nav — 4 mục, icon glow lớn
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

  const friendsDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })

  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)
  const [quickMsg, setQuickMsg] = useState('')
  const quickInputRef = useRef<HTMLInputElement>(null)

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
      .slice(-8)
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

  const handleQuickSend = () => {
    if (!nguoiDung) { moAuthModal?.('dang_nhap'); return }
    // Mở chat panel — người dùng gửi tin trực tiếp trong panel
    handleOpenCampusChat()
    setQuickMsg('')
  }

  // Vùng 3: Hoạt động nổi bật — dữ liệu thật từ hệ thống
  const hoatDongNoiBat = useMemo(() => {
    const items = []
    // HỌC TẬP: phòng học đang mở (thật) hoặc CTA tạo phòng
    if (activeRoomsPreview[0]) {
      const r = activeRoomsPreview[0]
      items.push({
        tag: 'HỌC TẬP', tagColor: 'bg-sky-500',
        image: '/assets/cyber_mockups/act_study.webp',
        title: r.ten,
        desc: `${r.soNguoi}/${r.sucChua} học sinh đang tham gia`,
        meta: `GV ${r.chuPhongTen}`,
        onClick: () => xuLyVaoPhong(r),
      })
    } else {
      items.push({
        tag: 'HỌC TẬP', tagColor: 'bg-sky-500',
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
    // GAME: từ catalog thật
    const g = GAME_CATALOG[0]
    if (g) {
      items.push({
        tag: 'GAME', tagColor: 'bg-purple-500',
        image: g.cover,
        title: `Digital Campus Cup · ${g.shortTitle}`,
        desc: g.description,
        meta: '1v1 & Đấu AI',
        onClick: () => navigate(`/arena?game=${g.id}`),
      })
    }
    // CỘNG ĐỒNG: dữ liệu presence thật
    items.push({
      tag: 'CỘNG ĐỒNG', tagColor: 'bg-emerald-500',
      image: '/assets/cyber_mockups/act_community.webp',
      title: 'Ngày hội Kết nối lớp 10A7',
      desc: onlineFriends.length > 0 ? `${onlineFriends.length} bạn học đang trực tuyến` : 'Kết nối và trao đổi cùng cả lớp',
      meta: 'Digital Campus · Online',
      onClick: () => navigate('/community'),
    })
    return items
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            Cùng nhau học tập, chơi game, kết nối bạn bè và phát triển kỹ năng để tạo nên một cộng đồng học sinh mạnh mẽ hơn.
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

      {/* ── VÙNG 1+: CTA Community (trái) + Tin nhắn nhanh (phải) ── */}
      <section aria-label="Cộng đồng và tin nhắn nhanh" className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Trái: CTA Community với Crown */}
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-[#1a0533] via-[#160840] to-[#0d1a40] p-6 flex flex-col justify-between gap-4 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top_left,_rgba(139,92,246,1),_transparent_55%)]" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,1),_transparent_55%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="size-5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">Cộng đồng Digital Campus</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
              Tham gia cộng đồng Digital Campus
              <br />
              <span className="text-violet-300">ngay hôm nay</span>
            </h2>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Học hiệu quả hơn, chơi game vui hơn và kết nối bạn bè cùng hàng ngàn học sinh trong toàn quốc.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate('/community')}
            className="relative z-10 h-11 w-full sm:w-auto rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.45)] transition-all cursor-pointer gap-2"
          >
            <span>Tạo tài khoản miễn phí</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* Phải: Tin nhắn nhanh */}
        <div className="rounded-2xl border border-border-default/80 bg-surface shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
            <MessageSquare className="size-4 text-brand" />
            <h2 className="text-sm font-bold text-text-primary">Tin nhắn nhanh</h2>
            <span className="ml-auto text-[11px] text-text-tertiary">Sảnh lớp 10A7</span>
          </div>

          {/* Recent messages (real data) */}
          <div className="flex-1 overflow-y-auto max-h-[160px] divide-y divide-border-subtle">
            {recentMessagesPreview.length > 0 ? (
              recentMessagesPreview.slice(0, 4).map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleOpenCampusChat()}
                  className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-brand text-[10px] font-bold mt-0.5">
                    {msg.sender.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-bold text-brand truncate">{msg.sender}</span>
                      <span className="text-[10px] text-text-tertiary shrink-0">{msg.time}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-1">{msg.preview}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8 text-xs text-text-tertiary">
                Chưa có tin nhắn. Hãy gửi lời chào đầu tiên!
              </div>
            )}
          </div>

          {/* Quick input */}
          <div className="border-t border-border-subtle p-3 flex gap-2 items-center">
            <input
              ref={quickInputRef}
              type="text"
              value={quickMsg}
              onChange={(e) => setQuickMsg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickSend()}
              onFocus={() => { if (!nguoiDung) { moAuthModal?.('dang_nhap') } }}
              placeholder={nguoiDung ? 'Nhắn gì đó cho cả lớp...' : 'Đăng nhập để nhắn tin...'}
              className="flex-1 h-8 px-3 rounded-lg bg-surface-raised border border-border-default/60 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand/60 transition-colors"
            />
            <Button
              size="icon-sm"
              onClick={handleQuickSend}
              title="Mở chat và gửi"
              className="h-8 w-8 rounded-lg bg-brand hover:bg-brand/90 text-white shrink-0 cursor-pointer"
            >
              <Send className="size-3.5" />
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
            ))}
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
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-default/80 cursor-pointer text-left transition-all duration-200 hover:border-white/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover crisp-image group-hover:scale-105 transition-transform duration-400"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                    <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase text-white ${item.tagColor} shadow-sm`}>
                      {item.tag}
                    </span>
                  </div>
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
            <div className="rounded-2xl border border-border-default/80 bg-surface shadow-sm overflow-hidden">
              {onlineFriends.length > 0 ? (
                <div
                  ref={friendsDrag.ref}
                  {...friendsDrag.events}
                  className="overflow-y-auto max-h-[240px] scrollbar-thin cursor-grab active:cursor-grabbing select-none touch-pan-y divide-y divide-border-subtle"
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

          {/* 5c: Bảng thi đua & Kỷ lục */}
          <section aria-label="Bảng thi đua" className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-surface to-amber-950/15 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3 border-b border-amber-500/15">
              <Trophy className="size-4 text-amber-400" />
              <h3 className="text-xs font-bold text-text-primary">Bảng thi đua &amp; Kỷ lục lớp</h3>
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
    </div>
  )
}
