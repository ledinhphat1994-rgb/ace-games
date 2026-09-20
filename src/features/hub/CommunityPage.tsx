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
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-social" />
              Cộng đồng Học sinh
            </h1>
            <Badge variant="social">{friends.length} bạn bè</Badge>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Kết nối bạn bè cùng lớp và đồng hành học tập toàn trường
          </p>
        </div>

        <FriendsDrawer />
      </div>

      {/* ── Stats overview ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total friends */}
        <Card className="border-social/20 bg-gradient-to-br from-card to-social/5">
          <CardContent className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-social/10 text-social border border-social/20 shadow-inner">
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success border border-success/20 shadow-inner">
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning border border-warning/20 shadow-inner">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-text-secondary">Lời mời kết bạn</p>
              <p className="text-lg font-black tracking-tight text-warning">{incomingRequests.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Friend directory ──────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary">
            Danh sách bạn bè ({friends.length})
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
            description="Mở danh bạ trường để tìm kiếm và kết bạn!"
            action={<FriendsDrawer />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {friends.map((friend) => {
              const presence = presenceMap[friend.id]
              const isOnline = presence && (presence.state === 'online' || presence.state === 'away')
              const inRoom = presence?.activity?.type === 'room' && presence.activity.roomId

              return (
                <Card
                  key={friend.id}
                  className="hover:border-border-strong hover:shadow-sm transition-all"
                >
                  <CardContent className="flex items-center justify-between p-3.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.displayName}
                            className="h-10 w-10 rounded-full object-cover border border-border-default"
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
                        <p className="truncate text-xs font-bold text-text-primary">
                          {friend.displayName}
                        </p>
                        <p className="text-[11px] text-text-secondary truncate">
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
      </section>
    </div>
  )
}
