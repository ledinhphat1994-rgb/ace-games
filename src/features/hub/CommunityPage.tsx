import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
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
import type { TinCampus } from '@shared/protocol/campus'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  DoorOpen,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
} from 'lucide-react'

type TrangThaiBan = 'online' | 'away' | 'room' | 'offline' | 'unknown'

export function CommunityPage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const {
    socialState,
    socialStatus,
    socialError,
    retrySocialLoad,
    presenceMap,
    presenceReady,
    trangThai,
    messages,
    rooms,
    campusSnapshotReady,
  } = useCampus()

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="min-w-0 space-y-6">
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
        </div>

        <aside className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start xl:grid-cols-1 xl:self-start">
          <XemTruocTroChuyen messages={messages} />

          <section className="rounded-2xl border border-border-subtle bg-surface p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <BookOpen className="size-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-text-primary">Học cùng bạn bè</h2>
                <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-text-secondary">
                  {/* Khách không nhận danh sách phòng từ sảnh: không khẳng định "chưa có phòng" */}
                  {campusSnapshotReady && nguoiDung
                    ? rooms.length > 0
                      ? `${rooms.length} phòng học đang mở — vào học cùng mọi người.`
                      : 'Chưa có phòng nào đang mở — hãy mở phòng đầu tiên.'
                    : 'Mở hoặc tham gia phòng học nhóm trực tuyến.'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              data-testid={friends.length > 0 ? 'community-go-learning-sidebar-cta' : 'community-go-learning-cta'}
              onClick={() => navigate('/learn')}
              className="mt-4 w-full"
            >
              <span>Đến trang Học tập</span>
              <ArrowRight />
            </Button>
          </section>

          <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-text-tertiary md:col-span-2 xl:col-span-1">
            <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" />
            Tôn trọng bạn học, giữ văn minh khi trò chuyện. Bạn luôn có thể chặn hoặc báo cáo khi cần.
          </p>
        </aside>
      </div>

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

const DINH_DANG_GIO = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })

/** Ba tin gần nhất của kênh trò chuyện toàn trường (dữ liệu thật từ CampusDO, đã áp dụng xoá/kiểm duyệt). */
function XemTruocTroChuyen({ messages }: { messages: TinCampus[] }) {
  const ganDay = messages.slice(-3)

  return (
    <section aria-labelledby="community-chat-preview-heading" className="rounded-2xl border border-border-subtle bg-surface">
      <div className="px-4 pt-4 pb-3">
        <h2 id="community-chat-preview-heading" className="text-sm font-semibold text-text-primary">
          Trò chuyện toàn trường
        </h2>
      </div>
      <div className="px-4 pb-4">
        {ganDay.length === 0 ? (
          <div className="flex min-h-[100px] flex-col items-center justify-center text-center">
            <MessageSquare className="size-5 text-text-tertiary" />
            <p className="mt-2 text-[0.8125rem] text-text-secondary">Chưa có tin nhắn gần đây.</p>
            <p className="text-xs text-text-tertiary">Mở trò chuyện để chào mọi người!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {ganDay.map((tin) => (
              <li key={tin.id} className="flex gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-[10px] font-semibold text-text-secondary uppercase">
                  {tin.ten.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-xs">
                    <span className="min-w-0 font-medium break-words text-text-primary">{tin.ten}</span>
                    {tin.vaiTro === 'giao_vien' && (
                      <span className="shrink-0 rounded bg-brand/12 px-1 text-[10px] font-semibold text-brand">GV</span>
                    )}
                    <span className="shrink-0 text-text-tertiary tabular-nums">{DINH_DANG_GIO.format(tin.taoLuc)}</span>
                  </p>
                  <p className="mt-0.5 text-[0.8125rem] leading-snug break-words whitespace-pre-line text-text-secondary">
                    {tin.noiDung}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
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
        { cx: 62, cy: 62, r: 22, mau: '#22d3ee' },
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
