import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { FriendsDrawer } from '@/components/social/FriendsDrawer'
import { LiveDot, PageHeader } from '@/components/layout/PageHeader'
import { cn, getInitials } from '@/lib/utils'
import {
  derivePresenceView,
  formatLastSeen,
} from '@/features/hub/social-semantics'
import type { FriendItem } from '@shared/protocol/social'
import { CampusFeed } from './CampusFeed'
import { GameArenaLeaderboard } from '@/features/games/GameArenaLeaderboard'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  DoorOpen,
  MessageSquare,
  RefreshCw,
  Search,
  TrendingUp,
  Trophy,
  UserPlus,
} from 'lucide-react'


type TrangThaiBan = 'online' | 'away' | 'room' | 'offline' | 'unknown'

export function CommunityPage() {
  const navigate = useNavigate()
  const {
    socialState,
    socialStatus,
    socialError,
    retrySocialLoad,
    presenceMap,
    presenceReady,
    trangThai,
  } = useCampus()

  const [rankingOpen, setRankingOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)
  const moHoSo = (friend: FriendItem, anchorRect: DOMRect) => {
    setNguoiXem({ id: friend.id, ten: friend.displayName, avatar: friend.avatar, lopTen: friend.lopTen, vaiTro: friend.role, anchorRect })
  }
  const [drawerDefaultTab, setDrawerDefaultTab] = useState<'friends' | 'requests' | 'search'>('friends')

  const openDrawerTab = (tab: 'friends' | 'requests' | 'search') => {
    setDrawerDefaultTab(tab)
    setDrawerOpen(true)
  }

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const incomingRequests = useMemo(
    () => socialState?.incomingRequests ?? [],
    [socialState?.incomingRequests],
  )

  const presenceView = useMemo(() => {
    return derivePresenceView({
      friends,
      presenceMap,
      presenceReady,
      connectionStatus: trangThai,
    })
  }, [friends, presenceMap, presenceReady, trangThai])

  const totalActive = presenceView.totalActive
  const coDuLieu = socialStatus === 'ready' || socialStatus === 'degraded'

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
  }

  const moTaTrucTiep =
    trangThai === 'dang_ket_noi' || trangThai === 'mat_ket_noi' ? (
      <span className="inline-flex items-center gap-2 text-warning">
        <LiveDot tone="warning" />
        Đang kết nối lại sảnh cộng đồng…
      </span>
    ) : !presenceReady ? (
      <span className="inline-flex items-center gap-2">
        <LiveDot tone="muted" />
        Đang đồng bộ hoạt động bạn bè…
      </span>
    ) : totalActive > 0 ? (
      <span className="inline-flex items-center gap-2">
        <LiveDot tone="success" />
        <span>
          <span className="font-semibold text-text-primary tabular-nums">{totalActive}</span> bạn bè đang hoạt động
        </span>
      </span>
    ) : (
      'Kết nối với bạn học trong trường — xem ai đang trực tuyến và vào phòng học cùng nhau.'
    )

  const tenNguoiMoi = incomingRequests
    .map((r) => r.sender?.displayName)
    .filter((ten): ten is string => Boolean(ten))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cộng đồng"
        description={moTaTrucTiep}
        actions={
          <>
            <Button
              variant="outline"
              data-testid="community-find-friends-cta"
              onClick={() => openDrawerTab('search')}
            >
              <Search className="text-social" />
              <span>Tìm bạn học</span>
            </Button>
            <Button data-testid="community-open-chat-cta" onClick={handleOpenChat}>
              <MessageSquare />
              <span>Trò chuyện trường</span>
            </Button>
            <Button variant="ghost" size="icon-lg" aria-label="Bảng xếp hạng" onClick={() => setRankingOpen(true)}><Trophy className="size-4" /></Button>
          </>
        }
      />

      {coDuLieu && incomingRequests.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-social/25 bg-social-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-social/15 text-social">
              <UserPlus className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {incomingRequests.length} lời mời kết bạn đang chờ bạn
              </p>
              {tenNguoiMoi.length > 0 && (
                <p className="text-[0.8125rem] break-words text-text-secondary">
                  {tenNguoiMoi.length <= 2
                    ? tenNguoiMoi.join(', ')
                    : `${tenNguoiMoi.slice(0, 2).join(', ')} và ${tenNguoiMoi.length - 2} người khác`}
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            data-testid="community-pending-requests-cta"
            onClick={() => openDrawerTab('requests')}
            className="shrink-0"
          >
            Xem lời mời
          </Button>
        </div>
      )}

      {socialStatus === 'degraded' && (
        <div
          data-testid="community-degraded-banner"
          className="flex flex-col gap-3 rounded-2xl border border-warning/25 bg-warning-muted/50 p-4 text-[0.8125rem] sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-2.5 text-text-secondary">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <span>Danh sách bạn bè có thể chưa mới nhất do sự cố kết nối máy chủ.</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            data-testid="community-degraded-retry-btn"
            onClick={() => void retrySocialLoad()}
            className="shrink-0"
          >
            <RefreshCw />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <CampusFeed />
        <div className="min-w-0 space-y-5">
          {/* STATE A: đang tải */}
          {socialStatus === 'loading' && (
            <div
              data-testid="community-loading"
              aria-busy="true"
              aria-label="Đang tải danh sách bạn bè"
              className="overflow-hidden rounded-2xl border border-border-subtle bg-surface"
            >
              <div className="border-b border-border-subtle px-4 py-3">
                <div className="h-3.5 w-28 animate-pulse rounded bg-surface-overlay" />
              </div>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0">
                  <div className="size-9 animate-pulse rounded-full bg-surface-overlay" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 animate-pulse rounded bg-surface-overlay" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-surface-overlay/70" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATE B: lỗi tải */}
          {socialStatus === 'error' && (
            <div
              data-testid="community-error"
              className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-surface px-6 py-10 text-center"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
                <AlertCircle className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-text-primary">Không tải được danh sách bạn bè</h2>
              <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-text-secondary">
                {socialError || 'Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng kiểm tra đường truyền mạng.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                data-testid="community-retry-btn"
                onClick={() => void retrySocialLoad()}
                className="mt-5"
              >
                <RefreshCw />
                <span>Thử lại</span>
              </Button>
            </div>
          )}

          {/* STATE C: danh bạ trống (đã xác thực) */}
          {coDuLieu && friends.length === 0 && (
            <div
              data-testid="community-empty"
              className="flex min-h-[256px] flex-col items-center justify-center rounded-2xl border border-border-default bg-surface px-4 py-8 text-center"
            >
              <HinhBanBe />
              <h2 className="mt-5 text-lg font-semibold tracking-tight text-text-primary">Chưa có bạn bè trong danh bạ</h2>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-secondary">
                Tìm bạn cùng lớp hoặc trong trường để thấy ai đang trực tuyến và vào phòng học cùng nhau.
              </p>
            </div>
          )}

          {/* STATE D: có bạn bè */}
          {coDuLieu && friends.length > 0 && (
            <>
              {presenceView.freshness === 'stale' && (
                <p
                  data-testid="presence-disconnected-banner"
                  className="flex items-center gap-2.5 text-[0.8125rem] text-warning"
                >
                  <LiveDot tone="warning" />
                  Trạng thái trực tuyến đang kết nối lại…
                </p>
              )}
              {presenceView.freshness === 'unknown' && (
                <p
                  data-testid="presence-unknown-banner"
                  className="flex items-center gap-2.5 text-[0.8125rem] text-text-secondary"
                >
                  <LiveDot tone="muted" />
                  Đang tải trạng thái trực tuyến của bạn bè…
                </p>
              )}

              {/* Chưa xác thực được presence: không bao giờ đoán trực tuyến / ngoại tuyến / trong phòng */}
              {presenceView.freshness !== 'ready' && (
                <NhomBanBe
                  testId="friends-unconfirmed-list"
                  title="Bạn bè"
                  count={friends.length}
                  hint={presenceView.freshness === 'stale' ? 'Mất kết nối' : 'Đang tải trạng thái'}
                >
                  {friends.map((friend) => (
                    <DongBanBe
                      key={friend.id}
                      testId={`friend-unconfirmed-${friend.username}`}
                      friend={friend}
                      onXem={moHoSo}
                      trangThai="unknown"
                      meta={`@${friend.username}${friend.lopTen ? ` · ${friend.lopTen}` : ''}`}
                    />
                  ))}
                </NhomBanBe>
              )}

              {presenceView.freshness === 'ready' && presenceView.inRoom.length > 0 && (
                <NhomBanBe title="Đang trong phòng học" count={presenceView.inRoom.length}>
                  {presenceView.inRoom.map(({ friend, roomId, roomTitle }) => (
                    <DongBanBe
                      key={friend.id}
                      testId={`friend-in-room-${friend.username}`}
                      friend={friend}
                      onXem={moHoSo}
                      trangThai="room"
                      meta={
                        <>
                          <span className="text-social">{roomTitle || 'Phòng học'}</span>
                          {friend.lopTen ? ` · ${friend.lopTen}` : ''}
                        </>
                      }
                      action={
                        <Button
                          size="xs"
                          data-testid={`join-room-btn-${friend.username}`}
                          onClick={() => navigate(`/room/phong-${roomId}`)}
                          className="min-h-11 shrink-0 whitespace-normal text-sm"
                        >
                          <DoorOpen />
                          <span>Vào phòng</span>
                        </Button>
                      }
                    />
                  ))}
                </NhomBanBe>
              )}

              {presenceView.freshness === 'ready' && presenceView.online.length > 0 && (
                <NhomBanBe title="Đang trực tuyến" count={presenceView.online.length}>
                  {presenceView.online.map(({ friend, isAway }) => (
                    <DongBanBe
                      key={friend.id}
                      testId={`friend-online-${friend.username}`}
                      friend={friend}
                      onXem={moHoSo}
                      trangThai={isAway ? 'away' : 'online'}
                      meta={`@${friend.username}${friend.lopTen ? ` · ${friend.lopTen}` : ''}`}
                      action={
                        <span className={cn('shrink-0 text-xs font-medium', isAway ? 'text-warning' : 'text-success')}>
                          {isAway ? 'Tạm vắng' : 'Trực tuyến'}
                        </span>
                      }
                    />
                  ))}
                </NhomBanBe>
              )}

              {presenceView.freshness === 'ready' && presenceView.offline.length > 0 && (
                <NhomBanBe title="Ngoại tuyến" count={presenceView.offline.length}>
                  {presenceView.offline.map(({ friend, presence }) => (
                    <DongBanBe
                      key={friend.id}
                      testId={`friend-offline-${friend.username}`}
                      friend={friend}
                      onXem={moHoSo}
                      trangThai="offline"
                      meta={`${friend.lopTen ? `${friend.lopTen} · ` : ''}${formatLastSeen(presence?.lastSeen)}`}
                    />
                  ))}
                </NhomBanBe>
              )}
            </>
          )}
          {/* Nhóm nổi bật (Design Reference 1, 2) */}
          <div className="rounded-2xl border border-border-default bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                Nhóm nổi bật
              </span>
              <span className="text-xs font-semibold text-brand">48 thành viên</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand font-black text-sm border border-brand/30">
                  10A7
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">Lớp 10A7</p>
                  <p className="text-xs text-text-secondary truncate">Khóa 2026-2027</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs font-semibold shrink-0 border-border-default">
                Đã tham gia
              </Button>
            </div>
          </div>

          {/* Sự kiện trường học (Design Reference 1, 2) */}
          <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/10 via-surface to-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Sự kiện trường học
                </span>
              </div>
              <span className="rounded-md bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                Sắp diễn ra
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Giải Cờ Vua Mùa Thu 10A7</p>
              <p className="text-xs text-text-secondary mt-0.5">Thứ Bảy này · 19:30 tại Đấu trường Game</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/arena/chess')}
              className="w-full h-8 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-xs cursor-pointer"
            >
              Xem chi tiết giải đấu
            </Button>
          </div>

          {/* Xu hướng thảo luận (Design Reference 1, 2) */}
          <div className="rounded-2xl border border-border-default bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                Chủ đề sôi nổi
              </span>
            </div>
            <div className="space-y-2">
              {[
                { tag: '#Lop10A7', count: '142 bài thảo luận' },
                { tag: '#HocTapThongMinh', count: '89 bài thảo luận' },
                { tag: '#DauTruongCaro', count: '56 bài thảo luận' },
                { tag: '#KhoTaiLieuPDF', count: '38 bài thảo luận' },
              ].map((item) => (
                <div key={item.tag} className="flex items-center justify-between py-1 group cursor-pointer">
                  <span className="text-xs font-bold text-brand group-hover:underline">
                    {item.tag}
                  </span>
                  <span className="text-[11px] text-text-tertiary">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>


      </div>

      <Sheet open={rankingOpen} onOpenChange={setRankingOpen}><SheetContent className="gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"><SheetHeader className="pr-14"><SheetTitle>Bảng xếp hạng</SheetTitle></SheetHeader><GameArenaLeaderboard defaultGame="hoc_tap" className="h-full min-h-0 rounded-none border-0" /></SheetContent></Sheet>
      <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />
      {/* Drawer bạn bè mở theo tab từ các nút trên trang */}
      <FriendsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        defaultTab={drawerDefaultTab}
      />
    </div>
  )
}

function NhomBanBe({
  title,
  count,
  hint,
  testId,
  children,
}: {
  title: string
  count: number
  hint?: string
  testId?: string
  children: ReactNode
}) {
  return (
    <section data-testid={testId} className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h2 className="flex items-baseline gap-2 text-sm font-semibold text-text-primary">
          {title}
          <span className="text-xs font-medium tabular-nums text-text-tertiary">{count}</span>
        </h2>
        {hint && <span className="text-xs text-text-tertiary">{hint}</span>}
      </div>
      <ul className="divide-y divide-border-subtle">{children}</ul>
    </section>
  )
}

const MAU_CHAM_TRANG_THAI: Record<TrangThaiBan, string | null> = {
  online: 'bg-success',
  room: 'bg-success',
  away: 'bg-warning',
  offline: null,
  unknown: 'bg-text-tertiary',
}

function DongBanBe({
  friend,
  trangThai,
  meta,
  action,
  testId,
  onXem,
}: {
  friend: FriendItem
  trangThai: TrangThaiBan
  onXem: (friend: FriendItem, anchorRect: DOMRect) => void
  meta: ReactNode
  action?: ReactNode
  testId: string
}) {
  const ngoaiTuyen = trangThai === 'offline'
  const cham = MAU_CHAM_TRANG_THAI[trangThai]

  return (
    <li data-testid={testId} className="flex min-w-0 flex-wrap items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={(event) => onXem(friend, event.currentTarget.getBoundingClientRect())}
        aria-label={'Xem thông tin ' + friend.displayName}
        className="flex min-h-11 min-w-0 grow basis-48 items-center gap-3 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      >
        <div className="relative shrink-0">
          {friend.avatar ? (
            <img
              src={friend.avatar}
              alt=""
              className={cn('size-9 rounded-full object-cover', ngoaiTuyen && 'opacity-60 grayscale')}
            />
          ) : (
            <div
              className={cn(
                'flex size-9 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-text-secondary',
                ngoaiTuyen && 'opacity-70',
              )}
            >
              {getInitials(friend.displayName)}
            </div>
          )}
          {cham && <span className={cn('absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface', cham)} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium break-words', ngoaiTuyen ? 'text-text-secondary' : 'text-text-primary')}>
            {friend.displayName}
          </p>
          <p className="text-xs break-words text-text-tertiary">{meta}</p>
        </div>
      </button>
      {action}
    </li>
  )
}

/** Minh hoạ nét mảnh cho danh bạ trống: ba bạn học và dấu cộng kết nối. */
function HinhBanBe() {
  return (
    <svg viewBox="0 0 200 110" className="h-[99px] w-[180px]" aria-hidden>
      <defs>
        <radialGradient id="ban-be-hao-quang" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="55" rx="96" ry="54" fill="url(#ban-be-hao-quang)" />
      {[
        { cx: 62, cy: 62, r: 22, mau: '#c6a15a' },
        { cx: 138, cy: 62, r: 22, mau: '#34d399' },
        { cx: 100, cy: 50, r: 28, mau: '#a78bfa' },
      ].map(({ cx, cy, r, mau }) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} fill="#131e30" stroke="#0d1525" strokeWidth="4" />
          <circle cx={cx} cy={cy - r * 0.2} r={r * 0.32} fill={mau} fillOpacity="0.9" />
          <path d={`M${cx - r * 0.55} ${cy + r * 0.62} a${r * 0.55} ${r * 0.45} 0 0 1 ${r * 1.1} 0`} fill={mau} fillOpacity="0.9" />
        </g>
      ))}
      <circle cx="124" cy="28" r="11" fill="#a78bfa" stroke="#0d1525" strokeWidth="3" />
      <path d="M124 23.5v9M119.5 28h9" stroke="#0d1525" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
