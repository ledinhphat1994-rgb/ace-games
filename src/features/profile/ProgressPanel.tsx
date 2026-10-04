import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Award, CalendarDays, ChevronRight, Flame, RotateCw, Target, Trophy, Zap } from 'lucide-react'
import type { ClassChallenge } from '@shared/protocol/engagement'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { deriveProgressState, type ProgressDataResponse } from '@/components/progress/progress-state'
import { AchievementsModal } from '@/features/engagement/AchievementsModal'
import { ClassChallengeModal } from '@/features/engagement/ClassChallengeModal'
import { ClassLeaderboardModal } from '@/features/engagement/ClassLeaderboardModal'

// Tab "Tiến trình" trong hồ sơ: chỉ hiện số liệu máy chủ trả về (chuỗi ngày, XP, huy hiệu, thử thách lớp).
export function ProgressPanel() {
  const [moXepHang, setMoXepHang] = useState(false)
  const [moHuyHieu, setMoHuyHieu] = useState(false)
  const [moThuThach, setMoThuThach] = useState(false)

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery<ProgressDataResponse>({
    queryKey: ['engagement', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/me')
      if (!res.ok) throw new Error('Không thể tải thông tin chuyên cần.')
      const json = (await res.json()) as ProgressDataResponse
      if (!json || json.ok === false) throw new Error(json?.loi || json?.message || 'Không thể tải thông tin chuyên cần.')
      return json
    },
    staleTime: 30_000,
  })

  const { data: challengeData } = useQuery<{ ok: boolean; lopTen: string | null; challenge: ClassChallenge | null }>({
    queryKey: ['engagement', 'challenges'],
    queryFn: async () => {
      const res = await fetch('/api/engagement/challenges')
      if (!res.ok) return { ok: false, lopTen: null, challenge: null }
      return res.json()
    },
    staleTime: 60_000,
  })

  const trangThai = deriveProgressState({ isLoading, isError, data, error })
  const thuThach = challengeData?.challenge ?? null

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[0.9375rem] leading-6 font-semibold text-text-primary">Tiến trình học tập</h3>
          </div>
          <div className="max-sm:day-loc-deu w-full gap-2 sm:flex sm:w-auto [--the-nho-nhat:9rem]">
            <Button variant="outline" size="sm" onClick={() => setMoHuyHieu(true)}>
              <Award className="text-social" />
              Huy hiệu
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMoXepHang(true)}>
              <Trophy className="text-achievement" />
              Xếp hạng lớp
            </Button>
          </div>
        </div>

        <div className="mt-5" style={{ overflowAnchor: 'none' }}>
          {trangThai.type === 'loading' && (
            <div className="day-loc-deu [--the-nho-nhat:9rem]" aria-busy="true" aria-label="Đang tải tiến trình">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[84px] animate-pulse rounded-xl border border-border-subtle bg-canvas/40" />
              ))}
            </div>
          )}

          {trangThai.type === 'error' && (
            <div className="flex min-h-[84px] flex-col items-center justify-center gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.06] px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {trangThai.message}
              </p>
              <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isRefetching}>
                <RotateCw />
                Thử lại
              </Button>
            </div>
          )}

          {trangThai.type === 'success' && (
            <dl className="day-loc-deu [--the-nho-nhat:9rem]">
              <OChiSo icon={<Flame className="size-4 text-warning" />} nhan="Chuỗi hiện tại" giaTri={`${trangThai.currentStreak} ngày`} />
              <OChiSo icon={<CalendarDays className="size-4 text-text-tertiary" />} nhan="Chuỗi dài nhất" giaTri={`${trangThai.profile.longestStreak} ngày`} />
              <OChiSo
                icon={<Zap className="size-4 text-brand" />}
                nhan="XP tích luỹ"
                giaTri={trangThai.totalXp.toLocaleString('vi-VN')}
                phu={trangThai.todayXp > 0 ? `+${trangThai.todayXp} hôm nay` : undefined}
              />
              <OChiSo icon={<Award className="size-4 text-social" />} nhan="Huy hiệu" giaTri={String(trangThai.profile.unlockedAchievementsCount)} />
            </dl>
          )}
        </div>
      </section>

      {thuThach && (
        <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-success-muted text-success">
              <Target className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-text-tertiary">Thử thách của lớp</p>
                <button
                  type="button"
                  onClick={() => setMoThuThach(true)}
                  className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-brand hover:underline"
                >
                  Chi tiết
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
              <h3 className="mt-0.5 text-[0.9375rem] leading-6 font-semibold break-words text-text-primary">{thuThach.title}</h3>
              {thuThach.description && (
                <p className="mt-1 text-sm leading-relaxed break-words text-text-secondary">{thuThach.description}</p>
              )}
              {thuThach.targetValue > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="tabular-nums">
                      {thuThach.currentValue}/{thuThach.targetValue} {thuThach.targetType === 'tasks_count' ? 'nhiệm vụ' : 'buổi học'}
                    </span>
                    <span className="text-success">+{thuThach.rewardXp} XP</span>
                  </div>
                  <Progress
                    value={Math.min(100, Math.round((thuThach.currentValue / thuThach.targetValue) * 100))}
                    className="mt-2 h-1.5 bg-surface-overlay"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <ClassLeaderboardModal open={moXepHang} onOpenChange={setMoXepHang} />
      <AchievementsModal open={moHuyHieu} onOpenChange={setMoHuyHieu} />
      <ClassChallengeModal open={moThuThach} onOpenChange={setMoThuThach} />
    </div>
  )
}

function OChiSo({ icon, nhan, giaTri, phu }: { icon: ReactNode; nhan: string; giaTri: string; phu?: string }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-border-subtle bg-canvas/40 px-4 py-3.5">
      <dt className="flex items-center gap-1.5 text-xs text-text-tertiary">
        {icon}
        {nhan}
      </dt>
      <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xl font-semibold tracking-tight text-text-primary tabular-nums">
        {giaTri}
        {phu && <span className="text-xs font-medium text-success">{phu}</span>}
      </dd>
    </div>
  )
}
