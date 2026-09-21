import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { FriendsDrawer } from '@/components/social/FriendsDrawer'
import {
  DoorOpen,
  Radio,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'

export function CommunityPage() {
  const navigate = useNavigate()
  const { socialState, presenceMap } = useCampus()

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const incomingRequests = useMemo(
    () => socialState?.incomingRequests ?? [],
    [socialState?.incomingRequests],
  )

  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const presence = presenceMap[f.id]
      return presence && (presence.state === 'online' || presence.state === 'away')
    })
  }, [friends, presenceMap])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── 1. Art-Directed Community Hero Banner ───────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-social/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6">
          <div className="max-w-xl space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-social/30 bg-social/15 px-3 py-1 text-xs font-semibold text-social-foreground backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-social" />
              <span>Không gian Kết Nối & Đồng Hành Học Tập</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Cộng Đồng Học Sinh Digital Campus
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Giao lưu cùng bạn bè lớp 10A7 và toàn trường. Cùng lập nhóm học tập, tham gia phòng tự học và chia sẻ kiến thức mỗi ngày.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <FriendsDrawer />
            </div>
          </div>

          {/* Hero Illustration / Banner Visual */}
          <div className="w-full md:w-80 lg:w-96 shrink-0 flex justify-center">
            <img
              src="/assets/community/community_hero.webp"
              alt="Community Hero"
              className="max-h-48 sm:max-h-56 w-auto object-contain drop-shadow-xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Stats Overview Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total friends */}
        <Card className="border-social/20 bg-gradient-to-br from-card to-social/5">
          <CardContent className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-social/15 text-social border border-social/25 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-text-secondary">Tổng bạn bè</p>
              <p className="text-lg font-black tracking-tight text-text-primary">{friends.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Online */}
        <Card className="border-success/20 bg-gradient-to-br from-card to-success/5">
          <CardContent className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success border border-success/25 shadow-inner">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-text-secondary">Đang trực tuyến</p>
              <p className="text-lg font-black tracking-tight text-success">{onlineFriends.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending requests */}
        <Card className="border-warning/20 bg-gradient-to-br from-card to-warning/5">
          <CardContent className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning border border-warning/25 shadow-inner">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-text-secondary">Lời mời kết bạn</p>
              <p className="text-lg font-black tracking-tight text-warning">{incomingRequests.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 3. Main Content: Friends Directory + Community Sidebar ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Friends Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-social" />
              <span>Danh sách bạn bè ({friends.length})</span>
            </h2>
            {onlineFriends.length > 0 && (
              <span className="text-xs text-success font-medium flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success animate-ping" />
                {onlineFriends.length} bạn đang online
              </span>
            )}
          </div>

          {friends.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có bạn bè nào"
              description="Mở danh bạ trường để tìm kiếm bạn học và gửi lời mời kết bạn ngay!"
              action={<FriendsDrawer />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((friend) => {
                const presence = presenceMap[friend.id]
                const isOnline = presence && (presence.state === 'online' || presence.state === 'away')
                const inRoom = presence?.activity?.type === 'room' && presence.activity.roomId

                return (
                  <Card
                    key={friend.id}
                    className="hover:border-social/40 hover:shadow-sm transition-all"
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-social/15 text-xs font-bold text-social border border-social/25 uppercase">
                              {friend.displayName.slice(0, 2)}
                            </div>
                          )}
                          {/* Online indicator dot */}
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                              isOnline ? 'bg-success' : 'bg-border-strong'
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

                      {inRoom ? (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/room/phong-${presence.activity?.roomId}`)}
                          title="Vào phòng cùng bạn"
                          className="h-7 px-2.5 text-[11px] gap-1 bg-social text-white hover:bg-social/90 shrink-0"
                        >
                          <DoorOpen className="h-3 w-3" />
                          Vào phòng
                        </Button>
                      ) : (
                        <Badge variant={isOnline ? 'success' : 'secondary'} className="text-[10px] shrink-0">
                          {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Col: Community Inspiration & Campus Visual Card */}
        <div className="space-y-4">
          <Card className="overflow-hidden border border-border/80 bg-card shadow-xs">
            <div className="relative h-32 w-full overflow-hidden">
              <img
                src="/assets/campus/campus_building.webp"
                alt="Digital Campus"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-black/40 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 text-white">
                <p className="text-xs font-bold">Văn Hóa Lớp 10A7</p>
                <p className="text-[10px] text-slate-200">Đoàn kết · Tự giác · Vươn xa</p>
              </div>
            </div>
            <CardContent className="p-4 space-y-2.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mỗi buổi học nhóm tại Phòng Học là một cơ hội để kết nối bạn bè, giải bài tập khó và nâng cao thành tích chung của lớp.
              </p>
              <div className="pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/learning')}
                  className="w-full text-xs font-semibold gap-1.5"
                >
                  <DoorOpen className="h-3.5 w-3.5 text-primary" />
                  <span>Xem các phòng học đang mở</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invitations Card if any */}
          {incomingRequests.length > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-warning flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Lời mời đang chờ</span>
                  </span>
                  <Badge variant="outline" className="text-[10px] text-warning border-warning/30">
                    {incomingRequests.length}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Bạn có lời mời kết bạn từ các bạn học khác. Hãy mở Danh bạ để kiểm tra và chấp nhận.
                </p>
                <FriendsDrawer />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
