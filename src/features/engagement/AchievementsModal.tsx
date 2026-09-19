import { useQuery } from '@tanstack/react-query'
import {
  Award,
  Lock,
  Sparkles,
  Users,
  Flame,
  Trophy,
  CheckCircle2,
  Vote,
  BookOpen,
  Target,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserAchievementItem } from '@shared/protocol/engagement'

interface AchievementsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AchievementsResponse {
  ok: boolean
  items?: UserAchievementItem[]
  achievements?: UserAchievementItem[]
  unlockedCount?: number
  totalCount?: number
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Flame: <Flame className="h-5 w-5" />,
  CheckCircle2: <CheckCircle2 className="h-5 w-5" />,
  Vote: <Vote className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
}

export function AchievementsModal({ open, onOpenChange }: AchievementsModalProps) {
  const { data, isLoading, error } = useQuery<AchievementsResponse>({
    queryKey: ['engagement', 'achievements'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/achievements')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.loi || 'Không thể tải huy hiệu.')
      }
      return res.json()
    },
    enabled: open,
  })

  const items = data?.items || data?.achievements || []
  const unlockedCount = data?.unlockedCount ?? items.filter((a) => a.unlocked).length
  const totalCount = data?.totalCount ?? items.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-5 sm:p-6 bg-card/95 backdrop-blur-xl border border-border/60">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  Huy hiệu thành tích
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Ghi nhận nỗ lực học tập và tinh thần đồng đội
                </DialogDescription>
              </div>
            </div>
            {data && (
              <Badge variant="secondary" className="px-2.5 py-1 text-xs font-semibold">
                {unlockedCount} / {totalCount} Đã mở khóa
              </Badge>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-destructive">
            {error instanceof Error ? error.message : 'Lỗi tải danh sách huy hiệu.'}
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1 my-2">
            {items.map((badge) => {
              const iconElement = ICON_MAP[badge.icon] || <Award className="h-5 w-5" />
              return (
                <div
                  key={badge.key}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    badge.unlocked
                      ? 'border-purple-500/40 bg-purple-500/5 hover:bg-purple-500/10 shadow-sm'
                      : 'border-border/40 bg-muted/20 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                        badge.unlocked
                          ? 'bg-purple-500/15 text-purple-500 border-purple-500/30'
                          : 'bg-muted text-muted-foreground border-border/50'
                      }`}
                    >
                      {badge.unlocked ? iconElement : <Lock className="h-4 w-4 text-muted-foreground/80" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground truncate">
                          {badge.title}
                        </span>
                        <Badge
                          variant={badge.unlocked ? 'default' : 'outline'}
                          className={`text-[9px] px-1.5 py-0 h-4 ${
                            badge.unlocked
                              ? 'bg-purple-600 hover:bg-purple-600 text-white'
                              : 'text-muted-foreground'
                          }`}
                        >
                          +{badge.rewardXp} XP
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {badge.description}
                      </p>
                    </div>
                  </div>

                  {badge.unlocked && badge.unlockedAt && (
                    <div className="text-[9px] text-purple-500/80 font-medium text-right mt-2">
                      Mở khóa: {new Date(badge.unlockedAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
