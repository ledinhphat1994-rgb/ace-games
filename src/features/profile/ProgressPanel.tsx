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

// Tab "Tiến trình" trong hồ sơ: chỉ hiện số liệu máy chủ trả về (chuỗi ngày, XP, huy hiệu).
export function ProgressPanel({ hideChallenge = false }: { hideChallenge?: boolean } = {}) {
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
    enabled: !hideChallenge,
    staleTime: 60_000,
  })

  const trangThai = deriveProgressState({ isLoading, isError, data, error })
  const thuThach = hideChallenge ? null : challengeData?.challenge ?? null

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border-default/80 bg-surface/90 backdrop-blur-sm p-5 sm:p-6 card-side-glow shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text-primary">Tiến trình học tập</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setMoHuyHieu(true)} className="rounded-xl border-border-default bg-surface hover:bg-surface-raised text-text-primary text-xs font-semibold gap-1.5 cursor-pointer">
              <Award className="size-3.5 text-social" />
              <span>Huy hiệu</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMoXepHang(true)} className="rounded-xl border-border-default bg-surface hover:bg-surface-raised text-text-primary text-xs font-semibold gap-1.5 cursor-pointer">
              <Trophy className="size-3.5 text-achievement" />
              <span>Xếp hạng lớp</span>
            </Button>
          </div>
        </div>

        <div className="mt-5" style={{ overflowAnchor: 'none' }}>
          {trangThai.type === 'loading' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-busy="true" aria-label="Đang tải tiến trình">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[84px] animate-pulse rounded-xl border border-border-subtle bg-surface-overlay/40" />
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
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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

      {!hideChallenge && thuThach && (
        <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 card-side-glow">
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
      {!hideChallenge && <ClassChallengeModal open={moThuThach} onOpenChange={setMoThuThach} />}
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
