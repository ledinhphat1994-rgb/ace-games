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

  // Online friends
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const presence = presenceMap[f.id]
      return presence && (presence.state === 'online' || presence.state === 'away')
    })
  }, [friends, presenceMap])

  return (
    <div className="space-y-6">
      {/* 1. Header & Social Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Cộng đồng Học sinh</span>
            </h1>
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-[10px] font-bold">
              {friends.length} bạn bè
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Giao lưu, kết nối bạn bè cùng lớp và đồng hành học tập toàn trường
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Drawer for searching & managing friends */}
          <FriendsDrawer />
        </div>
      </div>

      {/* 2. Compact Social Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Friends */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-primary/5 shadow-xs">
          <CardContent className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">Tổng bạn bè</p>
              <p className="text-lg font-black tracking-tight text-foreground">{friends.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Online Friends */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-emerald-500/5 shadow-xs">
          <CardContent className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">Đang trực tuyến</p>
              <p className="text-lg font-black tracking-tight text-emerald-400">{onlineFriends.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="border border-border/70 bg-gradient-to-br from-card to-amber-500/5 shadow-xs">
          <CardContent className="flex items-center gap-3.5 p-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">Lời mời kết bạn</p>
              <p className="text-lg font-black tracking-tight text-amber-400">{incomingRequests.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Friend Directory */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Danh sách bạn bè ({friends.length})</h2>
          {onlineFriends.length > 0 && (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              {onlineFriends.length} bạn đang online
            </span>
          )}
        </div>

        {friends.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Chưa có bạn bè nào trong danh sách"
            description="Hãy mở danh bạ trường để tìm kiếm và kết bạn cùng các bạn học trong lớp hoặc toàn trường!"
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
                  className="border border-border/70 bg-card hover:border-border/90 hover:shadow-xs transition-all"
                >
                  <CardContent className="flex items-center justify-between p-3.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.displayName}
                            className="h-10 w-10 rounded-full object-cover border border-border/60 shadow-xs"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400 border border-indigo-500/30 uppercase shadow-xs">
                            {friend.displayName.slice(0, 2)}
                          </div>
                        )}
                        {/* Live indicator dot */}
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card ${
                            isOnline ? 'bg-emerald-500' : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground">
                          {friend.displayName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{friend.username} {friend.lopTen ? `· ${friend.lopTen}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Direct Action: Join Room if Friend is studying */}
                    {inRoom ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/room/phong-${presence.activity?.roomId}`)}
                        className="h-7 px-2.5 text-[11px] font-semibold gap-1 bg-indigo-600/90 hover:bg-indigo-600 text-white shrink-0 shadow-xs"
                        title="Vào phòng cùng bạn"
                      >
                        <DoorOpen className="h-3 w-3" />
                        <span>Vào phòng</span>
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 font-medium ${
                          isOnline
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-border/50 text-muted-foreground'
                        }`}
                      >
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
