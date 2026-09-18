import { useState, useTransition } from 'react'
import { useNavigate } from 'react-router'
import {
  UserCheck,
  UserPlus,
  Users,
  Search,
  Check,
  X,
  UserX,
  Ban,
  Radio,
  DoorOpen,
  Clock,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'

import { useCampusContext } from '@/app/CampusContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { timKiemNguoiDung } from '@/lib/api'
import type { SearchResultItem } from '@shared/protocol/social'

function formatLastSeen(ts: number | null): string {
  if (!ts) return 'Ngoại tuyến'
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Vừa mới đây'
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

interface FriendsDrawerProps {
  className?: string
}

export function FriendsDrawer({ className }: FriendsDrawerProps) {
  const navigate = useNavigate()
  const {
    socialState,
    friendsPresence,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    unfriend,
    blockUser,
    unblockUser,
  } = useCampusContext()

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([])
  const [isSearching, startSearchTransition] = useTransition()
  const [busyActionId, setBusyActionId] = useState<string | null>(null)

  const incomingRequests = socialState?.incomingRequests ?? []
  const outgoingRequests = socialState?.outgoingRequests ?? []
  const friends = socialState?.friends ?? []
  const blockedUsers = socialState?.blockedUsers ?? []

  // Count online friends
  const onlineFriendsCount = friends.filter((f) => {
    const p = friendsPresence[f.id]
    return p && (p.state === 'online' || p.state === 'away')
  }).length

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults([])
      return
    }
    startSearchTransition(async () => {
      try {
        const results = await timKiemNguoiDung(trimmed)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      }
    })
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
      setSearchResults((prev) =>
        prev.map((item) =>
          item.id === targetId ? { ...item, relationshipStatus: 'pending_sent' } : item,
        ),
      )
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
    setOpen(false)
    navigate(`/room/phong-${roomId}`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        data-testid="friends-drawer-trigger"
        render={
          <Button
            variant="ghost"
            size="sm"
            className={`relative h-9 gap-1.5 px-3 text-xs font-medium text-slate-300 hover:text-white ${className || ''}`}
            aria-label="Mở danh sách bạn bè"
          />
        }
      >
        <Users className="h-4 w-4 text-indigo-400" />
        <span className="hidden sm:inline">Bạn bè</span>
        {onlineFriendsCount > 0 && (
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" title={`${onlineFriendsCount} bạn trực tuyến`} />
        )}
        {incomingRequests.length > 0 && (
          <Badge
            data-testid="pending-requests-badge"
            variant="destructive"
            className="ml-0.5 h-4 min-w-4 px-1 text-[10px] font-bold"
          >
            {incomingRequests.length}
          </Badge>
        )}
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md border-l border-white/10 bg-[#0c121e]/95 p-0 text-slate-200 backdrop-blur-xl flex flex-col"
      >
        <SheetHeader className="border-b border-white/10 p-4 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold text-white">
              <Users className="h-5 w-5 text-indigo-400" />
              Bạn bè & Kết nối
            </SheetTitle>
          </div>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'friends' | 'requests' | 'search')}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="grid grid-cols-3 mx-4 my-3 bg-white/5 p-1 rounded-xl shrink-0">
            <TabsTrigger
              value="friends"
              data-testid="tab-friends"
              className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Bạn bè ({friends.length})
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              data-testid="tab-requests"
              className="text-xs relative data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Lời mời
              {incomingRequests.length > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {incomingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="search"
              data-testid="tab-search"
              className="text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Tìm bạn
            </TabsTrigger>
          </TabsList>

          {/* ════ TAB 1: DANH SÁCH BẠN BÈ ════ */}
          <TabsContent value="friends" className="flex-1 overflow-y-auto px-4 pb-4 mt-0 space-y-2">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                <Users className="h-10 w-10 text-slate-500 mb-2 opacity-60" />
                <p className="text-sm font-medium">Chưa có bạn bè nào</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Chuyển sang tab Tìm bạn để tìm bạn học trên campus và gửi lời mời kết bạn!
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 border-white/15 bg-white/5 text-xs text-indigo-300"
                  onClick={() => setActiveTab('search')}
                >
                  <Search className="h-3.5 w-3.5 mr-1" />
                  Tìm bạn ngay
                </Button>
              </div>
            ) : (
              friends.map((friend) => {
                const presence = friendsPresence[friend.id]
                const status = presence?.state ?? 'offline'
                const isOnline = status === 'online'
                const isAway = status === 'away'
                const activity = presence?.activity

                return (
                  <div
                    key={friend.id}
                    data-testid={`friend-item-${friend.username}`}
                    className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Avatar & Presence */}
                      <div className="relative shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white border border-white/10 overflow-hidden">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.username} className="h-full w-full object-cover" />
                          ) : (
                            friend.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Status Dot */}
                        <span
                          data-testid={`presence-dot-${friend.username}`}
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#0c121e] ${
                            isOnline
                              ? 'bg-emerald-500'
                              : isAway
                              ? 'bg-amber-400'
                              : 'bg-slate-500'
                          }`}
                          title={isOnline ? 'Trực tuyến' : isAway ? 'Vắng mặt' : 'Ngoại tuyến'}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-white">
                            {friend.displayName}
                          </p>
                          {friend.lopTen && (
                            <span className="shrink-0 rounded bg-white/10 px-1 py-0.2 text-[10px] text-slate-300">
                              {friend.lopTen}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">@{friend.username}</p>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-rose-400"
                          title="Hủy kết bạn"
                          disabled={busyActionId === `unfriend-${friend.id}`}
                          onClick={() => handleUnfriend(friend.id)}
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-red-500"
                          title="Chặn người dùng"
                          disabled={busyActionId === `block-${friend.id}`}
                          onClick={() => handleBlock(friend.id)}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Activity or Last seen status */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                      {activity ? (
                        <div className="flex items-center gap-1.5 text-indigo-300 truncate" data-testid={`friend-activity-${friend.username}`}>
                          <Radio className="h-3 w-3 shrink-0 text-emerald-400 animate-pulse" />
                          <span className="truncate">
                            {activity.type === 'room'
                              ? activity.roomTitle
                                ? `Đang trong: ${activity.roomTitle}`
                                : 'Đang học nhóm'
                              : 'Đang ở sảnh Campus'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {isOnline
                              ? 'Đang trực tuyến'
                              : isAway
                              ? 'Đang tạm vắng'
                              : formatLastSeen(presence?.lastSeen ?? null)}
                          </span>
                        </div>
                      )}

                      {/* Join Friend Button */}
                      {activity?.roomId && (
                        <Button
                          data-testid={`join-friend-btn-${friend.username}`}
                          size="sm"
                          className="h-6 px-2 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg gap-1 shrink-0"
                          onClick={() => handleJoinFriendRoom(activity.roomId!)}
                        >
                          <DoorOpen className="h-3 w-3" />
                          Vào phòng
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </TabsContent>

          {/* ════ TAB 2: LỜI MỜI KẾT BẠN ════ */}
          <TabsContent value="requests" className="flex-1 overflow-y-auto px-4 pb-4 mt-0 space-y-4">
            {/* Lời mời đã nhận */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Lời mời đã nhận ({incomingRequests.length})
              </h4>
              {incomingRequests.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Không có lời mời nào đang chờ.</p>
              ) : (
                incomingRequests.map((req) => {
                  const sender = req.sender
                  if (!sender) return null
                  return (
                    <div
                      key={req.id}
                      data-testid={`incoming-request-${sender.username}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white border border-white/10 overflow-hidden">
                          {sender.avatar ? (
                            <img src={sender.avatar} alt={sender.username} className="h-full w-full object-cover" />
                          ) : (
                            sender.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">
                            {sender.displayName}
                          </p>
                          <p className="text-[11px] text-slate-400">@{sender.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          data-testid={`accept-request-btn-${sender.username}`}
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg gap-1"
                          disabled={busyActionId === `accept-${req.id}`}
                          onClick={() => handleAcceptRequest(req.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Đồng ý
                        </Button>
                        <Button
                          data-testid={`reject-request-btn-${sender.username}`}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-400"
                          disabled={busyActionId === `reject-${req.id}`}
                          onClick={() => handleRejectRequest(req.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Lời mời đã gửi */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Đã gửi ({outgoingRequests.length})
              </h4>
              {outgoingRequests.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Chưa gửi lời mời nào.</p>
              ) : (
                outgoingRequests.map((req) => {
                  const receiver = req.receiver
                  if (!receiver) return null
                  return (
                    <div
                      key={req.id}
                      data-testid={`outgoing-request-${receiver.username}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white border border-white/10 overflow-hidden">
                          {receiver.avatar ? (
                            <img src={receiver.avatar} alt={receiver.username} className="h-full w-full object-cover" />
                          ) : (
                            receiver.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-white">
                            {receiver.displayName}
                          </p>
                          <p className="text-[11px] text-slate-400">@{receiver.username}</p>
                        </div>
                      </div>

                      <Button
                        data-testid={`cancel-request-btn-${receiver.username}`}
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs border-white/10 bg-white/5 text-slate-300 hover:text-white"
                        disabled={busyActionId === `cancel-${req.id}`}
                        onClick={() => handleCancelRequest(req.id)}
                      >
                        Hủy
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* ════ TAB 3: TÌM BẠN HỌC ════ */}
          <TabsContent value="search" className="flex-1 overflow-y-auto px-4 pb-4 mt-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                data-testid="search-user-input"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Nhập tên hoặc username..."
                className="pl-9 h-9 border-white/15 bg-white/5 text-xs text-white placeholder:text-slate-500 rounded-xl"
              />
            </div>

            {isSearching && (
              <p className="text-xs text-slate-400 text-center py-4">Đang tìm kiếm…</p>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
              <p className="text-xs text-slate-500 text-center py-6">
                Không tìm thấy tài khoản nào khớp với &quot;{searchQuery}&quot;
              </p>
            )}

            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  data-testid={`search-result-${user.username}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white border border-white/10 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                      ) : (
                        user.displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-white">
                          {user.displayName}
                        </p>
                        {user.lopTen && (
                          <span className="shrink-0 rounded bg-white/10 px-1 py-0.2 text-[10px] text-slate-300">
                            {user.lopTen}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">@{user.username}</p>
                    </div>
                  </div>

                  {user.relationshipStatus === 'self' ? (
                    <Badge variant="outline" className="text-[10px] border-white/15 text-slate-400">
                      Bạn
                    </Badge>
                  ) : user.relationshipStatus === 'friend' ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Bạn bè
                    </Badge>
                  ) : user.relationshipStatus === 'pending_sent' ? (
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">
                      Đã gửi
                    </Badge>
                  ) : user.relationshipStatus === 'pending_received' ? (
                    <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                      Đang chờ bạn
                    </Badge>
                  ) : user.relationshipStatus === 'blocked' ? (
                    <Badge variant="outline" className="text-[10px] border-rose-500/30 text-rose-400">
                      Đã chặn
                    </Badge>
                  ) : (
                    <Button
                      data-testid={`add-friend-btn-${user.username}`}
                      size="sm"
                      className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg gap-1"
                      disabled={busyActionId === `send-${user.id}`}
                      onClick={() => handleSendRequest(user.id)}
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Kết bạn
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Danh sách người dùng đã chặn */}
            {blockedUsers.length > 0 && (
              <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                <h4 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Đã chặn ({blockedUsers.length})
                </h4>
                {blockedUsers.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5"
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-300">{b.displayName}</p>
                      <p className="text-[10px] text-slate-500">@{b.username}</p>
                    </div>
                    <Button
                      data-testid={`unblock-btn-${b.username}`}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px] border-white/15 bg-white/5 text-slate-300 hover:text-white"
                      disabled={busyActionId === `unblock-${b.id}`}
                      onClick={() => handleUnblock(b.id)}
                    >
                      Bỏ chặn
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
