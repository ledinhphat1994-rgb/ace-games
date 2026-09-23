import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Flame, Sparkles, Plus, BookOpen } from 'lucide-react'
import type { EngagementProfile } from '@shared/protocol/engagement'

interface LearningHeaderProps {
  onOpenCreateRoom: () => void
  onOpenQuickStart: () => void
}

export function LearningHeader({ onOpenCreateRoom, onOpenQuickStart }: LearningHeaderProps) {
  const { nguoiDung } = usePhien()

  const { data: profileData } = useQuery<{
    ok: boolean
    profile: EngagementProfile
  }>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải hồ sơ học tập.')
      return res.json()
    },
    staleTime: 30_000,
  })

  const streak = profileData?.profile?.currentStreak ?? 0
  const todayXp = profileData?.profile?.todayXp ?? 0
  const displayName = nguoiDung.ten || nguoiDung.username

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#080d19] p-4 sm:p-6 shadow-xl">
      {/* Background Subtle Gradient & Artwork */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-right bg-no-repeat opacity-40 sm:opacity-50 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/learning/learning_hero.webp)',
          backgroundPosition: 'right 10% center',
        }}
      />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#080d19] via-[#080d19]/80 to-transparent sm:bg-gradient-to-r sm:from-[#080d19] sm:via-[#080d19]/85 sm:to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Salutation & Personal Metric Badges */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Không gian học tập
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Chào {displayName}, sẵn sàng vào bài hôm nay chưa?
          </h1>

          {/* Quick Truthful Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300">
              <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Chuỗi {streak} ngày</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>+{todayXp} XP hôm nay</span>
            </div>
          </div>
        </div>

        {/* Right: Primary Call-to-Actions */}
        <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <Button
            size="sm"
            onClick={onOpenQuickStart}
            className="h-10 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Học nhanh</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenCreateRoom}
            className="h-10 px-4 rounded-xl text-xs font-bold bg-white/5 border-white/15 text-slate-200 hover:bg-white/10 hover:text-white gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo phòng nhóm</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
