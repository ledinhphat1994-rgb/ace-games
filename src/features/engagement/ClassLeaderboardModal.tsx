import { useQuery } from '@tanstack/react-query'
import { Trophy, Flame, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { ClassLeaderboardItem } from '@shared/protocol/engagement'
import { tenLop } from '@/lib/utils'

interface ClassLeaderboardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LeaderboardResponse {
  ok: boolean
  lopTen: string | null
  currentWeek: string
  dateRange: { startDate: string; endDate: string }
  items: ClassLeaderboardItem[]
}

export function ClassLeaderboardModal({ open, onOpenChange }: ClassLeaderboardModalProps) {
  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: ['engagement', 'leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/leaderboard')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.loi || 'Không thể tải bảng xếp hạng.')
      }
      return res.json()
    },
    enabled: open,
  })

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 font-bold text-xs shadow-md">
          🥇
        </div>
      )
    }
    if (rank === 2) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900 font-bold text-xs shadow-md">
          🥈
        </div>
      )
    }
    if (rank === 3) {
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 text-amber-100 font-bold text-xs shadow-md">
          🥉
        </div>
      )
    }
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-muted/30 text-xs font-semibold text-muted-foreground">
        #{rank}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-5 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/60">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-achievement/10 text-achievement border border-achievement/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                Bảng xếp hạng học tập tuần
                <Sparkles className="h-4 w-4 text-achievement" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {data?.lopTen ? tenLop(data.lopTen) : 'Xếp hạng tuần'} • Dựa trên điểm chuyên cần & tham gia học tập
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-destructive">
            {error instanceof Error ? error.message : 'Lỗi tải dữ liệu.'}
          </div>
        ) : !data?.items || data.items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Chưa có lượt học nào trong tuần này. Hãy là người đầu tiên bắt đầu chuỗi học tập!
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1 my-2">
            {data.items.map((item) => (
              <div
                key={item.accountId}
                className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  item.isCurrentUser
                    ? 'border-brand/40 bg-brand/8 shadow-sm'
                    : 'border-border-subtle bg-surface/50 hover:bg-surface-overlay'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getRankBadge(item.rank)}
                  <Avatar className="h-9 w-9 border border-border/50">
                    <AvatarImage src={item.avatar || undefined} />
                    <AvatarFallback className="text-xs font-bold">
                      {item.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                      <span>{item.displayName}</span>
                      {item.isCurrentUser && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                          Bạn
                        </Badge>
                      )}
                    </div>
                    {item.currentStreak > 0 && (
                      <div className="text-[10px] text-warning font-medium flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        <span>Chuỗi {item.currentStreak} ngày</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-brand">+{item.weeklyXp} XP</div>
                  <div className="text-[10px] text-text-secondary">tuần này</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
