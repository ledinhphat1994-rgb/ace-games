// Digital Campus v2: Canonical Social Hub (/community)
// src/features/hub/CommunityPage.tsx

import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HoSoNguoiDungDialog, type NguoiXem } from '@/components/social/HoSoNguoiDungDialog'
import { FriendsDrawer } from '@/components/social/FriendsDrawer'
import { LiveDot, PageHeader } from '@/components/layout/PageHeader'
import { cn, getInitials } from '@/lib/utils'
import {
  derivePresenceView,
  formatLastSeen,
} from '@/features/hub/social-semantics'
import type { FriendItem, BlockedUserItem } from '@shared/protocol/social'
import type { EngagementProfile, UserAchievementItem } from '@shared/protocol/engagement'
import { toast } from 'sonner'
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Ban,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  DoorOpen,
  Flame,
  GraduationCap,
  MessageSquare,
  Pencil,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  User,
  UserPlus,
  Users,
  Vote,
  X,
  Zap,
} from 'lucide-react'

type TrangThaiBan = 'online' | 'away' | 'room' | 'offline' | 'unknown'
type FilterTab = 'all' | 'online' | 'requests' | 'blocked'

const ICON_THANH_TUU: Record<string, ComponentType<{ className?: string }>> = {
  Sparkles,
  Users,
  Flame,
  Zap,
  CheckCircle2,
  Vote,
  BookOpen,
  Target,
  Trophy,
  ShieldCheck,
  Award,
}

export function CommunityPage() {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const {
    socialState,
    socialStatus,
    socialError,
    retrySocialLoad,
    presenceMap,
    presenceReady,
    trangThai,
    acceptFriendRequest,
    rejectFriendRequest,
    unblockUser,
  } = useCampus()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerDefaultTab, setDrawerDefaultTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [nguoiXem, setNguoiXem] = useState<NguoiXem | null>(null)
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [searchFilter, setSearchFilter] = useState('')
  const [busyActionId, setBusyActionId] = useState<string | number | null>(null)

  const openDrawerTab = (tab: 'friends' | 'requests' | 'search') => {
    setDrawerDefaultTab(tab)
    setDrawerOpen(true)
  }

  const moHoSo = (friend: FriendItem, anchorRect: DOMRect) => {
    setNguoiXem({
      id: friend.id,
      ten: friend.displayName,
      avatar: friend.avatar,
      lopTen: friend.lopTen,
      vaiTro: friend.role,
      anchorRect,
    })
  }

  const handleOpenDM = (friend: FriendItem) => {
    window.dispatchEvent(
      new CustomEvent('campus:open-dm', {
        detail: {
          id: friend.id,
          displayName: friend.displayName,
          avatar: friend.avatar,
          lopTen: friend.lopTen,
        },
      }),
    )
  }

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
  }

  const handleAcceptRequest = async (requestId: number) => {
    setBusyActionId(`accept-${requestId}`)
    try {
      const res = await acceptFriendRequest(requestId)
      if (res.ok) {
        toast.success('Đã chấp nhận lời mời kết bạn!')
      } else {
        toast.error(res.loi ?? 'Không thể chấp nhận lời mời.')
      }
    } finally {
      setBusyActionId(null)
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    setBusyActionId(`reject-${requestId}`)
    try {
      const res = await rejectFriendRequest(requestId)
      if (res.ok) {
        toast.success('Đã từ chối lời mời kết bạn.')
      } else {
        toast.error(res.loi ?? 'Không thể từ chối lời mời.')
      }
    } finally {
      setBusyActionId(null)
    }
  }

  const handleUnblock = async (targetId: number) => {
    setBusyActionId(`unblock-${targetId}`)
    try {
      const res = await unblockUser(targetId)
      if (res.ok) {
        toast.success('Đã bỏ chặn người dùng.')
      } else {
        toast.error(res.loi ?? 'Không thể bỏ chặn.')
      }
    } finally {
      setBusyActionId(null)
    }
  }

  // ── 1. REAL SOCIAL STATE ──
  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const incomingRequests = useMemo(
    () => socialState?.incomingRequests ?? [],
    [socialState?.incomingRequests],
  )
  const blockedUsers = useMemo(
    () => socialState?.blockedUsers ?? [],
    [socialState?.blockedUsers],
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

  // ── 2. REAL ENGAGEMENT & IDENTITY QUERIES ──
  const { data: profileData } = useQuery<{ ok: boolean; profile: EngagementProfile }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải thông tin hoạt động.')
      return res.json()
    },
    enabled: !!nguoiDung,
    staleTime: 30_000,
  })

  const { data: achievementsData } = useQuery<{
    ok: boolean
    achievements?: UserAchievementItem[]
    items?: UserAchievementItem[]
    unlockedCount?: number
    totalCount?: number
  }>({
    queryKey: ['engagement', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/achievements')
      if (!res.ok) throw new Error('Không thể tải thành tựu.')
      return res.json()
    },
    enabled: !!nguoiDung,
    staleTime: 30_000,
  })

  const rawAchievements = useMemo(
    () => achievementsData?.achievements || achievementsData?.items || [],
    [achievementsData],
  )
  const unlockedBadges = useMemo(
    () => rawAchievements.filter((a) => a.unlocked),
    [rawAchievements],
  )
  const totalBadgesCount = achievementsData?.totalCount ?? rawAchievements.length
  const unlockedBadgesCount =
    achievementsData?.unlockedCount ??
    (rawAchievements.length > 0
      ? unlockedBadges.length
      : profileData?.profile?.unlockedAchievementsCount ?? 0)

  // ── 3. FILTERING FRIENDS BY SEARCH INPUT ──
  const normalizedQuery = searchFilter.trim().toLowerCase()
  const matchesSearch = (item: { displayName: string; username?: string; lopTen?: string | null }) => {
    if (!normalizedQuery) return true
    return (
      item.displayName.toLowerCase().includes(normalizedQuery) ||
      (item.username && item.username.toLowerCase().includes(normalizedQuery)) ||
      (item.lopTen && item.lopTen.toLowerCase().includes(normalizedQuery))
    )
  }

  const filteredInRoom = useMemo(
    () => presenceView.inRoom.filter((x) => matchesSearch(x.friend)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presenceView.inRoom, normalizedQuery],
  )
  const filteredOnline = useMemo(
    () => presenceView.online.filter((x) => matchesSearch(x.friend)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presenceView.online, normalizedQuery],
  )
  const filteredOffline = useMemo(
    () => presenceView.offline.filter((x) => matchesSearch(x.friend)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presenceView.offline, normalizedQuery],
  )
  const filteredUnknown = useMemo(
    () => presenceView.unknown.filter((x) => matchesSearch(x.friend)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presenceView.unknown, normalizedQuery],
  )

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
      'Không gian kết nối bạn học — xem ai đang trực tuyến và cùng vào phòng học.'
    )

  return (
    <div data-testid="community-social-hub" className="space-y-6">
      {/* ── HEADER ── */}
      <PageHeader
        title="Cộng đồng"
        description={moTaTrucTiep}
        actions={
          nguoiDung ? (
            <>
              <Button
                variant="outline"
                data-testid="community-find-friends-cta"
                onClick={() => openDrawerTab('search')}
                className="gap-2 border-border-default hover:border-brand/40"
              >
                <Search className="size-4 text-social" />
                <span>Tìm bạn học</span>
              </Button>
              <Button
                data-testid="community-open-chat-cta"
                onClick={handleOpenChat}
                className="gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <MessageSquare className="size-4" />
                <span>Trò chuyện trường</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => moAuthModal('dang_nhap')}>
                Đăng nhập
              </Button>
              <Button onClick={() => moAuthModal('dang_ky')} className="bg-brand text-brand-foreground hover:bg-brand/90">
                Đăng ký
              </Button>
            </div>
          )
        }
      />

      {/* ── AREA A: LIGHTWEIGHT SOCIAL OVERVIEW ── */}
      {nguoiDung && (
        <div data-testid="community-social-overview" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border-default shadow-xs min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25">
              <Users className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-secondary truncate">Bạn bè</p>
              <p className="text-lg font-bold text-text-primary tabular-nums leading-tight">
                {coDuLieu ? friends.length : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border-default shadow-xs min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Radio className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-secondary truncate">Trực tuyến</p>
              <p className="text-lg font-bold text-emerald-400 tabular-nums leading-tight">
                {presenceReady ? totalActive : '…'}
              </p>
            </div>
          </div>

          <div
            onClick={() => {
              if (incomingRequests.length > 0) setFilterTab('requests')
              else openDrawerTab('requests')
            }}
            className={cn(
              'flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border transition-colors cursor-pointer min-w-0',
              incomingRequests.length > 0
                ? 'border-social/40 bg-social-muted/30 hover:bg-social-muted/50'
                : 'border-border-default hover:border-border-subtle shadow-xs',
            )}
          >
            <div className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl border',
              incomingRequests.length > 0
                ? 'bg-social/20 text-social border-social/40'
                : 'bg-surface-overlay text-text-secondary border-border-default',
            )}>
              <UserPlus className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-secondary truncate">Lời mời kết bạn</p>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-text-primary tabular-nums leading-tight">
                  {incomingRequests.length}
                </span>
                {incomingRequests.length > 0 && (
                  <span className="inline-block size-2 rounded-full bg-social animate-pulse" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-surface border border-border-default shadow-xs min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand border border-brand/25">
              <DoorOpen className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text-secondary truncate">Trong phòng học</p>
              <p className="text-lg font-bold text-brand tabular-nums leading-tight">
                {presenceReady ? presenceView.inRoom.length : '…'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DEGRADED WARNING BANNER ── */}
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
            <RefreshCw className="size-3.5" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* ── MAIN WORKSPACE: 2-COLUMN LAYOUT (DESKTOP) / 1-COLUMN (MOBILE) ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        {/* ══════════════════════════════════════════════════════════
            AREA B: FRIENDS & CONNECTIONS WORKSPACE
        ══════════════════════════════════════════════════════════ */}
        <div data-testid="community-friends-workspace" className="min-w-0 space-y-4">
          {/* FILTER TOOLBAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-surface border border-border-default shadow-xs">
            {/* Segmented Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                data-testid="community-friends-tab-all"
                onClick={() => setFilterTab('all')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand shrink-0',
                  filterTab === 'all'
                    ? 'bg-brand/15 text-brand border border-brand/25'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay border border-transparent',
                )}
              >
                Tất cả {coDuLieu && `(${friends.length})`}
              </button>
              <button
                type="button"
                data-testid="community-friends-tab-online"
                onClick={() => setFilterTab('online')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand shrink-0',
                  filterTab === 'online'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay border border-transparent',
                )}
              >
                Trực tuyến {presenceReady && `(${totalActive})`}
              </button>
              <button
                type="button"
                data-testid="community-friends-tab-requests"
                onClick={() => setFilterTab('requests')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand shrink-0 relative',
                  filterTab === 'requests'
                    ? 'bg-social/15 text-social border border-social/25'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay border border-transparent',
                )}
              >
                Lời mời {incomingRequests.length > 0 && `(${incomingRequests.length})`}
              </button>
              {blockedUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterTab('blocked')}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand shrink-0',
                    filterTab === 'blocked'
                      ? 'bg-destructive/15 text-destructive border border-destructive/25'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay border border-transparent',
                  )}
                >
                  Đã chặn ({blockedUsers.length})
                </button>
              )}
            </div>

            {/* In-list Search Filter */}
            <div className="relative flex-1 sm:max-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary" />
              <Input
                data-testid="community-search-input"
                type="text"
                placeholder="Lọc bạn bè..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-xl bg-surface-overlay border-border-default focus-visible:ring-1 focus-visible:ring-brand"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  aria-label="Xoá tìm kiếm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-text-tertiary hover:text-text-primary rounded-full flex items-center justify-center"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* STATE A: Đang tải */}
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
                <div key={i} className="flex items-center gap-3 border-b border-border-subtle px-4 py-3.5 last:border-b-0">
                  <div className="size-10 animate-pulse rounded-full bg-surface-overlay" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 animate-pulse rounded bg-surface-overlay" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-surface-overlay/70" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STATE B: Lỗi tải */}
          {socialStatus === 'error' && (
            <div
              data-testid="community-error"
              className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-surface px-6 py-10 text-center"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                <AlertCircle className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-text-primary">Không tải được danh sách bạn bè</h2>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-text-secondary">
                {socialError || 'Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng kiểm tra đường truyền mạng.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                data-testid="community-retry-btn"
                onClick={() => void retrySocialLoad()}
                className="mt-5 gap-2"
              >
                <RefreshCw className="size-3.5" />
                <span>Thử lại</span>
              </Button>
            </div>
          )}

          {/* STATE C: Danh bạ trống (đã xác thực) */}
          {coDuLieu && friends.length === 0 && filterTab !== 'requests' && filterTab !== 'blocked' && (
            <div
              data-testid="community-empty"
              className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-border-default bg-surface p-8 text-center"
            >
              <HinhBanBe />
              <h2 className="mt-5 text-base font-semibold tracking-tight text-text-primary">Chưa có bạn bè trong danh bạ</h2>
              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-text-secondary">
                Tìm bạn cùng lớp hoặc trong trường để xem ai đang trực tuyến và cùng vào phòng học tập.
              </p>
              <Button
                onClick={() => openDrawerTab('search')}
                className="mt-5 gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <UserPlus className="size-4" />
                <span>Tìm bạn học ngay</span>
              </Button>
            </div>
          )}

          {/* STATE D: TAB LỜI MỜI KẾT BẠN */}
          {filterTab === 'requests' && (
            <section className="overflow-hidden rounded-2xl border border-border-default bg-surface">
              <div className="flex items-center justify-between border-b border-border-default px-4 py-3 bg-surface-raised/40">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <UserPlus className="size-4 text-social" />
                  <span>Lời mời kết bạn đang chờ</span>
                  <span className="text-xs font-semibold tabular-nums text-social">
                    ({incomingRequests.length})
                  </span>
                </h2>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => openDrawerTab('requests')}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Mở ngăn kéo
                </Button>
              </div>

              {incomingRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-secondary">
                  Không có lời mời kết bạn nào đang chờ xử lý.
                </div>
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {incomingRequests.map((req) => {
                    const sender = req.sender
                    if (!sender) return null
                    const isAccepting = busyActionId === `accept-${req.id}`
                    const isRejecting = busyActionId === `reject-${req.id}`
                    return (
                      <li key={req.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            {sender.avatar ? (
                              <img
                                src={sender.avatar}
                                alt=""
                                className="size-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex size-10 items-center justify-center rounded-full bg-social/20 text-social text-xs font-bold">
                                {getInitials(sender.displayName)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-text-primary truncate">
                              {sender.displayName}
                            </p>
                            <p className="text-xs text-text-tertiary truncate">
                              @{sender.username} {sender.lopTen ? `· ${sender.lopTen}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            disabled={isAccepting || isRejecting}
                            onClick={() => handleAcceptRequest(req.id)}
                            className="h-8 gap-1.5 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Check className="size-3.5" />
                            <span>Chấp nhận</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isAccepting || isRejecting}
                            onClick={() => handleRejectRequest(req.id)}
                            className="h-8 gap-1.5 px-3 text-xs font-semibold text-text-secondary hover:text-destructive hover:border-destructive/30"
                          >
                            <X className="size-3.5" />
                            <span>Từ chối</span>
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {/* STATE E: TAB ĐÃ CHẶN */}
          {filterTab === 'blocked' && (
            <section className="overflow-hidden rounded-2xl border border-border-default bg-surface">
              <div className="flex items-center justify-between border-b border-border-default px-4 py-3 bg-surface-raised/40">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <Ban className="size-4 text-destructive" />
                  <span>Người dùng đã chặn</span>
                  <span className="text-xs font-semibold tabular-nums text-text-tertiary">
                    ({blockedUsers.length})
                  </span>
                </h2>
              </div>

              {blockedUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-secondary">
                  Danh sách chặn trống.
                </div>
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {blockedUsers.map((b: BlockedUserItem) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 items-center justify-center rounded-full bg-surface-overlay text-text-tertiary text-xs font-bold shrink-0">
                          <User className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {b.displayName}
                          </p>
                          <p className="text-xs text-text-tertiary truncate">@{b.username}</p>
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={busyActionId === `unblock-${b.id}`}
                        onClick={() => handleUnblock(b.id)}
                        className="text-xs shrink-0"
                      >
                        Bỏ chặn
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* STATE F: DANH SÁCH BẠN BÈ THEO TRẠNG THÁI PRESENCE (ALL HOẶC ONLINE) */}
          {coDuLieu && friends.length > 0 && filterTab !== 'requests' && filterTab !== 'blocked' && (
            <>
              {presenceView.freshness === 'stale' && (
                <p
                  data-testid="presence-disconnected-banner"
                  className="flex items-center gap-2.5 text-xs text-warning"
                >
                  <LiveDot tone="warning" />
                  Trạng thái trực tuyến đang kết nối lại…
                </p>
              )}
              {presenceView.freshness === 'unknown' && (
                <p
                  data-testid="presence-unknown-banner"
                  className="flex items-center gap-2.5 text-xs text-text-secondary"
                >
                  <LiveDot tone="muted" />
                  Đang tải trạng thái trực tuyến của bạn bè…
                </p>
              )}

              {/* Chưa xác thực được presence */}
              {presenceView.freshness !== 'ready' && (
                <NhomBanBe
                  data-testid="friends-unconfirmed-list"
                  title="Bạn bè"
                  count={filteredUnknown.length}
                  hint={presenceView.freshness === 'stale' ? 'Mất kết nối' : 'Đang tải trạng thái'}
                >
                  {filteredUnknown.map(({ friend }) => (
                    <DongBanBe
                      key={friend.id}
                      testId={`friend-unconfirmed-${friend.username}`}
                      friend={friend}
                      onXem={moHoSo}
                      onDM={handleOpenDM}
                      trangThai="unknown"
                      meta={`@${friend.username}${friend.lopTen ? ` · ${friend.lopTen}` : ''}`}
                    />
                  ))}
                </NhomBanBe>
              )}

              {/* Đã xác thực presence: hiển thị danh sách theo nhóm */}
              {presenceView.freshness === 'ready' && (
                <>
                  {/* Nhóm Trong Phòng Học */}
                  {filteredInRoom.length > 0 && (
                    <NhomBanBe
                      title="Đang trong phòng học"
                      count={filteredInRoom.length}
                      icon={<DoorOpen className="size-4 text-brand" />}
                    >
                      {filteredInRoom.map(({ friend, roomId, roomTitle }) => (
                        <DongBanBe
                          key={friend.id}
                          testId={`friend-in-room-${friend.username}`}
                          friend={friend}
                          onXem={moHoSo}
                          onDM={handleOpenDM}
                          trangThai="room"
                          meta={
                            <>
                              <span className="text-social font-medium">{roomTitle || 'Phòng học'}</span>
                              {friend.lopTen ? ` · ${friend.lopTen}` : ''}
                            </>
                          }
                          action={
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="xs"
                                variant="outline"
                                aria-label={`Nhắn tin cho ${friend.displayName}`}
                                title={`Nhắn tin cho ${friend.displayName}`}
                                data-testid={`community-dm-btn-${friend.username}`}
                                onClick={() => handleOpenDM(friend)}
                                className="h-8 size-8 p-0"
                              >
                                <MessageSquare className="size-3.5 text-text-secondary" />
                              </Button>
                              <Button
                                size="xs"
                                data-testid={`join-room-btn-${friend.username}`}
                                onClick={() => navigate(`/room/phong-${roomId}`)}
                                className="h-8 gap-1.5 px-2.5 text-xs font-semibold bg-brand text-brand-foreground hover:bg-brand/90"
                              >
                                <DoorOpen className="size-3.5" />
                                <span>Vào phòng</span>
                              </Button>
                            </div>
                          }
                        />
                      ))}
                    </NhomBanBe>
                  )}

                  {/* Nhóm Đang Trực Tuyến */}
                  {filteredOnline.length > 0 && (
                    <NhomBanBe
                      title="Đang trực tuyến"
                      count={filteredOnline.length}
                      icon={<LiveDot tone="success" />}
                    >
                      {filteredOnline.map(({ friend, isAway }) => (
                        <DongBanBe
                          key={friend.id}
                          testId={`friend-online-${friend.username}`}
                          friend={friend}
                          onXem={moHoSo}
                          onDM={handleOpenDM}
                          trangThai={isAway ? 'away' : 'online'}
                          meta={`@${friend.username}${friend.lopTen ? ` · ${friend.lopTen}` : ''}`}
                          action={
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn('text-xs font-medium', isAway ? 'text-warning' : 'text-success')}>
                                {isAway ? 'Tạm vắng' : 'Trực tuyến'}
                              </span>
                              <Button
                                size="xs"
                                variant="outline"
                                aria-label={`Nhắn tin cho ${friend.displayName}`}
                                title={`Nhắn tin cho ${friend.displayName}`}
                                data-testid={`community-dm-btn-${friend.username}`}
                                onClick={() => handleOpenDM(friend)}
                                className="h-8 size-8 p-0"
                              >
                                <MessageSquare className="size-3.5 text-text-secondary" />
                              </Button>
                            </div>
                          }
                        />
                      ))}
                    </NhomBanBe>
                  )}

                  {/* Nhóm Ngoại Tuyến (chỉ hiện khi ở tab Tất cả) */}
                  {filterTab === 'all' && filteredOffline.length > 0 && (
                    <NhomBanBe
                      title="Ngoại tuyến"
                      count={filteredOffline.length}
                      icon={<Clock className="size-3.5 text-text-tertiary" />}
                    >
                      {filteredOffline.map(({ friend, presence }) => (
                        <DongBanBe
                          key={friend.id}
                          testId={`friend-offline-${friend.username}`}
                          friend={friend}
                          onXem={moHoSo}
                          onDM={handleOpenDM}
                          trangThai="offline"
                          meta={`${friend.lopTen ? `${friend.lopTen} · ` : ''}${formatLastSeen(presence?.lastSeen)}`}
                          action={
                            <Button
                              size="xs"
                              variant="ghost"
                              aria-label={`Nhắn tin cho ${friend.displayName}`}
                              title={`Nhắn tin cho ${friend.displayName}`}
                              data-testid={`community-dm-btn-${friend.username}`}
                              onClick={() => handleOpenDM(friend)}
                              className="h-8 size-8 p-0 text-text-tertiary hover:text-text-primary"
                            >
                              <MessageSquare className="size-3.5" />
                            </Button>
                          }
                        />
                      ))}
                    </NhomBanBe>
                  )}

                  {/* Empty state khi filter search không có kết quả */}
                  {normalizedQuery &&
                    filteredInRoom.length === 0 &&
                    filteredOnline.length === 0 &&
                    (filterTab === 'online' || filteredOffline.length === 0) && (
                      <div className="p-8 text-center rounded-2xl border border-border-default bg-surface text-xs text-text-secondary">
                        Không tìm thấy bạn học nào khớp với từ khoá “{searchFilter}”.
                      </div>
                    )}
                </>
              )}
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            AREA C: MY IDENTITY (DIGITAL CAMPUS PASSPORT)
        ══════════════════════════════════════════════════════════ */}
        <aside data-testid="community-identity-card" className="space-y-4">
          {nguoiDung ? (
            <div className="overflow-hidden rounded-2xl border border-border-default bg-surface shadow-xs">
              {/* Profile Card Header */}
              <div className="relative p-5 pb-4 bg-gradient-to-b from-brand/10 via-surface to-surface border-b border-border-subtle">
                <div className="flex items-start justify-between gap-3">
                  <div className="relative shrink-0">
                    {nguoiDung.avatar ? (
                      <img
                        src={nguoiDung.avatar}
                        alt=""
                        className="size-14 rounded-2xl object-cover ring-2 ring-brand/30 shadow-sm"
                      />
                    ) : (
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/20 text-brand text-lg font-bold ring-2 ring-brand/30 shadow-sm">
                        {getInitials(nguoiDung.ten || nguoiDung.username)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-success ring-2 ring-surface" title="Trực tuyến" />
                  </div>

                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => navigate('/me')}
                    className="gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-xl border-border-default hover:border-brand/40"
                  >
                    <Pencil className="size-3 text-text-secondary" />
                    <span>Sửa hồ sơ</span>
                  </Button>
                </div>

                <div className="mt-3 min-w-0">
                  <h3 className="text-base font-bold text-text-primary truncate">
                    {nguoiDung.ten || nguoiDung.username}
                  </h3>
                  <p className="text-xs text-text-tertiary truncate">@{nguoiDung.username}</p>

                  {/* Chips: Role & Class */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold',
                      nguoiDung.isSchoolAdmin
                        ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                        : nguoiDung.role === 'teacher'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-brand/15 text-brand border border-brand/25',
                    )}>
                      {nguoiDung.isSchoolAdmin ? (
                        <Shield className="size-3" />
                      ) : (
                        <GraduationCap className="size-3" />
                      )}
                      <span>
                        {nguoiDung.isSchoolAdmin
                          ? 'Quản trị viên'
                          : nguoiDung.role === 'teacher'
                            ? 'Giáo viên'
                            : 'Học sinh'}
                      </span>
                    </span>

                    {nguoiDung.lop?.ten && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-surface-overlay text-text-secondary border border-border-default">
                        Lớp {nguoiDung.lop.ten}
                      </span>
                    )}
                  </div>

                  {/* Personal Bio Quote */}
                  {nguoiDung.tieuDeHoSo && (
                    <p className="mt-2.5 text-xs text-text-secondary italic line-clamp-2 bg-surface-overlay/60 rounded-lg p-2 border border-border-subtle">
                      “{nguoiDung.tieuDeHoSo}”
                    </p>
                  )}
                </div>
              </div>

              {/* Real Engagement Statistics */}
              <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle bg-surface-raised/30">
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-amber-400 mb-0.5">
                    <Flame className="size-3.5" />
                    <span className="text-[11px] font-medium text-text-tertiary">Chuỗi</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary tabular-nums">
                    {profileData?.profile?.currentStreak ?? 0}
                    <span className="text-[10px] font-normal text-text-tertiary ml-0.5">ngày</span>
                  </p>
                </div>

                <div className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-brand mb-0.5">
                    <Zap className="size-3.5" />
                    <span className="text-[11px] font-medium text-text-tertiary">Điểm XP</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary tabular-nums">
                    {profileData?.profile?.totalXp ?? 0}
                  </p>
                </div>

                <div className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs text-violet-400 mb-0.5">
                    <Trophy className="size-3.5" />
                    <span className="text-[11px] font-medium text-text-tertiary">Huy hiệu</span>
                  </div>
                  <p className="text-sm font-bold text-text-primary tabular-nums">
                    {unlockedBadgesCount}/{totalBadgesCount}
                  </p>
                </div>
              </div>

              {/* Real Achievement Badges Preview */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
                    Huy hiệu đạt được
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/me')}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Xem tất cả
                  </button>
                </div>

                {unlockedBadges.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-3">
                    Tham gia học tập và giải đố để mở khóa huy hiệu đầu tiên!
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {unlockedBadges.slice(0, 8).map((badge) => {
                      const IconComp = ICON_THANH_TUU[badge.icon] || Award
                      return (
                        <div
                          key={badge.key}
                          title={`${badge.title}: ${badge.description}`}
                          className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 transition-transform hover:scale-105"
                        >
                          <IconComp className="size-5 text-amber-400 mb-1" />
                          <span className="text-[10px] font-semibold text-text-secondary truncate w-full text-center">
                            {badge.title}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Guest Identity Prompt */
            <div className="rounded-2xl border border-border-default bg-surface p-5 text-center space-y-3 shadow-xs">
              <div className="flex size-12 mx-auto items-center justify-center rounded-2xl bg-brand/15 text-brand">
                <User className="size-6" />
              </div>
              <h3 className="text-sm font-bold text-text-primary">Tham gia Digital Campus</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Đăng nhập để xem danh bạ bạn học, trạng thái trực tuyến và nhận huy hiệu tiến trình học tập.
              </p>
              <Button
                onClick={() => moAuthModal('dang_nhap')}
                className="w-full h-9 text-xs font-bold rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
              >
                Đăng nhập ngay
              </Button>
            </div>
          )}

          {/* Canonical Discovery & Connect Card */}
          <div className="rounded-2xl border border-border-default bg-surface p-4 space-y-2.5 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Kết nối nhanh
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => openDrawerTab('search')}
                className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-surface-overlay text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-social/15 text-social">
                    <UserPlus className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary group-hover:text-brand transition-colors truncate">
                      Tìm kiếm bạn học
                    </p>
                    <p className="text-[11px] text-text-tertiary truncate">Qua họ tên hoặc mã tài khoản</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleOpenChat}
                className="flex items-center justify-between w-full p-2.5 rounded-xl hover:bg-surface-overlay text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <MessageSquare className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary group-hover:text-brand transition-colors truncate">
                      Kênh trò chuyện trường
                    </p>
                    <p className="text-[11px] text-text-tertiary truncate">Thảo luận cùng toàn thể lớp 10A7</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Profile Dialog */}
      <HoSoNguoiDungDialog nguoi={nguoiXem} onDong={() => setNguoiXem(null)} />

      {/* Canonical Friends Drawer */}
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
  icon,
  testId,
  'data-testid': dataTestId,
  children,
}: {
  title: string
  count: number
  hint?: string
  icon?: ReactNode
  testId?: string
  'data-testid'?: string
  children: ReactNode
}) {
  return (
    <section data-testid={dataTestId || testId} className="overflow-hidden rounded-2xl border border-border-default bg-surface shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-border-default px-4 py-3 bg-surface-raised/40">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          {icon}
          <span>{title}</span>
          <span className="text-xs font-medium tabular-nums text-text-tertiary">({count})</span>
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
  onDM,
}: {
  friend: FriendItem
  trangThai: TrangThaiBan
  onXem: (friend: FriendItem, anchorRect: DOMRect) => void
  onDM: (friend: FriendItem) => void
  meta: ReactNode
  action?: ReactNode
  testId: string
}) {
  const ngoaiTuyen = trangThai === 'offline'
  const cham = MAU_CHAM_TRANG_THAI[trangThai]

  return (
    <li data-testid={testId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-surface-raised/30 transition-colors">
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
              className={cn('size-10 rounded-full object-cover', ngoaiTuyen && 'opacity-60 grayscale')}
            />
          ) : (
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-text-secondary',
                ngoaiTuyen && 'opacity-70',
              )}
            >
              {getInitials(friend.displayName)}
            </div>
          )}
          {cham && <span className={cn('absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface', cham)} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold truncate', ngoaiTuyen ? 'text-text-secondary' : 'text-text-primary')}>
            {friend.displayName}
          </p>
          <p className="text-xs truncate text-text-tertiary">{meta}</p>
        </div>
      </button>

      {action || (
        <Button
          size="xs"
          variant="outline"
          aria-label={`Nhắn tin cho ${friend.displayName}`}
          title={`Nhắn tin cho ${friend.displayName}`}
          data-testid={`community-dm-btn-${friend.username}`}
          onClick={() => onDM(friend)}
          className="h-8 size-8 p-0 shrink-0 text-text-secondary hover:text-text-primary"
        >
          <MessageSquare className="size-3.5" />
        </Button>
      )}
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
