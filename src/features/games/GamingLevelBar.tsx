import { memo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, Flame, Sparkles } from 'lucide-react'
import { usePhien } from '@/app/phien'
import { calculateGamingRank } from './gaming-level'
import { AchievementsModal } from '@/features/engagement/AchievementsModal'
import { playUiTapSound } from './game-audio'
import { cn } from '@/lib/utils'
import type { ProgressDataResponse } from '@/components/progress/progress-state'

export const GamingLevelBar = memo(function GamingLevelBar() {
  const { nguoiDung } = usePhien()
  const [moThanhTuu, setMoThanhTuu] = useState(false)

  const { data } = useQuery<ProgressDataResponse>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải cấp bậc.')
      return res.json()
    },
    enabled: Boolean(nguoiDung),
    staleTime: 30_000,
  })

  if (!nguoiDung) {
    return null
  }

  const totalXp = data?.profile?.totalXp ?? 0
  const currentStreak = data?.profile?.currentStreak ?? 0
  const rank = calculateGamingRank(totalXp)
  const isNearMidnight = new Date().getHours() >= 20
  const isNearlyLevelUp = rank.progressPercent >= 80

  return (
    <>
      <div className="w-full rounded-2xl border-2 border-amber-400/35 bg-gradient-to-r from-[#0c1527] via-[#101c33] to-[#0c1527] p-3 sm:p-4 shadow-[0_0_20px_rgba(245,158,11,0.18)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4">
          {/* Cột trái: Level & Danh hiệu */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/25 to-amber-600/25 border-2 border-amber-400/50 shadow-[0_0_16px_rgba(245,158,11,0.35)]">
              <Sparkles className="size-5 sm:size-6 text-amber-400" />
              <span className="absolute -bottom-1 -right-1 flex h-4 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[9px] font-black text-slate-950 shadow-sm">
                {rank.level}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate">
                  Lv.{rank.level} · {rank.title}
                </span>
                {currentStreak > 0 && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors',
                      isNearMidnight
                        ? 'bg-orange-500/25 border-orange-400 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.4)] animate-pulse'
                        : 'bg-amber-500/20 border-amber-400/40 text-amber-300',
                    )}
                    title={isNearMidnight ? 'Sắp hết ngày! Hãy hoàn thành ván để giữ chuỗi ngọn lửa' : 'Chuỗi ngày liên tục'}
                  >
                    <Flame className={cn('size-3', isNearMidnight ? 'text-orange-400 fill-orange-400' : 'text-amber-400')} />
                    <span>{currentStreak} ngày</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {rank.currentXp.toLocaleString('vi-VN')} / {rank.nextLevelXp.toLocaleString('vi-VN')} XP
              </p>
            </div>
          </div>

          {/* Cột phải: Thanh XP & Nút Thành tựu */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 sm:max-w-xs">
            {/* Thanh tiến trình XP */}
            <div className="flex-1 min-w-0">
              <div className="relative h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-slate-950 border border-slate-800">
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 transition-all duration-500',
                    isNearlyLevelUp
                      ? 'shadow-[0_0_16px_rgba(251,191,36,0.9)] animate-pulse'
                      : 'shadow-[0_0_10px_rgba(245,158,11,0.7)]',
                  )}
                  style={{ width: `${rank.progressPercent}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>Tiến độ cấp</span>
                <span className={cn('font-black', isNearlyLevelUp ? 'text-amber-300 animate-pulse' : 'text-amber-300')}>
                  {rank.progressPercent}%
                </span>
              </div>
            </div>

            {/* Nút Thành tựu */}
            <button
              type="button"
              onClick={() => {
                playUiTapSound()
                setMoThanhTuu(true)
              }}
              aria-label="Thành tựu người chơi"
              className="flex h-9 sm:h-10 min-h-[36px] sm:min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border-2 border-amber-400/60 bg-amber-500/15 hover:bg-amber-500/25 px-3 sm:px-3.5 text-xs font-bold text-amber-300 transition-colors cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            >
              <Award className="size-3.5 sm:size-4 text-amber-400" />
              <span>Thành tựu</span>
            </button>
          </div>
        </div>
      </div>

      {moThanhTuu && <AchievementsModal open={moThanhTuu} onOpenChange={setMoThanhTuu} />}
    </>
  )
})
