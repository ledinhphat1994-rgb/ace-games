import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { AlertCircle, ArrowLeft, RefreshCw, ShieldAlert } from 'lucide-react'

export interface AnalyticsOverviewData {
  window: 'today' | '7d' | '30d'
  generatedAt: number
  databaseIsolated: boolean
  totalTaxonomyEvents: number
  activeUsers: {
    dau: number
    wau: number
    mau: number
    newLogins: number
  }
  retention: {
    d1Percent: number
    d7Percent: number
    d1CohortSize: number
    d1RetainedCount: number
    d7CohortSize: number
    d7RetainedCount: number
  }
  funnel: {
    stage1Users: number
    stage2Users: number
    stage3Users: number
    stage4Users: number
    stage2RatePercent: number
    stage3RatePercent: number
    stage4RatePercent: number
    overallRatePercent: number
  }
  featureAdoption: Record<
    string,
    {
      eventCount: number
      uniqueActors: number
    }
  >
  sessionMetrics: {
    totalRoomJoins: number
    avgRoomSessionDurationSec: number
  }
  operationalHealth: {
    totalRequests: number
    errorRate4xx: number
    errorRate5xx: number
    p50LatencyMs: number
    p95LatencyMs: number
    topErrorClasses: Array<{ errorClass: string; count: number }>
    doRpcFailureCount: number
    revocationRetryCount: number
  }
}

type KhoangThoiGian = 'today' | '7d' | '30d'

const KHOANG: { value: KhoangThoiGian; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
]

const TEN_TINH_NANG: Record<string, string> = {
  room: 'Phòng học',
  voice: 'Nói chuyện bằng giọng',
  chat: 'Trò chuyện trong phòng',
  notes: 'Ghi chú chung',
  whiteboard: 'Bảng vẽ',
  media: 'Xem video cùng nhau',
  friends: 'Bạn bè',
  games: 'Trò chơi',
  moderation: 'Báo cáo & kiểm duyệt',
  learningSession: 'Phiên học có cấu trúc',
  engagement: 'Chuỗi ngày & XP',
}

/** Lỗi kèm mã HTTP để không thử lại vô ích khi bị từ chối quyền. */
class LoiBaoCao extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return '0 giây'
  if (sec < 60) return `${Math.round(sec)} giây`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return s > 0 ? `${m} phút ${s} giây` : `${m} phút`
}

const SO = new Intl.NumberFormat('vi-VN')
const GIO_CAP_NHAT = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })

export function AnalyticsDashboardPage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const [windowRange, setWindowRange] = useState<KhoangThoiGian>('today')

  const { data, isLoading, error, refetch, isFetching } = useQuery<AnalyticsOverviewData>({
    queryKey: ['analytics', windowRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/overview?window=${windowRange}`)
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        analytics?: AnalyticsOverviewData
        loi?: string
        thongBao?: string
      } | null
      if (res.ok && json?.ok && json.analytics) return json.analytics
      const thongBao =
        json?.loi ||
        json?.thongBao ||
        (res.status === 401
          ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
          : res.status === 403
            ? 'Chỉ quản trị viên trường mới xem được báo cáo.'
            : `Máy chủ trả về lỗi (${res.status}).`)
      throw new LoiBaoCao(res.status, thongBao)
    },
    enabled: !!nguoiDung?.isSchoolAdmin,
    retry: (lan, loi) => !(loi instanceof LoiBaoCao && loi.status < 500) && lan < 2,
  })

  if (!nguoiDung?.isSchoolAdmin || (error instanceof LoiBaoCao && error.status === 403)) {
    return (
      <div className="flex min-h-[50svh] flex-col items-center justify-center text-center">
        <ShieldAlert className="size-7 text-text-tertiary" />
        <p className="mt-3 text-sm font-medium text-text-primary">Báo cáo dành cho quản trị viên trường</p>
        <p className="mt-1 text-xs text-text-tertiary">Tài khoản của bạn chưa có quyền xem trang này.</p>
      </div>
    )
  }

  const tinhNang = data
    ? Object.entries(data.featureAdoption).sort(([, a], [, b]) => b.uniqueActors - a.uniqueActors || b.eventCount - a.eventCount)
    : []
  const nhieuNhat = Math.max(1, ...tinhNang.map(([, s]) => s.uniqueActors))

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" className="-ml-2 text-text-secondary" onClick={() => navigate('/admin')}>
          <ArrowLeft />
          Quản trị trường
        </Button>
        <PageHeader
          title="Báo cáo sử dụng"
          description={
            data
              ? `Số liệu thật từ hoạt động của học sinh và máy chủ · cập nhật lúc ${GIO_CAP_NHAT.format(data.generatedAt)}`
              : 'Số liệu thật từ hoạt động của học sinh và máy chủ.'
          }
          actions={
            <>
              {KHOANG.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  aria-pressed={windowRange === k.value}
                  onClick={() => setWindowRange(k.value)}
                  className={cn(
                    'inline-flex h-9 items-center justify-center rounded-xl border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    windowRange === k.value
                      ? 'border-brand/50 bg-brand/10 text-brand'
                      : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                  )}
                >
                  {k.label}
                </button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => void refetch()}
                disabled={isFetching}
                aria-label="Làm mới số liệu"
                title="Làm mới"
                className="size-9 rounded-xl"
              >
                <RefreshCw className={cn(isFetching && 'animate-spin')} />
              </Button>
            </>
          }
        />
      </div>

      {isLoading ? (
        <div className="space-y-8" aria-hidden>
          <div className="day-loc-deu gap-3 [--the-nho-nhat:9rem]">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-surface px-6 py-12 text-center">
          <AlertCircle className="size-6 text-destructive" />
          <p className="mt-2 text-sm font-medium text-text-primary">Không tải được báo cáo</p>
          <p className="mt-1 max-w-md text-xs break-words text-text-tertiary">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
            <RefreshCw />
            Thử lại
          </Button>
        </div>
      ) : data ? (
        <>
          <section className="space-y-3">
            <SectionHeader title="Học sinh hoạt động" description="Số tài khoản có hoạt động học tập thật, không tính chỉ mở trang." />
            <div className="day-loc-deu gap-3 [--the-nho-nhat:9rem]">
              <ChiSo giaTri={SO.format(data.activeUsers.dau)} nhan="Hôm nay" />
              <ChiSo giaTri={SO.format(data.activeUsers.wau)} nhan="7 ngày qua" />
              <ChiSo giaTri={SO.format(data.activeUsers.mau)} nhan="30 ngày qua" />
              <ChiSo giaTri={SO.format(data.activeUsers.newLogins)} nhan="Tài khoản đã đăng nhập" />
            </div>
          </section>

          <div className="grid items-start gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <SectionHeader title="Quay lại học" description="Trong số học sinh bắt đầu hoạt động vào một ngày." />
              <div className="day-loc-deu gap-3 [--the-nho-nhat:9rem]">
                <ChiSo
                  giaTri={`${data.retention.d1Percent}%`}
                  nhan="Sau 1 ngày"
                  phu={`${data.retention.d1RetainedCount}/${data.retention.d1CohortSize} học sinh`}
                />
                <ChiSo
                  giaTri={`${data.retention.d7Percent}%`}
                  nhan="Sau 7 ngày"
                  phu={`${data.retention.d7RetainedCount}/${data.retention.d7CohortSize} học sinh`}
                />
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="Phòng học" description="Trong khoảng thời gian đã chọn." />
              <div className="day-loc-deu gap-3 [--the-nho-nhat:9rem]">
                <ChiSo giaTri={SO.format(data.sessionMetrics.totalRoomJoins)} nhan="Lượt vào phòng" />
                <ChiSo giaTri={formatDuration(data.sessionMetrics.avgRoomSessionDurationSec)} nhan="Thời lượng trung bình" />
              </div>
            </section>
          </div>

          <section className="space-y-3">
            <SectionHeader
              title="Từ đăng nhập đến học thật"
              description={`Cùng một học sinh đi qua từng bước · ${data.funnel.overallRatePercent}% đi hết cả 4 bước.`}
            />
            <ol className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
              <BuocPheu so={1} nhan="Đăng nhập" giaTri={data.funnel.stage1Users} goc={data.funnel.stage1Users} />
              <BuocPheu
                so={2}
                nhan="Mở sảnh trường"
                giaTri={data.funnel.stage2Users}
                goc={data.funnel.stage1Users}
                tiLe={data.funnel.stage2RatePercent}
              />
              <BuocPheu
                so={3}
                nhan="Vào phòng học"
                giaTri={data.funnel.stage3Users}
                goc={data.funnel.stage1Users}
                tiLe={data.funnel.stage3RatePercent}
              />
              <BuocPheu
                so={4}
                nhan="Có tương tác (trò chuyện, giọng nói, ghi chú, bảng vẽ, trò chơi)"
                giaTri={data.funnel.stage4Users}
                goc={data.funnel.stage1Users}
                tiLe={data.funnel.stage4RatePercent}
              />
            </ol>
          </section>

          <section className="space-y-3">
            <SectionHeader title="Tính năng được dùng" description="Xếp theo số học sinh sử dụng trong khoảng thời gian đã chọn." />
            {tinhNang.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border-subtle px-6 py-10 text-center text-sm text-text-tertiary">
                Chưa có hoạt động nào trong khoảng thời gian này.
              </p>
            ) : (
              <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
                {tinhNang.map(([khoa, s]) => (
                  <li key={khoa} className="px-4 py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                      <span className="text-sm text-text-primary">{TEN_TINH_NANG[khoa] ?? khoa}</span>
                      <span className="text-xs text-text-tertiary tabular-nums">
                        <span className="font-medium text-text-primary">{SO.format(s.uniqueActors)}</span> học sinh ·{' '}
                        {SO.format(s.eventCount)} lượt
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
                      <div
                        className="h-full rounded-full bg-brand/70"
                        style={{ width: `${Math.round((s.uniqueActors / nhieuNhat) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="Tình trạng máy chủ" description="Yêu cầu HTTP tới Worker trong khoảng thời gian đã chọn." />
            <div className="day-loc-deu gap-3 [--the-nho-nhat:9rem]">
              <ChiSo giaTri={SO.format(data.operationalHealth.totalRequests)} nhan="Yêu cầu" />
              <ChiSo giaTri={`${data.operationalHealth.p50LatencyMs} ms`} nhan="Độ trễ thường gặp (p50)" />
              <ChiSo giaTri={`${data.operationalHealth.p95LatencyMs} ms`} nhan="Độ trễ chậm nhất (p95)" />
              <ChiSo
                giaTri={`${data.operationalHealth.errorRate5xx}%`}
                nhan="Lỗi máy chủ (5xx)"
                canhBao={data.operationalHealth.errorRate5xx > 1}
              />
              <ChiSo giaTri={`${data.operationalHealth.errorRate4xx}%`} nhan="Lỗi phía người dùng (4xx)" />
              <ChiSo
                giaTri={SO.format(data.operationalHealth.doRpcFailureCount)}
                nhan="Lỗi gọi Durable Object"
                canhBao={data.operationalHealth.doRpcFailureCount > 0}
              />
            </div>

            {data.operationalHealth.topErrorClasses.length > 0 ? (
              <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
                {data.operationalHealth.topErrorClasses.map((item) => (
                  <li key={item.errorClass} className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs">
                    <span className="min-w-0 font-mono break-all text-text-secondary">{item.errorClass}</span>
                    <span className="shrink-0 text-text-tertiary tabular-nums">{SO.format(item.count)} lần</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 text-xs text-text-tertiary">Không ghi nhận nhóm lỗi nào trong khoảng thời gian này.</p>
            )}
            {data.operationalHealth.revocationRetryCount > 0 && (
              <p className="px-1 text-xs text-text-tertiary">
                {SO.format(data.operationalHealth.revocationRetryCount)} lần thử lại thu hồi quyền (giọng nói/phòng) đang chờ.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

function ChiSo({ giaTri, nhan, phu, canhBao }: { giaTri: ReactNode; nhan: string; phu?: string; canhBao?: boolean }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface px-3 py-4 text-center">
      <span className={cn('text-2xl font-semibold tabular-nums', canhBao ? 'text-warning' : 'text-text-primary')}>
        {giaTri}
      </span>
      <span className="mt-1 text-xs text-text-tertiary">{nhan}</span>
      {phu && <span className="mt-0.5 text-[11px] text-text-tertiary tabular-nums">{phu}</span>}
    </div>
  )
}

function BuocPheu({
  so,
  nhan,
  giaTri,
  goc,
  tiLe,
}: {
  so: number
  nhan: string
  giaTri: number
  goc: number
  /** % so với bước ngay trước. */
  tiLe?: number
}) {
  const doRong = goc > 0 ? Math.round((giaTri / goc) * 100) : 0
  return (
    <li className="px-4 py-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <span className="min-w-0 text-sm break-words text-text-primary">
          <span className="mr-2 text-text-tertiary tabular-nums">{so}</span>
          {nhan}
        </span>
        <span className="text-xs text-text-tertiary tabular-nums">
          <span className="text-sm font-semibold text-text-primary">{SO.format(giaTri)}</span>
          {typeof tiLe === 'number' ? ` · ${tiLe}% từ bước trước` : ''}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
        <div className="h-full rounded-full bg-brand/70" style={{ width: `${doRong}%` }} />
      </div>
    </li>
  )
}
