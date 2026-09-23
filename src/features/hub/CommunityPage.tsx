import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FriendsDrawer } from '@/components/social/FriendsDrawer'
import {
  derivePresenceView,
  formatLastSeen,
} from '@/features/hub/social-semantics'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  DoorOpen,
  MessageSquare,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react'

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

  const [drawerOpen, setDrawerOpen] = useState(false)
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

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* ── 1. Top Action Bar: People-First & Action-Oriented (No Giant Marketing Hero) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-social/5 p-4 sm:p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
              <Users className="h-6 w-6 text-social shrink-0" />
              <span>Cộng đồng bạn học</span>
            </h1>
            {(socialStatus === 'ready' || socialStatus === 'degraded') && (
              <Badge variant="outline" className="text-xs border-social/30 text-social bg-social/10 font-medium">
                {friends.length} bạn
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {trangThai === 'dang_ket_noi' || trangThai === 'mat_ket_noi' ? (
              <span className="inline-flex items-center gap-1.5 text-warning font-medium">
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                Đang kết nối lại sảnh cộng đồng…
              </span>
            ) : !presenceReady ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground font-medium">
                <Radio className="h-3 w-3 animate-pulse" />
                Đang đồng bộ hoạt động bạn bè…
              </span>
            ) : totalActive > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-success font-medium">
                <span className="h-2 w-2 rounded-full bg-success animate-ping" />
                {totalActive} bạn bè đang hoạt động ngay bây giờ
              </span>
            ) : (
              <span>Kết nối và đồng hành học tập cùng bạn bè trong trường</span>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {incomingRequests.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              data-testid="community-pending-requests-cta"
              onClick={() => openDrawerTab('requests')}
              className="h-8 text-xs font-semibold gap-1.5 border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{incomingRequests.length} lời mời kết bạn</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            data-testid="community-find-friends-cta"
            onClick={() => openDrawerTab('search')}
            className="h-8 text-xs font-medium gap-1.5 border-border/80 hover:bg-accent hover:text-accent-foreground"
          >
            <Search className="h-3.5 w-3.5 text-social" />
            <span>Tìm bạn học</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            data-testid="community-open-chat-cta"
            onClick={handleOpenChat}
            className="h-8 text-xs font-medium gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Trò chuyện trường</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Data Truth States: Loading, Error, Degraded, Empty, Ready ── */}

      {/* Degraded Refresh Banner (Preserves existing data without fake fresh claim) */}
      {socialStatus === 'degraded' && (
        <div
          data-testid="community-degraded-banner"
          className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Dữ liệu bạn bè chưa được cập nhật mới nhất do sự cố kết nối máy chủ.</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            data-testid="community-degraded-retry-btn"
            onClick={() => void retrySocialLoad()}
            className="h-7 text-xs font-semibold gap-1 text-warning hover:bg-warning/20 shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {/* STATE A: Loading Skeleton */}
      {socialStatus === 'loading' && (
        <div data-testid="community-loading" className="space-y-4">
          <div className="h-4 w-40 bg-muted/40 rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted/50 animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 w-28 bg-muted/50 rounded animate-pulse" />
                    <div className="h-2.5 w-16 bg-muted/40 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* STATE B: Error with Retry */}
      {socialStatus === 'error' && (
        <div
          data-testid="community-error"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3"
        >
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/25">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">Không thể tải dữ liệu mạng xã hội</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {socialError || 'Đã xảy ra sự cố khi kết nối tới máy chủ. Vui lòng kiểm tra lại đường truyền mạng của bạn.'}
            </p>
          </div>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              data-testid="community-retry-btn"
              onClick={() => void retrySocialLoad()}
              className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Thử lại</span>
            </Button>
          </div>
        </div>
      )}

      {/* STATE C: Authoritative Empty State */}
      {(socialStatus === 'ready' || socialStatus === 'degraded') && friends.length === 0 && (
        <div data-testid="community-empty" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EmptyState
              icon={Users}
              title="Chưa có bạn bè trong danh bạ"
              description="Tìm kiếm bạn học cùng lớp hoặc trong trường để kết nối, cùng tham gia phòng học nhóm và chia sẻ kiến thức!"
              action={
                <Button
                  size="sm"
                  data-testid="empty-find-friends-btn"
                  onClick={() => openDrawerTab('search')}
                  className="gap-1.5 bg-social text-white hover:bg-social/90"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Tìm bạn học ngay</span>
                </Button>
              }
            />
          </div>

          {/* Canonical Study Room Companion */}
          <div className="space-y-4">
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Phòng Tự Học Digital Campus</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tham gia các phòng tự học đang mở hoặc tự tạo phòng học riêng theo môn học để cùng bạn bè ôn bài.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="community-go-learning-cta"
                  onClick={() => navigate('/learn')}
                  className="w-full text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <DoorOpen className="h-3.5 w-3.5" />
                  <span>Vào khu vực tự học</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* STATE D: Ready/Degraded with Friends */}
      {(socialStatus === 'ready' || socialStatus === 'degraded') && friends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Friends Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Realtime Disconnected / Reconnecting State Banner */}
            {presenceView.freshness === 'stale' && (
              <div
                data-testid="presence-disconnected-banner"
                className="flex items-center gap-2.5 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning font-medium"
              >
                <span className="h-2 w-2 rounded-full bg-warning animate-pulse shrink-0" />
                <span>Trạng thái trực tuyến và phòng học đang kết nối lại…</span>
              </div>
            )}

            {/* Presence Loading State Banner */}
            {presenceView.freshness === 'unknown' && (
              <div
                data-testid="presence-unknown-banner"
                className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground"
              >
                <Radio className="h-3.5 w-3.5 text-muted-foreground animate-pulse shrink-0" />
                <span>Đang tải thông tin hoạt động trực tuyến của bạn bè…</span>
              </div>
            )}

            {/* When presence freshness is NOT ready: Render unconfirmed friend list (without fake online/offline/inRoom) */}
            {presenceView.freshness !== 'ready' && (
              <div className="space-y-3" data-testid="friends-unconfirmed-list">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-social" />
                    <span>Danh sách bạn bè ({friends.length})</span>
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {presenceView.freshness === 'stale' ? 'Trạng thái đang kết nối lại' : 'Đang tải trạng thái'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends.map((friend) => (
                    <Card
                      key={friend.id}
                      data-testid={`friend-unconfirmed-${friend.username}`}
                      className="border-border/60 bg-card hover:border-border transition-all shadow-xs"
                    >
                      <CardContent className="flex items-center justify-between p-3.5 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {friend.avatar ? (
                              <img
                                src={friend.avatar}
                                alt={friend.displayName}
                                className="h-10 w-10 rounded-full object-cover border border-border/80"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground border border-border/80 uppercase">
                                {friend.displayName.slice(0, 2)}
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-slate-500" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-foreground">
                              {friend.displayName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              @{friend.username}{friend.lopTen ? ` · ${friend.lopTen}` : ''}
                            </p>
                          </div>
                        </div>

                        <Badge variant="outline" className="text-[10px] shrink-0 font-medium text-muted-foreground border-border/60">
                          {presenceView.freshness === 'stale' ? 'Mất kết nối' : 'Đang tải'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Authoritative Live Presence Sections (ONLY rendered when freshness === 'ready') */}
            {presenceView.freshness === 'ready' && presenceView.inRoom.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-social/25 pb-2">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Radio className="h-4 w-4 text-social animate-pulse" />
                    <span>Đang trong phòng học ({presenceView.inRoom.length})</span>
                  </h2>
                  <span className="text-xs font-medium text-social">Cùng tham gia học tập</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presenceView.inRoom.map(({ friend, roomId, roomTitle }) => (
                    <Card
                      key={friend.id}
                      data-testid={`friend-in-room-${friend.username}`}
                      className="border-social/40 bg-gradient-to-br from-card to-social/5 hover:border-social/60 transition-all shadow-xs"
                    >
                      <CardContent className="flex items-center justify-between p-3.5 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {friend.avatar ? (
                              <img
                                src={friend.avatar}
                                alt={friend.displayName}
                                className="h-10 w-10 rounded-full object-cover border border-social/40"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-social/15 text-xs font-bold text-social border border-social/30 uppercase">
                                {friend.displayName.slice(0, 2)}
                              </div>
                            )}
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-foreground">
                              {friend.displayName}
                            </p>
                            <p className="text-[11px] text-social truncate font-medium">
                              {roomTitle ? `Phòng: ${roomTitle}` : 'Đang trong phòng học'}
                            </p>
                            {friend.lopTen && (
                              <span className="text-[10px] text-muted-foreground">{friend.lopTen}</span>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          data-testid={`join-room-btn-${friend.username}`}
                          onClick={() => navigate(`/room/phong-${roomId}`)}
                          className="h-7 px-2.5 text-[11px] gap-1 bg-social text-white hover:bg-social/90 shrink-0 font-semibold shadow-xs"
                        >
                          <DoorOpen className="h-3 w-3" />
                          <span>Vào phòng</span>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Section 2: Bạn đang trực tuyến / tạm vắng tại sảnh ── */}
            {presenceView.freshness === 'ready' && presenceView.online.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span>Đang trực tuyến ({presenceView.online.length})</span>
                  </h2>
                  <span className="text-xs text-muted-foreground">Sẵn sàng kết nối</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presenceView.online.map(({ friend, isAway }) => (
                    <Card
                      key={friend.id}
                      data-testid={`friend-online-${friend.username}`}
                      className="border-border/60 bg-card hover:border-border transition-all shadow-xs"
                    >
                      <CardContent className="flex items-center justify-between p-3.5 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {friend.avatar ? (
                              <img
                                src={friend.avatar}
                                alt={friend.displayName}
                                className="h-10 w-10 rounded-full object-cover border border-border/80"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground border border-border/80 uppercase">
                                {friend.displayName.slice(0, 2)}
                              </div>
                            )}
                            <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                                isAway ? 'bg-warning' : 'bg-success'
                              }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-foreground">
                              {friend.displayName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              @{friend.username}{friend.lopTen ? ` · ${friend.lopTen}` : ''}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={isAway ? 'warning' : 'success'}
                          className="text-[10px] shrink-0 font-medium"
                        >
                          {isAway ? 'Tạm vắng' : 'Trực tuyến'}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ── Section 3: Bạn bè ngoại tuyến ── */}
            {presenceView.freshness === 'ready' && presenceView.offline.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h2 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Ngoại tuyến ({presenceView.offline.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {presenceView.offline.map(({ friend, presence }) => (
                    <div
                      key={friend.id}
                      data-testid={`friend-offline-${friend.username}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          {friend.avatar ? (
                            <img
                              src={friend.avatar}
                              alt={friend.displayName}
                              className="h-8 w-8 rounded-full object-cover grayscale opacity-70 border border-border/60"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium border border-border/60 uppercase">
                              {friend.displayName.slice(0, 2)}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-card bg-muted-foreground/40" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-foreground/80">
                            {friend.displayName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {friend.lopTen ? `${friend.lopTen} · ` : ''}{formatLastSeen(presence?.lastSeen)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Companion Column (1 Col) */}
          <div className="space-y-4">
            {/* Quick Link to Study Hub (Canonical Route /learn) */}
            <Card className="border-border/80 bg-card shadow-xs">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Phòng Tự Học Digital Campus</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cùng bạn bè mở phòng tự học, ôn bài và thảo luận tài liệu bài giảng trực tuyến.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="community-go-learning-sidebar-cta"
                  onClick={() => navigate('/learn')}
                  className="w-full text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <DoorOpen className="h-3.5 w-3.5" />
                  <span>Vào khu vực tự học</span>
                </Button>
              </CardContent>
            </Card>

            {/* Community Standards & Safety Note */}
            <Card className="border-border/60 bg-muted/20">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Môi trường học tập thân thiện</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tôn trọng bạn học, giữ gìn văn minh trong giao tiếp. Tính năng chặn và báo cáo luôn sẵn sàng khi cần thiết.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Controlled FriendsDrawer for on-demand tabs */}
      <FriendsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        defaultTab={drawerDefaultTab}
      />
    </div>
  )
}
