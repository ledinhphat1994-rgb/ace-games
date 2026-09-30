import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Check,
  Clock,
  DoorOpen,
  Loader2,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  SendHorizontal,
  Smile,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { useCampusContext } from '@/app/CampusContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { timKiemNguoiDung } from '@/lib/api'
import { usePhien } from '@/app/phien'
import type { FriendItem, SearchResultItem } from '@shared/protocol/social'
import { cn, getInitials } from '@/lib/utils'
import {
  UserSearchController,
  type SearchState,
  formatLastSeen,
  derivePresenceView,
} from '@/features/hub/social-semantics'

type TabBanBe = 'friends' | 'requests' | 'search'

/** Một tin nhắn cục bộ trong DM panel (client-only, lưu RAM). */
interface TinDM {
  id: string
  fromMe: boolean
  text: string
  taoLuc: number
  ten: string
  avatar: string | null
}

const DINH_DANG_GIO_DM = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })
const DANH_SACH_EMOJI_DM = ['😊', '😂', '🔥', '👍', '🎉', '❤️', '🏆', '✨', '💪', '🎮', '✌️', '🫡']

/** Lưu tin nhắn DM theo friendId vào sessionStorage để dữ liệu tồn tại khi đóng drawer. */
function layDMTuSession(friendId: number): TinDM[] {
  try {
    const raw = sessionStorage.getItem(`dm_${friendId}`)
    return raw ? (JSON.parse(raw) as TinDM[]) : []
  } catch {
    return []
  }
}
function luuDMVaoSession(friendId: number, msgs: TinDM[]): void {
  try {
    sessionStorage.setItem(`dm_${friendId}`, JSON.stringify(msgs.slice(-200)))
  } catch { /* nếu session bị lỗi thì bỏ qua */ }
}
/** Đếm số tin chưa đọc của tất cả bạn bè (so sánh với thời điểm lần cuối xem). */
function demTinChuaDoc(friends: FriendItem[]): number {
  let dem = 0
  for (const f of friends) {
    try {
      const raw = sessionStorage.getItem(`dm_${f.id}`)
      if (!raw) continue
      const msgs = JSON.parse(raw) as TinDM[]
      const lastViewedRaw = sessionStorage.getItem(`dm_viewed_${f.id}`)
      const lastViewed = lastViewedRaw ? parseInt(lastViewedRaw, 10) : 0
      dem += msgs.filter((m) => !m.fromMe && m.taoLuc > lastViewed).length
    } catch { /* ignore */ }
  }
  return dem
}

/** Đợi người dùng gõ xong rồi mới hỏi máy chủ — không bắn một truy vấn D1 cho mỗi phím. */
const TRE_TIM_KIEM_MS = 250

/** Mỗi tab tự cuộn trong khung cố định của ngăn kéo, nên đổi tab không làm xê dịch bố cục. */
const KHUNG_TAB =
  'mt-0 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pt-1 pb-[max(1rem,env(safe-area-inset-bottom))]'

interface FriendsDrawerProps {
  className?: string
  defaultTab?: TabBanBe
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Nút mở tuỳ chỉnh. Drawer điều khiển từ ngoài (`open`) mà không truyền trigger sẽ không vẽ nút mặc định. */
  trigger?: React.ReactNode
}

export function FriendsDrawer({
  className,
  defaultTab,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: FriendsDrawerProps) {
  const [dmFriend, setDmFriend] = useState<FriendItem | null>(null)
  const navigate = useNavigate()
  const {
    socialState,
    friendsPresence,
    presenceReady,
    trangThai,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    unfriend,
    blockUser,
    unblockUser,
  } = useCampusContext()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof controlledOpen === 'boolean'
  const isOpen = isControlled ? controlledOpen : internalOpen
  const handleOpenChange = (val: boolean) => {
    if (isControlled) {
      setControlledOpen?.(val)
    } else {
      setInternalOpen(val)
    }
  }

  const [activeTab, setActiveTab] = useState<TabBanBe>(defaultTab || 'friends')

  useEffect(() => {
    const handleOpenDM = (e: Event) => {
      const ce = e as CustomEvent<{ id: number; displayName: string; avatar?: string | null; lopTen?: string | null }>
      if (!ce.detail) return
      const { id, displayName, avatar, lopTen } = ce.detail
      handleOpenChange(true)
      setDmFriend({
        id,
        displayName,
        username: '',
        avatar: avatar ?? null,
        lopTen: lopTen ?? null,
        role: 'hoc_sinh',
        friendedAt: Date.now(),
      })
    }
    window.addEventListener('campus:open-dm', handleOpenDM)
    return () => window.removeEventListener('campus:open-dm', handleOpenDM)
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchController] = useState(() => new UserSearchController())
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' })
  // Kết quả lần tìm gần nhất — vẫn hiện (mờ đi) trong lúc tìm lại, để danh sách không nháy trống theo từng phím.
  const [ketQuaDangHien, setKetQuaDangHien] = useState<SearchResultItem[]>([])
  const [busyActionId, setBusyActionId] = useState<string | null>(null)
  const henGioTimRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mỗi lần mở (hoặc khi trang đổi tab mặc định, vd. nút "Tìm bạn") thì hiện đúng tab được yêu cầu,
  // kể cả khi lần trước người dùng đã tự chuyển sang tab khác rồi đóng. Điều chỉnh ngay trong lần vẽ, không cần effect.
  const [tabMacDinhTruoc, setTabMacDinhTruoc] = useState(defaultTab)
  const [dangMoTruoc, setDangMoTruoc] = useState(isOpen)
  if (defaultTab !== tabMacDinhTruoc || isOpen !== dangMoTruoc) {
    const vuaMo = isOpen && !dangMoTruoc
    if (defaultTab && (defaultTab !== tabMacDinhTruoc || vuaMo)) setActiveTab(defaultTab)
    setTabMacDinhTruoc(defaultTab)
    setDangMoTruoc(isOpen)
  }

  useEffect(() => {
    return searchController.subscribe((next) => {
      setSearchState(next)
      if (next.status === 'success') setKetQuaDangHien(next.results)
      else if (next.status !== 'searching') setKetQuaDangHien([])
    })
  }, [searchController])

  useEffect(() => {
    const henGio = henGioTimRef
    return () => {
      if (henGio.current) clearTimeout(henGio.current)
    }
  }, [])

  const incomingRequests = useMemo(() => socialState?.incomingRequests ?? [], [socialState?.incomingRequests])
  const outgoingRequests = useMemo(() => socialState?.outgoingRequests ?? [], [socialState?.outgoingRequests])
  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  // Badge tin nhắn chưa đọc
  const [tinChuaDoc, setTinChuaDoc] = useState(0)
  useEffect(() => {
    setTinChuaDoc(demTinChuaDoc(friends))
    const interval = setInterval(() => setTinChuaDoc(demTinChuaDoc(friends)), 5000)
    return () => clearInterval(interval)
  }, [friends])

  const presenceView = useMemo(() => {
    return derivePresenceView({
      friends,
      presenceMap: friendsPresence,
      presenceReady,
      connectionStatus: trangThai,
    })
  }, [friends, friendsPresence, presenceReady, trangThai])

  // Count online friends truthfully from presenceView
  const onlineFriendsCount = presenceView.totalActive
  const presenceSanSang = presenceView.freshness === 'ready'

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (henGioTimRef.current) clearTimeout(henGioTimRef.current)
    if (!query.trim()) {
      searchController.reset()
      return
    }
    henGioTimRef.current = setTimeout(() => {
      void searchController.executeSearch(query, timKiemNguoiDung)
    }, TRE_TIM_KIEM_MS)
  }

  const handleRetrySearch = () => {
    if (searchQuery.trim()) {
      void searchController.executeSearch(searchQuery, timKiemNguoiDung)
    }
  }

  const handleSendRequest = async (targetId: number) => {
    setBusyActionId(`send-${targetId}`)
    try {
      const res = await sendFriendRequest(targetId)
      if (!res.ok) {
        toast.error(res.loi || 'Không gửi được lời mời.')
        return
      }
      toast.success('Đã gửi lời mời kết bạn!')
      searchController.updateItemStatus(targetId, 'pending_sent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không gửi được lời mời.')
    } finally {
      setBusyActionId(null)
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    setBusyActionId(`accept-${requestId}`)
    try {
      const res = await acceptFriendRequest(requestId)
      if (!res.ok) {
        toast.error(res.loi || 'Lỗi khi chấp nhận kết bạn.')
        return
      }
      toast.success('Đã đồng ý kết bạn!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi chấp nhận kết bạn.')
    } finally {
      setBusyActionId(null)
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    setBusyActionId(`reject-${requestId}`)
    try {
      const res = await rejectFriendRequest(requestId)
      if (!res.ok) {
        toast.error(res.loi || 'Lỗi khi từ chối.')
        return
      }
      toast.info('Đã từ chối lời mời kết bạn.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi từ chối.')
    } finally {
      setBusyActionId(null)
    }
  }

  const handleCancelRequest = async (requestId: number) => {
    setBusyActionId(`cancel-${requestId}`)
    try {
      const res = await cancelFriendRequest(requestId)
      if (!res.ok) {
        toast.error(res.loi || 'Lỗi khi hủy lời mời.')
        return
      }
      toast.info('Đã hủy lời mời kết bạn.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi hủy lời mời.')
    } finally {
      setBusyActionId(null)
    }
  }

  const handleUnfriend = async (friendAccountId: number) => {
    setBusyActionId(`unfriend-${friendAccountId}`)
    try {
      const res = await unfriend(friendAccountId)
      if (!res.ok) {
        toast.error(res.loi || 'Lỗi khi hủy kết bạn.')
        return
      }
      toast.success('Đã hủy kết bạn.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi hủy kết bạn.')
    } finally {
      setBusyActionId(null)
    }
  }

  const handleBlock = async (targetAccountId: number) => {
    setBusyActionId(`block-${targetAccountId}`)
    try {
      const res = await blockUser(targetAccountId)
      if (!res.ok) {
        toast.error(res.loi || 'Lỗi khi chặn.')
        return
      }
      toast.success('Đã chặn người dùng.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi chặn.')
    } finally {
      setBusyActionId(null)
    }
  }

  const handleUnblock = async (targetAccountId: number) => {
    setBusyActionId(`unblock-${targetAccountId}`)
    try {
      const res = await unblockUser(targetAccountId)
      if (!res.ok) {
        toast.error(res.loi || 'Lỗi khi bỏ chặn.')
        return
      }
      toast.success('Đã bỏ chặn người dùng.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi bỏ chặn.')
    } finally {
      setBusyActionId(null)
    }
  }

  const handleJoinFriendRoom = (roomId: number) => {
    handleOpenChange(false)
    navigate(`/room/phong-${roomId}`)
  }

  const dangTim = searchState.status === 'searching'
  const ketQuaTimKiem =
    searchState.status === 'success' ? searchState.results : dangTim ? ketQuaDangHien : []

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <SheetTrigger data-testid="friends-drawer-trigger" render={<span className="inline-block cursor-pointer" />}>
          {trigger}
        </SheetTrigger>
      ) : isControlled ? null : (
        <SheetTrigger
          data-testid="friends-drawer-trigger"
          render={
            <Button
              variant="ghost"
              size="sm"
              className={cn('relative gap-1.5 text-text-secondary hover:text-text-primary', className)}
              aria-label="Mở danh sách bạn bè"
            />
          }
        >
          <Users />
          <span className="max-sm:sr-only">Bạn bè</span>
          {onlineFriendsCount > 0 && (
            <span className="size-2 rounded-full bg-success" title={`${onlineFriendsCount} bạn trực tuyến`} />
          )}
          {(incomingRequests.length > 0 || tinChuaDoc > 0) && (
            <Badge
              data-testid="pending-requests-badge"
              variant="destructive"
              className="h-4 min-w-4 px-1 text-[10px] font-semibold tabular-nums"
            >
              {incomingRequests.length + tinChuaDoc}
            </Badge>
          )}
        </SheetTrigger>
      )}

      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md [&_[data-slot=sheet-close]]:size-11">
        {dmFriend ? (
          <DMPanel
            friend={dmFriend}
            onBack={() => {
              setDmFriend(null)
              setTinChuaDoc(demTinChuaDoc(friends))
            }}
          />
        ) : (
          <>
        <SheetHeader className="px-4 pt-4 pb-3 pr-16">
          <SheetTitle className="text-base font-semibold text-text-primary">Bạn bè</SheetTitle>
          <SheetDescription className="text-[0.8125rem] text-text-tertiary tabular-nums">
            {friends.length} bạn
            {presenceSanSang ? ` · ${onlineFriendsCount} đang trực tuyến` : ''}
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as TabBanBe)}
          className="min-h-0 flex-1 gap-3"
        >
          <div className="px-4">
            <TabsList>
              <TabsTrigger value="friends" data-testid="tab-friends">
                Bạn bè
                <span className="text-xs font-medium tabular-nums opacity-70">{friends.length}</span>
              </TabsTrigger>
              <TabsTrigger value="requests" data-testid="tab-requests">
                Lời mời
                {incomingRequests.length > 0 && (
                  <span className="min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] leading-4 font-semibold text-white tabular-nums">
                    {incomingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="search" data-testid="tab-search">
                Tìm bạn
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ════ BẠN BÈ ════ */}
          <TabsContent value="friends" className={KHUNG_TAB}>
            {friends.length === 0 ? (
              <TrangTrong
                fill
                icon={Users}
                title="Chưa có bạn bè"
                text="Tìm bạn học cùng trường và gửi lời mời kết bạn."
                action={
                  <Button size="sm" onClick={() => setActiveTab('search')}>
                    <Search />
                    Tìm bạn
                  </Button>
                }
              />
            ) : (
              <>
                {!presenceSanSang && (
                  <p
                    data-testid="drawer-presence-disconnected"
                    className="flex items-center gap-2 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning"
                  >
                    <span className="size-2 shrink-0 animate-pulse rounded-full bg-warning" />
                    {presenceView.freshness === 'stale'
                      ? 'Mất kết nối thời gian thực. Đang kết nối lại…'
                      : 'Đang đồng bộ trạng thái bạn bè…'}
                  </p>
                )}

                <DanhSach>
                  {friends.map((friend) => {
                    const presence = presenceSanSang ? friendsPresence[friend.id] : undefined
                    const status = presenceSanSang ? (presence?.state ?? 'offline') : 'unknown'
                    const isOnline = status === 'online'
                    const isAway = status === 'away'
                    const activity = presenceSanSang ? presence?.activity : undefined

                    return (
                      <li
                        key={friend.id}
                        data-testid={`friend-item-${friend.username}`}
                        className="flex min-w-0 flex-wrap items-start gap-3 px-3.5 py-3"
                      >
                        <DanhTinhNguoiDung>
                          <div className="relative mt-0.5 shrink-0">
                            <AnhDaiDien ten={friend.displayName} anh={friend.avatar} mo={status === 'offline'} />
                            <span
                              data-testid={`presence-dot-${friend.username}`}
                              className={cn(
                                'absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-surface',
                                !presenceSanSang
                                  ? 'bg-slate-600'
                                  : isOnline
                                    ? 'bg-emerald-500'
                                    : isAway
                                      ? 'bg-amber-400'
                                      : 'bg-slate-500',
                              )}
                              title={
                                !presenceSanSang
                                  ? presenceView.freshness === 'stale'
                                    ? 'Mất kết nối'
                                    : 'Đang đồng bộ'
                                  : isOnline
                                    ? 'Trực tuyến'
                                    : isAway
                                      ? 'Vắng mặt'
                                      : 'Ngoại tuyến'
                              }
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-baseline gap-x-1.5">
                              <span className="min-w-0 text-sm font-medium break-words text-text-primary">
                                {friend.displayName}
                              </span>
                              {friend.lopTen && <span className="text-xs text-text-tertiary">{friend.lopTen}</span>}
                            </p>

                            {!presenceSanSang ? (
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-tertiary">
                                <Clock className="size-3 shrink-0" />
                                {presenceView.freshness === 'stale' ? 'Mất kết nối thời gian thực' : 'Đang đồng bộ…'}
                              </p>
                            ) : activity ? (
                              <p
                                data-testid={`friend-activity-${friend.username}`}
                                className="mt-0.5 flex items-start gap-1.5 text-xs text-social"
                              >
                                <Radio className="mt-px size-3 shrink-0 text-success" />
                                <span className="min-w-0 break-words">
                                  {activity.type === 'room'
                                    ? activity.roomTitle
                                      ? `Đang trong: ${activity.roomTitle}`
                                      : 'Đang học nhóm'
                                    : 'Đang ở sảnh Campus'}
                                </span>
                              </p>
                            ) : (
                              <p
                                className={cn(
                                  'mt-0.5 text-xs',
                                  isOnline ? 'text-success' : isAway ? 'text-warning' : 'text-text-tertiary',
                                )}
                              >
                                {isOnline
                                  ? 'Đang trực tuyến'
                                  : isAway
                                    ? 'Đang tạm vắng'
                                    : formatLastSeen(presence?.lastSeen ?? null)}
                              </p>
                            )}

                            {presenceSanSang && activity?.roomId && (
                              <Button
                                data-testid={`join-friend-btn-${friend.username}`}
                                size="sm"
                                className="mt-2 min-h-10 whitespace-normal text-sm"
                                onClick={() => handleJoinFriendRoom(activity.roomId!)}
                              >
                                <DoorOpen />
                                Vào phòng
                              </Button>
                            )}
                          </div>
                        </DanhTinhNguoiDung>

                        <div className="flex shrink-0 flex-wrap items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            className="text-text-tertiary hover:text-brand"
                            title="Nhắn tin riêng"
                            aria-label={`Nhắn tin với ${friend.displayName}`}
                            onClick={() => setDmFriend(friend)}
                          >
                            <MessageSquare />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            className="text-text-tertiary hover:text-destructive"
                            title="Hủy kết bạn"
                            aria-label={`Hủy kết bạn với ${friend.displayName}`}
                            disabled={busyActionId === `unfriend-${friend.id}`}
                            onClick={() => handleUnfriend(friend.id)}
                          >
                            <UserX />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            className="text-text-tertiary hover:text-destructive"
                            title="Chặn người dùng"
                            aria-label={`Chặn ${friend.displayName}`}
                            disabled={busyActionId === `block-${friend.id}`}
                            onClick={() => handleBlock(friend.id)}
                          >
                            <Ban />
                          </Button>
                        </div>
                      </li>
                    )
                  })}
                </DanhSach>
              </>
            )}
          </TabsContent>

          {/* ════ LỜI MỜI ════ */}
          <TabsContent value="requests" className={KHUNG_TAB}>
            {incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
              <TrangTrong
                fill
                icon={UserPlus}
                title="Không có lời mời nào"
                text="Lời mời kết bạn bạn nhận được hoặc đã gửi sẽ hiện ở đây."
                action={
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('search')}>
                    <Search />
                    Tìm bạn
                  </Button>
                }
              />
            ) : (
              <>
                <section className="space-y-2">
                  <TieuDeNhom title="Đã nhận" count={incomingRequests.length} />
                  {incomingRequests.length === 0 ? (
                    <DongTrong>Không có lời mời nào đang chờ.</DongTrong>
                  ) : (
                    <DanhSach>
                      {incomingRequests.map((req) => {
                        const sender = req.sender
                        if (!sender) return null
                        const dangDongY = busyActionId === `accept-${req.id}`
                        return (
                          <li
                            key={req.id}
                            data-testid={`incoming-request-${sender.username}`}
                            className="flex min-w-0 flex-wrap items-center gap-3 px-3.5 py-3"
                          >
                            <DanhTinhNguoiDung>
                              <AnhDaiDien ten={sender.displayName} anh={sender.avatar} />
                              <NguoiDung ten={sender.displayName} username={sender.username} lop={sender.lopTen} />
                            </DanhTinhNguoiDung>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              <Button
                                data-testid={`accept-request-btn-${sender.username}`}
                                size="default"
                                className="min-h-10 whitespace-normal text-sm"
                                disabled={dangDongY}
                                onClick={() => handleAcceptRequest(req.id)}
                              >
                                {dangDongY ? <Loader2 className="animate-spin" /> : <Check />}
                                Đồng ý
                              </Button>
                              <Button
                                data-testid={`reject-request-btn-${sender.username}`}
                                variant="ghost"
                                size="icon-lg"
                                className="text-text-tertiary hover:text-destructive"
                                title="Từ chối kết bạn"
                                aria-label="Từ chối kết bạn"
                                disabled={busyActionId === `reject-${req.id}`}
                                onClick={() => handleRejectRequest(req.id)}
                              >
                                <X />
                              </Button>
                            </div>
                          </li>
                        )
                      })}
                    </DanhSach>
                  )}
                </section>

                <section className="space-y-2">
                  <TieuDeNhom title="Đã gửi" count={outgoingRequests.length} />
                  {outgoingRequests.length === 0 ? (
                    <DongTrong>Chưa gửi lời mời nào.</DongTrong>
                  ) : (
                    <DanhSach>
                      {outgoingRequests.map((req) => {
                        const receiver = req.receiver
                        if (!receiver) return null
                        return (
                          <li
                            key={req.id}
                            data-testid={`outgoing-request-${receiver.username}`}
                            className="flex min-w-0 flex-wrap items-center gap-3 px-3.5 py-3"
                          >
                            <DanhTinhNguoiDung>
                              <AnhDaiDien ten={receiver.displayName} anh={receiver.avatar} />
                              <NguoiDung ten={receiver.displayName} username={receiver.username} lop={receiver.lopTen} />
                            </DanhTinhNguoiDung>
                            <Button
                              data-testid={`cancel-request-btn-${receiver.username}`}
                              variant="outline"
                              size="sm"
                              className="min-h-10 shrink-0 whitespace-normal text-sm"
                              disabled={busyActionId === `cancel-${req.id}`}
                              onClick={() => handleCancelRequest(req.id)}
                            >
                              Hủy
                            </Button>
                          </li>
                        )
                      })}
                    </DanhSach>
                  )}
                </section>
              </>
            )}
          </TabsContent>

          {/* ════ TÌM BẠN ════ */}
          <TabsContent value="search" className={KHUNG_TAB}>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                data-testid="search-user-input"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Tên hoặc tên đăng nhập"
                aria-label="Tìm bạn học theo tên hoặc tên đăng nhập"
                maxLength={50}
                enterKeyHint="search"
                autoComplete="off"
                className="h-10 pr-9 pl-9"
              />
              {dangTim && (
                <Loader2
                  aria-hidden
                  className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-text-tertiary"
                />
              )}
            </div>

            {searchState.status === 'idle' && (
              <DongTrong className="py-4 text-center">Gõ tên hoặc tên đăng nhập để tìm bạn cùng trường.</DongTrong>
            )}

            {dangTim && ketQuaTimKiem.length === 0 && (
              <div
                data-testid="search-searching-state"
                className="flex items-center justify-center gap-2 py-6 text-xs text-text-tertiary"
              >
                <Loader2 className="size-4 animate-spin" />
                Đang tìm…
              </div>
            )}

            {searchState.status === 'empty' && (
              <p data-testid="search-empty-state" className="px-1 py-4 text-center text-xs break-words text-text-tertiary">
                Không tìm thấy ai khớp với “{searchState.query}”.
              </p>
            )}

            {searchState.status === 'error' && (
              <div
                data-testid="search-error-state"
                className="space-y-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-center"
              >
                <p className="flex items-start justify-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span className="break-words">{searchState.error}</span>
                </p>
                <Button size="sm" variant="outline" data-testid="search-retry-btn" onClick={handleRetrySearch}>
                  <RefreshCw />
                  Thử lại
                </Button>
              </div>
            )}

            {ketQuaTimKiem.length > 0 && (
              <DanhSach className={cn('transition-opacity', dangTim && 'opacity-60')} aria-busy={dangTim || undefined}>
                {ketQuaTimKiem.map((user) => (
                  <li
                    key={user.id}
                    data-testid={`search-result-${user.username}`}
                    className="flex min-w-0 flex-wrap items-center gap-3 px-3.5 py-3"
                  >
                    <DanhTinhNguoiDung>
                                <AnhDaiDien ten={user.displayName} anh={user.avatar} />
                      <NguoiDung ten={user.displayName} username={user.username} lop={user.lopTen} />
                    </DanhTinhNguoiDung>
                    <QuanHe
                      user={user}
                      dangGui={busyActionId === `send-${user.id}`}
                      onKetBan={() => handleSendRequest(user.id)}
                      onXemLoiMoi={() => setActiveTab('requests')}
                    />
                  </li>
                ))}
              </DanhSach>
            )}

            {/* Người đã chặn: bỏ chặn tại đây (máy chủ ẩn họ khỏi kết quả tìm kiếm) */}
            {blockedUsers.length > 0 && (
              <section className="space-y-2 pt-2">
                <TieuDeNhom title="Đã chặn" count={blockedUsers.length} />
                <DanhSach>
                  {blockedUsers.map((b) => (
                    <li key={b.id} className="flex min-w-0 flex-wrap items-center gap-3 px-3.5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm break-words text-text-secondary">{b.displayName}</p>
                        <p className="text-xs break-words text-text-tertiary">@{b.username}</p>
                      </div>
                      <Button
                        data-testid={`unblock-btn-${b.username}`}
                        variant="outline"
                        size="sm"
                        className="min-h-10 shrink-0 whitespace-normal text-sm"
                        disabled={busyActionId === `unblock-${b.id}`}
                        onClick={() => handleUnblock(b.id)}
                      >
                        Bỏ chặn
                      </Button>
                    </li>
                  ))}
                </DanhSach>
              </section>
            )}
          </TabsContent>
        </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// DMPanel — Panel nhắn tin 1-1 với bạn bè, có avatar + tên từng tin nhắn
// ────────────────────────────────────────────────────────────────────────────
function DMPanel({ friend, onBack }: { friend: FriendItem; onBack: () => void }) {
  const { nguoiDung } = usePhien()
  const [msgs, setMsgs] = useState<TinDM[]>(() => layDMTuSession(friend.id))
  const [noiDung, setNoiDung] = useState('')
  const [hienEmoji, setHienEmoji] = useState(false)
  const cuonRef = useRef<HTMLDivElement | null>(null)

  // Đánh dấu đã xem khi mở panel
  useEffect(() => {
    sessionStorage.setItem(`dm_viewed_${friend.id}`, Date.now().toString())
  }, [friend.id])

  // Tự cuộn xuống cuối khi có tin mới
  useEffect(() => {
    const el = cuonRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs.length])

  const xuLyGui = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = noiDung.trim()
    if (!text) return
    const tin: TinDM = {
      id: `dm_${Date.now()}_${Math.random()}`,
      fromMe: true,
      text,
      taoLuc: Date.now(),
      ten: nguoiDung?.ten || nguoiDung?.username || 'Tôi',
      avatar: nguoiDung?.avatar ?? null,
    }
    const next = [...msgs, tin]
    setMsgs(next)
    luuDMVaoSession(friend.id, next)
    setNoiDung('')
    setHienEmoji(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-4 py-3 pr-16">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-raised hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Quay lại"
        >
          <ArrowLeft className="size-4" />
        </button>
        <AnhDaiDien ten={friend.displayName} anh={friend.avatar ?? null} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary truncate">{friend.displayName}</p>
          {friend.lopTen && <p className="text-xs text-text-tertiary">{friend.lopTen}</p>}
        </div>
      </div>

      {/* Danh sách tin nhắn */}
      <div
        ref={cuonRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3"
      >
        {msgs.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
            <MessageSquare className="size-8 text-text-tertiary opacity-40 mb-2" />
            <p className="text-xs text-text-tertiary">Bắt đầu cuộc trò chuyện với {friend.displayName}</p>
          </div>
        ) : (
          msgs.map((m) => {
            const isMe = m.fromMe
            const tenNguoiGui = isMe ? (m.ten || nguoiDung?.ten || nguoiDung?.username || 'Tôi') : (m.ten || friend.displayName)
            const avatarNguoiGui = isMe ? (m.avatar ?? nguoiDung?.avatar ?? null) : (m.avatar ?? friend.avatar ?? null)
            return (
              <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <AnhDaiDien ten={tenNguoiGui} anh={avatarNguoiGui} />
                <div className={`flex max-w-[75%] flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Tên + giờ */}
                  <div className={`mb-0.5 flex items-baseline gap-1.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11px] font-semibold text-text-secondary">{tenNguoiGui}</span>
                    <time className="text-[10px] tabular-nums text-text-tertiary">
                      {DINH_DANG_GIO_DM.format(m.taoLuc)}
                    </time>
                  </div>
                  {/* Bubble */}
                  <p
                    className={`rounded-2xl px-3 py-2 text-[0.8125rem] leading-relaxed break-words whitespace-pre-wrap text-text-primary ${
                      isMe ? 'rounded-br-md bg-brand/15' : 'rounded-bl-md bg-surface-raised'
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input gửi tin */}
      <form
        onSubmit={xuLyGui}
        className="shrink-0 border-t border-border-subtle p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        {hienEmoji && (
          <div className="mb-2 grid grid-cols-6 gap-1 rounded-xl border border-border-subtle bg-surface-raised p-2">
            {DANH_SACH_EMOJI_DM.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setNoiDung((p) => p + em)}
                className="flex size-9 items-center justify-center text-xl rounded-lg hover:bg-white/10 transition-colors active:scale-95"
              >
                {em}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHienEmoji((p) => !p)}
            className="shrink-0 flex size-9 items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-raised hover:text-white transition-colors"
            title="Chèn biểu cảm"
          >
            <Smile className="size-5" />
          </button>
          <input
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value.slice(0, 500))}
            placeholder={`Nhắn ${friend.displayName}…`}
            className="min-w-0 flex-1 rounded-xl border border-border-subtle bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none transition-colors"
            maxLength={500}
            enterKeyHint="send"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!noiDung.trim()}
            className="shrink-0 flex size-9 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-40 hover:bg-brand/85 transition-colors"
            aria-label="Gửi"
          >
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

function DanhSach({ className, children, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle', className)}
      {...props}
    >
      {children}
    </ul>
  )
}

function TieuDeNhom({ title, count }: { title: string; count: number }) {
  return (
    <h3 className="flex items-baseline gap-2 px-1 text-[0.8125rem] font-semibold text-text-primary">
      {title}
      <span className="text-xs font-medium tabular-nums text-text-tertiary">{count}</span>
    </h3>
  )
}

function DongTrong({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('px-1 text-xs text-text-tertiary', className)}>{children}</p>
}

function TrangTrong({
  icon: Icon,
  title,
  text,
  action,
  fill,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  text: string
  action?: ReactNode
  /** Chiếm trọn khung tab để trạng thái trống nằm giữa, không dồn lên đầu. */
  fill?: boolean
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 text-center', fill && 'min-h-full')}>
      <span className="flex size-11 items-center justify-center rounded-2xl bg-surface-raised text-text-tertiary">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-text-primary">{title}</p>
      <p className="mt-1 max-w-64 text-xs leading-relaxed text-text-tertiary">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

function AnhDaiDien({ ten, anh, mo }: { ten: string; anh: string | null; mo?: boolean }) {
  if (anh) {
    return <img src={anh} alt="" className={cn('size-10 shrink-0 rounded-full object-cover', mo && 'opacity-60 grayscale')} />
  }
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-xs font-semibold text-text-secondary',
        mo && 'opacity-70',
      )}
    >
      {getInitials(ten)}
    </span>
  )
}

function DanhTinhNguoiDung({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 grow basis-48 items-start gap-3">{children}</div>
}

function NguoiDung({ ten, username, lop }: { ten: string; username: string; lop: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium break-words text-text-primary">{ten}</p>
      <p className="text-xs break-words text-text-tertiary">
        @{username}
        {lop ? ` · ${lop}` : ''}
      </p>
    </div>
  )
}

function QuanHe({
  user,
  dangGui,
  onKetBan,
  onXemLoiMoi,
}: {
  user: SearchResultItem
  dangGui: boolean
  onKetBan: () => void
  onXemLoiMoi: () => void
}) {
  switch (user.relationshipStatus) {
    case 'self':
      return <span className="shrink-0 text-xs text-text-tertiary">Bạn</span>
    case 'friend':
      return (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-success">
          <UserCheck className="size-3.5" />
          Bạn bè
        </span>
      )
    case 'pending_sent':
      return <span className="shrink-0 text-xs font-medium text-warning">Đã gửi</span>
    case 'pending_received':
      // Họ đã mời mình — đưa thẳng tới tab Lời mời để đồng ý
      return (
        <Button size="sm" variant="outline" className="min-h-10 shrink-0 whitespace-normal text-sm" onClick={onXemLoiMoi}>
          Xem lời mời
        </Button>
      )
    case 'blocked':
      return <span className="shrink-0 text-xs font-medium text-destructive">Đã chặn</span>
    default:
      return (
        <Button
          data-testid={`add-friend-btn-${user.username}`}
          size="sm"
          className="min-h-10 shrink-0 whitespace-normal text-sm"
          disabled={dangGui}
          onClick={onKetBan}
        >
          {dangGui ? <Loader2 className="animate-spin" /> : <UserPlus />}
          Kết bạn
        </Button>
      )
  }
}
