import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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

  // Online friends count
  const onlineFriends = useMemo(() => {
    return friends.filter((f) => {
      const presence = presenceMap[f.id]
      return presence && (presence.state === 'online' || presence.state === 'away')
    })
  }, [friends, presenceMap])

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Cộng đồng & Bạn bè</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kết nối bạn bè, theo dõi hoạt động học tập và giao lưu trong toàn trường
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Trigger to open the full friends drawer */}
          <FriendsDrawer />
        </div>
      </div>

      {/* 2. Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border/70 bg-card/80">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tổng số bạn bè</p>
              <p className="text-lg font-bold text-foreground">{friends.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/80">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Đang trực tuyến</p>
              <p className="text-lg font-bold text-emerald-400">{onlineFriends.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/80">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lời mời kết bạn</p>
              <p className="text-lg font-bold text-amber-400">{incomingRequests.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Friend Directory Grid */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-foreground">Danh sách bạn bè</h2>

        {friends.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
              <Users className="h-6 w-6 opacity-60" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Chưa có bạn bè nào</h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground leading-relaxed">
              Hãy tìm kiếm và kết nối với các bạn cùng lớp hoặc toàn trường để cùng nhau học tập nhé!
            </p>
            <div className="mt-4">
              <FriendsDrawer />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {friends.map((friend) => {
              const presence = presenceMap[friend.id]
              const isOnline = presence && (presence.state === 'online' || presence.state === 'away')
              const inRoom = presence?.activity?.type === 'room' && presence.activity.roomId

              return (
                <Card
                  key={friend.id}
                  className="border border-border/70 bg-card hover:border-border transition-all"
                >
                  <CardContent className="flex items-center justify-between p-3.5 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.displayName}
                            className="h-10 w-10 rounded-full object-cover border border-border/60"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400 border border-indigo-500/30 uppercase">
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

                    {/* Action: Join room if friend is studying */}
                    {inRoom ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/room/phong-${presence.activity?.roomId}`)}
                        className="h-7 px-2 text-[11px] font-semibold gap-1 bg-indigo-600/80 hover:bg-indigo-600 text-white shrink-0"
                        title="Vào phòng cùng bạn"
                      >
                        <DoorOpen className="h-3 w-3" />
                        <span>Vào phòng</span>
                      </Button>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
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
