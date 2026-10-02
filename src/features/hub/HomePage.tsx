import { useMemo, useState } from 'react'
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
  const { rooms, socialState, presenceMap, presenceReady, trangThai } = useCampus()

  const friendsDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })

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

      {/* ── VÙNG 1+: Compact Hero + CTA — Zone 1 merged into Zone 1+ ── */}
      <section
        aria-label="Digital Campus"
        className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-[#030d20] shadow-[0_0_48px_rgba(56,189,248,0.10)] min-h-[240px] lg:min-h-[260px] group"
      >
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="/assets/cyber_mockups/home_hero_bg.webp"
            alt=""
            className="h-full w-full object-cover object-center opacity-40 crisp-image group-hover:opacity-50 group-hover:scale-[1.02] transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020c24] via-[#020c24]/80 to-[#04112e]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020c24]/70 to-transparent" />
          {/* Subtle violet accent trên right side */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_right,_rgba(139,92,246,0.18),_transparent)]" />
        </div>

        {/* Content: 2 cột */}
        <div className="relative z-10 h-full flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 lg:p-10">

          {/* Trái: Brand + Headline + CTA khám phá */}
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-0.5 text-[11px] font-bold tracking-widest text-sky-400 mb-3">
              <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>DIGITAL CAMPUS • LỚP 10A7</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.2]">
              Học tập · Kết nối ·{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">Phát triển</span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              Chơi game, kết bạn và học tập hiệu quả — tất cả trong một nơi dành riêng cho lớp 10A7.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                onClick={() => navigate('/learn')}
                className="h-9 px-5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_16px_rgba(56,189,248,0.35)] transition-all cursor-pointer gap-2"
              >
                <BookOpen className="size-3.5" />
                <span>Bắt đầu khám phá</span>
                <ArrowRight className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/arena')}
                className="h-9 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/12 text-white/80 hover:text-white font-semibold text-xs backdrop-blur-sm transition-all cursor-pointer gap-2"
              >
                <Gamepad2 className="size-3.5 text-purple-300" />
                <span>Xem game</span>
              </Button>
            </div>
          </div>

          {/* Phải: CTA Community — compact card */}
          <div className="shrink-0 w-full sm:w-auto sm:max-w-[280px] rounded-2xl border border-violet-500/25 bg-white/5 backdrop-blur-md p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">Cộng đồng</span>
            </div>
            <div>
              <p className="text-sm font-black text-white leading-snug">
                Tham gia Digital Campus
                <br />
                <span className="text-violet-300">ngay hôm nay</span>
              </p>
              <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                Học hiệu quả, chơi game vui cùng hàng ngàn học sinh.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/community')}
              className="h-8 w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs shadow-[0_0_14px_rgba(139,92,246,0.4)] transition-all cursor-pointer gap-1.5"
            >
              <span>Tạo tài khoản miễn phí</span>
              <ArrowRight className="size-3" />
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
