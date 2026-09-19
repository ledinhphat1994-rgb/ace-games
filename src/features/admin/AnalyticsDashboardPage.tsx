import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3,
  Users,
  TrendingUp,
  Activity,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  Mic,
  FileText,
  PenTool,
  Video,
  Gamepad2,
  UserCheck,
  Shield,
  Zap,
  Server,
  GraduationCap,
} from 'lucide-react'

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

export function AnalyticsDashboardPage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const [windowRange, setWindowRange] = useState<'today' | '7d' | '30d'>('today')

  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery<AnalyticsOverviewData>({
    queryKey: ['analytics', windowRange],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics/overview?window=${windowRange}`)
      if (res.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      }
      if (res.status === 403) {
        throw new Error('Chỉ quản trị viên trường mới có quyền truy cập số liệu phân tích.')
      }
      if (!res.ok) {
        throw new Error(`Máy chủ trả về lỗi (${res.status}).`)
      }
      const json = (await res.json()) as { ok?: boolean; analytics?: AnalyticsOverviewData; thongBao?: string }
      if (json.ok && json.analytics) {
        return json.analytics
      }
      throw new Error(json.thongBao || 'Không thể tải dữ liệu phân tích.')
    },
  })

  const error = queryError instanceof Error ? queryError.message : null

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0s'
    if (sec < 60) return `${sec}s`
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }

  // Feature icon mapping
  const featureIcons: Record<string, typeof Users> = {
    room: Users,
    voice: Mic,
    chat: MessageSquare,
    notes: FileText,
    whiteboard: PenTool,
    media: Video,
    friends: UserCheck,
    games: Gamepad2,
    moderation: Shield,
    learningSession: GraduationCap,
  }

  const featureLabels: Record<string, string> = {
    room: 'Phòng học tập',
    voice: 'Thoại trực tiếp WebRTC',
    chat: 'Tin nhắn thảo luận',
    notes: 'Ghi chú cộng tác OCC',
    whiteboard: 'Bảng vẽ tương tác',
    media: 'Đồng bộ bài học YouTube',
    friends: 'Kết nối bạn bè & Xã hội',
    games: 'Đấu trường trò chơi trí tuệ',
    moderation: 'Báo cáo & Kiểm duyệt an toàn',
    learningSession: 'Phiên học nhóm có cấu trúc',
  }

  if (error && (!nguoiDung.isSchoolAdmin || error.includes('quyền'))) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border-destructive/40 bg-card text-card-foreground shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-bold">Truy cập bị từ chối</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {error || 'Bạn không có quyền truy cập trang số liệu phân tích quản trị.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/')} variant="default">
              <ArrowLeft className="mr-2 h-4 w-4" /> Về Sảnh Digital Campus
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Sảnh Campus
            </Button>
            <div className="h-4 w-px bg-border/80" />
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight">Product Analytics & Observability</h1>
                  <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
                    M0.1 Baseline
                  </Badge>
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-[10px] text-emerald-400">
                    D1 Cô lập
                  </Badge>
                  <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-[10px] text-cyan-400">
                    {data?.totalTaxonomyEvents ?? 32} Sự kiện
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Digital Campus v2 · Số liệu thực tế người dùng & hệ thống</p>
              </div>
            </div>
          </div>

          {/* Time Window Switcher & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-border/70 bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setWindowRange('today')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  windowRange === 'today'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setWindowRange('7d')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  windowRange === '7d'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={() => setWindowRange('30d')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  windowRange === '30d'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                30 ngày qua
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={loading || isFetching}
              className="h-8 px-2.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6">
        {loading && !data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-52 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : error ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="flex items-center gap-3 p-4 text-destructive">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* KPI Summary Cards */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">DAU (Ngày)</CardDescription>
                  <CardTitle className="text-2xl font-black text-cyan-400">{data.activeUsers.dau}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Người dùng tích cực
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">WAU (Tuần)</CardDescription>
                  <CardTitle className="text-2xl font-black text-indigo-400">{data.activeUsers.wau}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Hoạt động 7 ngày
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">MAU (Tháng)</CardDescription>
                  <CardTitle className="text-2xl font-black text-purple-400">{data.activeUsers.mau}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Hoạt động 30 ngày
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">Đăng nhập mới</CardDescription>
                  <CardTitle className="text-2xl font-black text-emerald-400">{data.activeUsers.newLogins}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Tài khoản đăng nhập
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">D1 Retention</CardDescription>
                  <CardTitle className="text-2xl font-black text-amber-400">{data.retention.d1Percent}%</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Quay lại sau 1 ngày
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">D7 Retention</CardDescription>
                  <CardTitle className="text-2xl font-black text-rose-400">{data.retention.d7Percent}%</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Quay lại sau 7 ngày
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">Lượt vào phòng</CardDescription>
                  <CardTitle className="text-2xl font-black text-sky-400">{data.sessionMetrics.totalRoomJoins}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Kết nối phòng học
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs font-medium">Thời lượng TB</CardDescription>
                  <CardTitle className="text-2xl font-black text-teal-400">
                    {formatDuration(data.sessionMetrics.avgRoomSessionDurationSec)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
                  Mỗi phiên phòng học
                </CardContent>
              </Card>
            </section>

            {/* Core Product Funnel */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base font-bold">Phễu chuyển đổi tuần tự theo người dùng (Same-User Sequential Funnel)</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">
                    Tổng thể: {data.funnel.overallRatePercent}% chuyển đổi
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Theo dõi chính xác từng học sinh qua 4 giai đoạn tuần tự: Đăng nhập → Mở Sảnh Campus → Vào Phòng → Tương tác có ý nghĩa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  {/* Step 1 */}
                  <div className="relative flex flex-col rounded-xl border border-border/80 bg-background/60 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Bước 1: Đăng nhập</span>
                      <Badge variant="secondary" className="text-[10px]">100%</Badge>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{data.funnel.stage1Users}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Học sinh đăng nhập hợp lệ</p>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex flex-col rounded-xl border border-border/80 bg-background/60 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Bước 2: Sảnh Campus</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {data.funnel.stage2RatePercent}% từ B1
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{data.funnel.stage2Users}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Đã đăng nhập và mở sảnh</p>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex flex-col rounded-xl border border-border/80 bg-background/60 p-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Bước 3: Vào phòng</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {data.funnel.stage3RatePercent}% từ B2
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl font-bold">{data.funnel.stage3Users}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Đã qua sảnh và kết nối phòng</p>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex flex-col rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                    <div className="flex items-center justify-between text-xs text-emerald-400">
                      <span>Bước 4: Tương tác có ý nghĩa</span>
                      <Badge variant="outline" className="border-emerald-500/40 text-[10px] text-emerald-400">
                        {data.funnel.stage4RatePercent}% từ B3
                      </Badge>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-400">
                      {data.funnel.stage4Users}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Chat, Thoại, Ghi chú, Bảng vẽ, Game</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Adoption Matrix */}
            <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-bold">Mức độ áp dụng tính năng (Feature Adoption)</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Phân rã số lượng sự kiện tác vụ và số học sinh duy nhất sử dụng từng phân hệ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(data.featureAdoption).map(([featureKey, stats]) => {
                    const IconComp = featureIcons[featureKey] || Activity
                    const label = featureLabels[featureKey] || featureKey
                    return (
                      <div
                        key={featureKey}
                        className="flex items-center justify-between rounded-xl border border-border/70 bg-background/50 p-3.5 transition-colors hover:border-border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold">{label}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {stats.uniqueActors} học sinh sử dụng
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{stats.eventCount}</div>
                          <div className="text-[10px] text-muted-foreground">sự kiện</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Operational Health & Platform Observability */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Latency & Error rates */}
              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <CardTitle className="text-base font-bold">Hiệu năng & Độ trễ HTTP API</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Giám sát độ trễ p50/p95 và tỉ lệ lỗi trên toàn bộ Worker API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Tổng yêu cầu HTTP</div>
                      <div className="mt-1 text-xl font-bold">{data.operationalHealth.totalRequests}</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Độ trễ p50 (Trung vị)</div>
                      <div className="mt-1 text-xl font-bold text-emerald-400">
                        {data.operationalHealth.p50LatencyMs} ms
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Độ trễ p95 (Đỉnh)</div>
                      <div className="mt-1 text-xl font-bold text-amber-400">
                        {data.operationalHealth.p95LatencyMs} ms
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Tỉ lệ lỗi Client (4xx)</div>
                      <div className="mt-1 text-lg font-semibold text-amber-400">
                        {data.operationalHealth.errorRate4xx}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Sai mật khẩu, rate-limit, 404</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Tỉ lệ lỗi Máy chủ (5xx)</div>
                      <div className="mt-1 text-lg font-semibold text-rose-400">
                        {data.operationalHealth.errorRate5xx}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">Lỗi D1, Worker uncaught exception</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Durable Objects Resilience & Top Error Classes */}
              <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-sky-400" />
                    <CardTitle className="text-base font-bold">Durable Objects & Phân loại lỗi</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Sự cố RPC giữa các Durable Object và các lớp lỗi thường gặp nhất
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Lỗi DO RPC</div>
                      <div className="mt-1 text-xl font-bold text-rose-400">
                        {data.operationalHealth.doRpcFailureCount}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Thất bại gọi chéo RoomDO / CampusDO</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
                      <div className="text-[11px] text-muted-foreground">Số lần Retry Thu hồi (Alarm)</div>
                      <div className="mt-1 text-xl font-bold text-amber-400">
                        {data.operationalHealth.revocationRetryCount}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Pending voice / room revocations</div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">
                      Top lớp lỗi (Error Classes) phát sinh:
                    </div>
                    {data.operationalHealth.topErrorClasses.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                        Không ghi nhận lớp lỗi nào trong khoảng thời gian này. Hệ thống vận hành sạch sẽ.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-background/50">
                        {data.operationalHealth.topErrorClasses.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 px-3 text-xs">
                            <span className="font-mono text-muted-foreground">{item.errorClass}</span>
                            <Badge variant="outline" className="font-mono">
                              {item.count} lần
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
