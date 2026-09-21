// Digital Campus v2: Milestone A1 — Admin Control Plane
// src/features/admin/AdminControlPlanePage.tsx

import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { CreateStudyRoomDialog } from '@/features/hub/CreateStudyRoomDialog'
import {
  ArrowLeft,
  RefreshCw,
  Shield,
  Home,
  Settings2,
  BookOpen,
  DoorOpen,
  DoorClosed,
  AlertTriangle,
  Users,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
  Sparkles,
  ArrowRight,
  BarChart3,
  Megaphone,
  Sliders,
  ExternalLink,
} from 'lucide-react'
import type { AdminRoomItem, RoomLifecyclePolicy } from '@shared/protocol/room'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: number
  tai_khoan_id: number | null
  phong_id: number | null
  hanh_dong: string
  chi_tiet: string | null
  tao_luc: string
}

type AdminTab = 'overview' | 'rooms' | 'policy' | 'audit'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMinutes(m: number): string {
  if (m < 60) return `${m} phút`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h} giờ` : `${h} giờ ${rem} phút`
}

function fmtRelative(ts: number | null): string {
  if (!ts) return '—'
  const diffMs = Date.now() - ts
  if (diffMs < 60_000) return 'vừa xong'
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)} phút trước`
  if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)} giờ trước`
  return `${Math.floor(diffMs / 86400_000)} ngày trước`
}

function statusBadge(item: AdminRoomItem) {
  if (item.lifecycleStatus === 'closed')
    return <Badge variant="outline" className="border-border-default bg-muted/40 text-muted-foreground text-[10px]">Đã đóng</Badge>
  if (item.lifecycleStatus === 'closing')
    return <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning text-[10px]">Đang đóng</Badge>
  if (!item.everJoined)
    return <Badge variant="outline" className="border-social/40 bg-social/10 text-social text-[10px]">Chưa ai vào</Badge>
  return <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[10px]">Đang mở</Badge>
}

// Sparkline SVG decorative component
function Sparkline({ color = '#22d3ee', direction = 'up' }: { color?: string; direction?: 'up' | 'down' }) {
  const pathData = direction === 'up'
    ? 'M0,24 Q15,20 30,22 T60,14 T90,16 T120,4'
    : 'M0,6 Q15,10 30,8 T60,18 T90,14 T120,24'
  const fillData = direction === 'up'
    ? 'M0,24 Q15,20 30,22 T60,14 T90,16 T120,4 L120,28 L0,28 Z'
    : 'M0,6 Q15,10 30,8 T60,18 T90,14 T120,24 L120,28 L0,28 Z'

  return (
    <svg className="w-24 h-7 overflow-visible opacity-80" viewBox="0 0 120 28" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillData} fill={`url(#grad-${color.replace('#', '')})`} />
      <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── API fetch helpers ────────────────────────────────────────────────────────

async function fetchAdminRooms(params: {
  page: number; limit: number; status: string; q: string
}): Promise<{ ok: boolean; rooms: AdminRoomItem[]; pagination: { total: number; page: number; totalPages: number }; stats: Record<string, number> }> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    status: params.status,
    q: params.q,
  })
  const res = await fetch(`/api/admin/rooms?${sp}`)
  if (!res.ok) throw new Error('Không thể tải danh sách phòng.')
  return res.json()
}

async function fetchPolicy(): Promise<{ ok: boolean; policy: RoomLifecyclePolicy }> {
  const res = await fetch('/api/admin/room-policy')
  if (!res.ok) throw new Error('Không thể tải chính sách.')
  return res.json()
}

async function fetchAuditLogs(page: number): Promise<{ ok: boolean; logs: AuditLogEntry[]; total: number }> {
  const res = await fetch(`/api/admin/audit-logs?limit=20&offset=${(page - 1) * 20}`)
  if (!res.ok) throw new Error('Không thể tải nhật ký.')
  return res.json()
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

function OverviewPanel({
  onTabChange,
  onCreateRoom,
}: {
  onTabChange: (t: AdminTab) => void
  onCreateRoom: () => void
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [closingId, setClosingId] = useState<number | null>(null)

  const { data: roomsData, isLoading: loadingRooms, error: roomsError, refetch: refetchRooms } = useQuery({
    queryKey: ['admin-rooms-overview'],
    queryFn: () => fetchAdminRooms({ page: 1, limit: 6, status: 'all', q: '' }),
    staleTime: 20_000,
  })

  const { data: policyData, refetch: refetchPolicy } = useQuery({
    queryKey: ['admin-room-policy'],
    queryFn: fetchPolicy,
    staleTime: 60_000,
  })

  const policy = policyData?.policy

  const closeRoomMut = useMutation({
    mutationFn: async (roomId: number) => {
      const res = await fetch(`/api/admin/rooms/${roomId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'admin_closed' }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Đóng phòng thất bại.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rooms-overview'] })
      qc.invalidateQueries({ queryKey: ['admin-rooms'] })
      setClosingId(null)
    },
  })

  const stats = roomsData?.stats ?? {}
  const activeRooms = roomsData?.rooms ?? []

  const kpis = [
    {
      label: 'Phòng đang mở',
      value: stats.openCount ?? 0,
      sub: '↑ Đang trực tuyến',
      icon: DoorOpen,
      color: '#22d3ee',
      textColor: 'text-brand',
      bgGlow: 'bg-brand/10 border-brand/20',
      direction: 'up' as const,
      onClick: () => onTabChange('rooms'),
    },
    {
      label: 'Đang đóng dần',
      value: stats.closingCount ?? 0,
      sub: 'Chờ hết hạn TTL',
      icon: Clock,
      color: '#f59e0b',
      textColor: 'text-warning',
      bgGlow: 'bg-warning/10 border-warning/20',
      direction: 'down' as const,
      onClick: () => onTabChange('rooms'),
    },
    {
      label: 'Chưa ai vào',
      value: stats.neverJoinedCount ?? 0,
      sub: 'Tự hủy sau timeout',
      icon: AlertTriangle,
      color: '#a78bfa',
      textColor: 'text-social',
      bgGlow: 'bg-social/10 border-social/20',
      direction: 'down' as const,
      onClick: () => onTabChange('rooms'),
    },
    {
      label: 'Đã đóng hôm nay',
      value: stats.closedTodayCount ?? 0,
      sub: 'Hoàn tất phiên học',
      icon: DoorClosed,
      color: '#10b981',
      textColor: 'text-success',
      bgGlow: 'bg-success/10 border-success/20',
      direction: 'up' as const,
      onClick: undefined,
    },
  ]

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner with Visual Design Parity */}
      <div className="relative overflow-hidden rounded-3xl border border-border-default bg-surface/90 p-6 sm:p-8 shadow-xl backdrop-blur-xl">
        {/* Glow backdrop decorative lighting */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-social/15 blur-[120px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Admin Control Center • Quản lý tập trung</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Admin Control Center
            </h1>

            <p className="text-sm font-semibold text-brand/90">
              Manage. Support. Empower.
            </p>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Không gian điều hành trường học số an toàn, bảo mật và tương tác trực tiếp theo thời gian thực dành cho học sinh và giáo viên.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                onClick={onCreateRoom}
                className="h-9 rounded-xl bg-brand text-slate-950 font-bold hover:bg-brand-hover shadow-lg shadow-brand/20 gap-1.5 cursor-pointer"
              >
                <DoorOpen className="h-4 w-4" />
                <span>Tạo phòng học mới</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/admin/analytics')}
                className="h-9 rounded-xl border-border-default bg-surface-raised/80 hover:bg-surface-overlay text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <BarChart3 className="h-4 w-4 text-brand" />
                <span>Xem báo cáo phân tích</span>
              </Button>
            </div>
          </div>

          {/* Announcement Card with Editorial Art Header inside Hero */}
          <div className="w-full lg:max-w-md rounded-2xl border border-social/30 bg-social/10 overflow-hidden backdrop-blur-md shadow-md">
            <div className="relative h-28 w-full overflow-hidden bg-slate-900">
              <img
                src="/assets/admin/admin_poster.webp"
                alt="Admin Announcement"
                className="h-full w-full object-cover brightness-90"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2 text-xs font-bold text-social uppercase tracking-wider">
                <Megaphone className="h-3.5 w-3.5" />
                <span>Thông báo hệ thống</span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <h4 className="text-sm font-bold text-foreground">
                Giám sát giai đoạn học tập cao điểm
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tăng cường kiểm duyệt phòng học, duy trì hỗ trợ và đảm bảo chính sách bảo vệ dữ liệu cho toàn bộ thành viên trường.
              </p>
              <button
                type="button"
                onClick={() => onTabChange('audit')}
                className="inline-flex items-center gap-1 text-xs font-bold text-social hover:underline cursor-pointer pt-1"
              >
                <span>Xem nhật ký kiểm duyệt</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Four Metric Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className={`border-border-default bg-surface/80 shadow-md backdrop-blur-md transition-all ${
              kpi.onClick ? 'cursor-pointer hover:border-brand/40 hover:bg-surface-raised' : ''
            }`}
            onClick={kpi.onClick}
          >
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${kpi.bgGlow} ${kpi.textColor}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <Sparkline color={kpi.color} direction={kpi.direction} />
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {loadingRooms ? <Skeleton className="h-8 w-16 mb-1" /> : kpi.value}
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-muted-foreground font-medium">{kpi.label}</span>
                  <span className={`font-semibold ${kpi.textColor}`}>{kpi.sub}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Split 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Rooms Live Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
              <h3 className="text-base font-bold text-foreground">Phòng học trực tiếp</h3>
              <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-[10px] ml-1">
                Live
              </Badge>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetchRooms()}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Làm mới</span>
            </Button>
          </div>

          {roomsError && <p className="text-xs text-destructive">{String(roomsError)}</p>}

          <Card className="border-border-default bg-surface/80 shadow-md backdrop-blur-md overflow-hidden">
            <CardContent className="p-0">
              {loadingRooms ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : activeRooms.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <DoorClosed className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">Hiện chưa có phòng học nào đang mở.</p>
                  <Button
                    size="sm"
                    onClick={onCreateRoom}
                    className="h-8 text-xs bg-brand text-slate-950 font-bold hover:bg-brand-hover mt-2"
                  >
                    Tạo phòng đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border-subtle">
                  {activeRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-surface-raised/60 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-11 w-14 rounded-xl border border-brand/25 bg-slate-900 overflow-hidden shrink-0 mt-0.5 shadow-xs">
                          <img
                            src="/assets/learning/room_math.webp"
                            alt={room.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground truncate">
                              {room.name}
                            </span>
                            {statusBadge(room)}
                            <span className="text-[10px] text-muted-foreground">#{room.id}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-primary" />
                              <span className="font-medium text-foreground">{room.ownerDisplayName}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{fmtRelative(room.createdAt)}</span>
                            </span>
                            {room.autoCloseDeadline && room.lifecycleStatus === 'open' && (
                              <span className="text-warning text-[11px] font-medium">
                                Tự đóng: {fmtRelative(room.autoCloseDeadline)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/room/phong-${room.id}`)}
                          className="h-7 text-xs border-border-default bg-surface-raised/70 hover:bg-surface-overlay gap-1 cursor-pointer"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Vào</span>
                        </Button>

                        {room.lifecycleStatus === 'open' && (
                          closingId === room.id ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => closeRoomMut.mutate(room.id)}
                                disabled={closeRoomMut.isPending}
                                className="h-7 text-xs font-bold"
                              >
                                {closeRoomMut.isPending ? '...' : 'Đóng'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setClosingId(null)}
                                className="h-7 text-xs text-muted-foreground"
                              >
                                Hủy
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setClosingId(room.id)}
                              className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              <span>Đóng</span>
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Table Footer */}
              <div className="flex items-center justify-between border-t border-border-subtle p-3 px-4 bg-surface/50 text-xs text-muted-foreground">
                <span>Hiển thị {activeRooms.length} phòng gần nhất</span>
                <button
                  type="button"
                  onClick={() => onTabChange('rooms')}
                  className="font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem tất cả danh sách</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Room Moderation Quick Actions & Automated Policies (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card A: Room Moderation Quick Actions */}
          <Card className="border-border-default bg-surface/80 shadow-md backdrop-blur-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-brand" />
                <span>Kiểm duyệt & Vận hành</span>
              </CardTitle>
              <button
                type="button"
                onClick={() => onTabChange('audit')}
                className="text-xs font-bold text-social hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Nhật ký</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => onTabChange('rooms')}
                  className="h-10 justify-start border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs font-semibold gap-2 cursor-pointer"
                >
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>Đóng phòng</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/analytics')}
                  className="h-10 justify-start border-border-default bg-surface-raised hover:bg-surface-overlay text-xs font-semibold gap-2 cursor-pointer"
                >
                  <BarChart3 className="h-4 w-4 text-brand shrink-0" />
                  <span>Analytics</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => onTabChange('policy')}
                  className="h-10 justify-start border-border-default bg-surface-raised hover:bg-surface-overlay text-xs font-semibold gap-2 cursor-pointer"
                >
                  <Sliders className="h-4 w-4 text-warning shrink-0" />
                  <span>Cấu hình TTL</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    refetchRooms()
                    refetchPolicy()
                  }}
                  className="h-10 justify-start border-border-default bg-surface-raised hover:bg-surface-overlay text-xs font-semibold gap-2 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4 text-success shrink-0" />
                  <span>Đồng bộ D1</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card B: Automated Policies Status Display (Canonical editing in Policy tab) */}
          <Card className="border-border-default bg-surface/80 shadow-md backdrop-blur-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-brand" />
                <span>Chính sách tự động</span>
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTabChange('policy')}
                className="h-7 text-xs border-border-default hover:bg-surface-raised cursor-pointer gap-1"
              >
                <span>Cấu hình TTL</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Policy Item 1: Auto-close enabled */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-raised/50">
                <div>
                  <p className="text-xs font-bold text-foreground">Tự động đóng phòng</p>
                  <p className="text-[11px] text-muted-foreground">Vòng đời TTL tự động của D1</p>
                </div>
                <Badge variant="outline" className={policy?.autoCloseEnabled ? 'border-success/30 bg-success/10 text-success text-xs' : 'border-border-default text-muted-foreground text-xs'}>
                  {policy?.autoCloseEnabled ? 'Đang bật' : 'Đang tắt'}
                </Badge>
              </div>

              {/* Policy Item 2: Empty room TTL */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-raised/50">
                <div>
                  <p className="text-xs font-bold text-foreground">Đóng phòng trống</p>
                  <p className="text-[11px] text-muted-foreground">
                    Sau {policy?.emptyRoomTtlMinutes || 30} phút không có ai
                  </p>
                </div>
                <span className="text-xs font-extrabold text-brand">
                  {fmtMinutes(policy?.emptyRoomTtlMinutes || 30)}
                </span>
              </div>

              {/* Policy Item 3: Never joined TTL */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-raised/50">
                <div>
                  <p className="text-xs font-bold text-foreground">Phòng chưa ai vào</p>
                  <p className="text-[11px] text-muted-foreground">
                    Hủy sau {policy?.neverJoinedTtlMinutes || 15} phút tạo
                  </p>
                </div>
                <span className="text-xs font-extrabold text-warning">
                  {fmtMinutes(policy?.neverJoinedTtlMinutes || 15)}
                </span>
              </div>

              {/* Policy Item 4: Max room lifetime */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border-subtle bg-surface-raised/50">
                <div>
                  <p className="text-xs font-bold text-foreground">Thời lượng tối đa</p>
                  <p className="text-[11px] text-muted-foreground">
                    Tối đa {fmtMinutes(policy?.maxRoomLifetimeMinutes || 240)} / phiên
                  </p>
                </div>
                <span className="text-xs font-extrabold text-social">
                  {fmtMinutes(policy?.maxRoomLifetimeMinutes || 240)}
                </span>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onTabChange('policy')}
                  className="w-full text-center text-xs font-bold text-brand hover:underline cursor-pointer"
                >
                  Điều chỉnh thanh trượt chi tiết trong Tab Chính Sách →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Rooms Panel ─────────────────────────────────────────────────────────────

function RoomsPanel() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [closingId, setClosingId] = useState<number | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-rooms', page, status, q],
    queryFn: () => fetchAdminRooms({ page, limit: 20, status, q }),
    staleTime: 15_000,
  })

  const closeRoomMut = useMutation({
    mutationFn: async (roomId: number) => {
      const res = await fetch(`/api/admin/rooms/${roomId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'admin_closed' }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Đóng phòng thất bại.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rooms'] })
      qc.invalidateQueries({ queryKey: ['admin-rooms-overview'] })
      setClosingId(null)
    },
  })

  const statusFilters = [
    { value: 'all', label: 'Tất cả' },
    { value: 'mo', label: 'Đang mở' },
    { value: 'never_joined', label: 'Chưa ai vào' },
    { value: 'empty', label: 'Đang trống' },
    { value: 'closing', label: 'Đang đóng' },
    { value: 'dong', label: 'Đã đóng' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatus(f.value)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                status === f.value
                  ? 'bg-brand text-slate-950 shadow-sm'
                  : 'bg-surface-raised border border-border-default text-muted-foreground hover:text-foreground hover:bg-surface-overlay'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setQ(searchInput)
                  setPage(1)
                }
              }}
              placeholder="Tìm phòng..."
              className="pl-8 h-8 text-xs bg-surface border-border-default text-foreground placeholder:text-muted-foreground w-48"
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-muted-foreground hover:text-foreground h-8 cursor-pointer">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{String(error)}</p>}
      {closeRoomMut.error && <p className="text-sm text-destructive">{String(closeRoomMut.error)}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.rooms ?? []).length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-xs">Không có phòng nào phù hợp bộ lọc.</div>
          )}
          {(data?.rooms ?? []).map((room) => (
            <div
              key={room.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-surface/80 border border-border-default hover:border-brand/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusBadge(room)}
                  <span className="text-sm font-bold text-foreground truncate">{room.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">#{room.id}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {room.ownerDisplayName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmtRelative(room.createdAt)}
                  </span>
                  {room.autoCloseDeadline && room.lifecycleStatus === 'open' && (
                    <span className="text-warning font-medium">
                      Tự đóng: {fmtRelative(room.autoCloseDeadline)}
                    </span>
                  )}
                </div>
              </div>

              {room.lifecycleStatus === 'open' && (
                closingId === room.id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => closeRoomMut.mutate(room.id)}
                      disabled={closeRoomMut.isPending}
                      className="h-7 text-xs font-bold"
                    >
                      {closeRoomMut.isPending ? '...' : 'Xác nhận đóng'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setClosingId(null)}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setClosingId(room.id)}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Đóng phòng
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Tổng: {data.pagination.total} phòng</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs">
              Trang {page} / {data.pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Policy Panel ─────────────────────────────────────────────────────────────

function PolicyPanel() {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-room-policy'],
    queryFn: fetchPolicy,
    staleTime: 60_000,
  })

  const [form, setForm] = useState<Partial<RoomLifecyclePolicy>>({})
  const policy = data?.policy

  const saveMut = useMutation({
    mutationFn: async (payload: Partial<RoomLifecyclePolicy> & { expectedRevision?: number }) => {
      const res = await fetch('/api/admin/room-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error || 'Lưu chính sách thất bại.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-room-policy'] })
      setForm({})
    },
  })

  const current = useMemo(
    () => ({ ...policy, ...form }) as RoomLifecyclePolicy,
    [policy, form],
  )

  const handleSave = useCallback(() => {
    if (!policy) return
    saveMut.mutate({
      autoCloseEnabled: current.autoCloseEnabled,
      neverJoinedTtlMinutes: current.neverJoinedTtlMinutes,
      emptyRoomTtlMinutes: current.emptyRoomTtlMinutes,
      maxRoomLifetimeMinutes: current.maxRoomLifetimeMinutes,
      expectedRevision: policy.revision,
    })
  }, [policy, current, saveMut])

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  if (error) return <p className="text-sm text-destructive">{String(error)}</p>

  return (
    <div className="space-y-5 max-w-xl">
      <div className="p-3.5 rounded-xl bg-brand/10 border border-brand/20 text-xs text-brand flex items-start gap-2.5">
        <span className="font-bold shrink-0">Lưu ý:</span>
        <span>
          Thay đổi áp dụng cho các phòng được tạo sau khi lưu. Các phòng đang mở hiện tại giữ nguyên snapshot chính sách đã nhận khi tạo.
        </span>
      </div>

      {saveMut.error && <p className="text-sm text-destructive">{String(saveMut.error)}</p>}
      {saveMut.isSuccess && <p className="text-sm text-success">Đã lưu chính sách thành công.</p>}

      {/* Auto-close toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-surface/80 border border-border-default">
        <div>
          <p className="text-sm font-bold text-foreground">Tự động đóng phòng</p>
          <p className="text-xs text-muted-foreground mt-0.5">Kích hoạt các quy tắc TTL bên dưới</p>
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, autoCloseEnabled: !current.autoCloseEnabled }))}
          className="cursor-pointer transition-colors"
        >
          {current.autoCloseEnabled ? (
            <ToggleRight className="h-8 w-8 text-success" />
          ) : (
            <ToggleLeft className="h-8 w-8 text-muted-foreground" />
          )}
        </button>
      </div>

      {[
        {
          key: 'neverJoinedTtlMinutes' as keyof RoomLifecyclePolicy,
          label: 'TTL phòng chưa ai vào',
          desc: 'Thời gian tối đa phòng tồn tại mà không có ai tham gia lần đầu.',
          min: 1,
          max: 120,
        },
        {
          key: 'emptyRoomTtlMinutes' as keyof RoomLifecyclePolicy,
          label: 'TTL phòng trống',
          desc: 'Thời gian tối đa phòng tồn tại sau khi người cuối cùng rời đi.',
          min: 1,
          max: 1440,
        },
        {
          key: 'maxRoomLifetimeMinutes' as keyof RoomLifecyclePolicy,
          label: 'Thời gian tồn tại tối đa',
          desc: 'Thời gian tối đa một phòng được phép hoạt động.',
          min: 15,
          max: 10080,
        },
      ].map((field) => {
        const val = current[field.key] as number
        return (
          <div key={field.key} className="p-4 rounded-xl bg-surface/80 border border-border-default space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{field.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{field.desc}</p>
              </div>
              <span className="text-sm font-bold text-brand ml-4 shrink-0">{fmtMinutes(val)}</span>
            </div>
            <input
              type="range"
              min={field.min}
              max={field.max}
              value={val}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: parseInt(e.target.value, 10) }))}
              className="w-full accent-brand"
            />
          </div>
        )
      })}

      <Button
        onClick={handleSave}
        disabled={saveMut.isPending || Object.keys(form).length === 0}
        className="bg-brand text-slate-950 font-bold hover:bg-brand-hover w-full cursor-pointer"
      >
        {saveMut.isPending ? 'Đang lưu...' : 'Lưu chính sách'}
      </Button>

      {policy && (
        <p className="text-xs text-muted-foreground text-center">
          Phiên bản hiện tại: #{policy.revision} · Cập nhật: {fmtRelative(policy.updatedAt)}
        </p>
      )}
    </div>
  )
}

// ─── Audit Panel ──────────────────────────────────────────────────────────────

function AuditPanel() {
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => fetchAuditLogs(page),
    staleTime: 30_000,
  })

  const actionLabel: Record<string, string> = {
    kick: 'Kick thành viên',
    ban: 'Cấm tài khoản',
    unban: 'Bỏ cấm',
    voice_mute: 'Tắt micro',
    report_resolved: 'Giải quyết báo cáo',
    admin_room_close: 'Admin đóng phòng',
    system_room_close: 'Hệ thống tự đóng',
    owner_room_close: 'Chủ phòng đóng',
    room_policy_update: 'Cập nhật chính sách',
    room_lifecycle_bootstrap_failed: 'Khởi tạo phòng lỗi',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Nhật ký kiểm duyệt và hành động bảo vệ hệ thống.</p>
        <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-muted-foreground hover:text-foreground h-8 cursor-pointer">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{String(error)}</p>}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.logs ?? []).length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-xs">Chưa có nhật ký nào được ghi nhận.</div>
          )}
          {(data?.logs ?? []).map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-surface/80 border border-border-default text-xs"
            >
              <div className="h-7 w-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 mt-0.5 text-brand">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{actionLabel[log.hanh_dong] ?? log.hanh_dong}</span>
                  {log.phong_id && <span className="text-[11px] text-brand">Phòng #{log.phong_id}</span>}
                </div>
                {log.chi_tiet && <p className="text-muted-foreground truncate mt-0.5">{log.chi_tiet}</p>}
              </div>
              <span className="text-muted-foreground shrink-0">{new Date(log.tao_luc).toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 20 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tổng: {data.total} bản ghi</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs">
              Trang {page} / {Math.ceil(data.total / 20)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= Math.ceil(data.total / 20)}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminControlPlanePage() {
  const navigate = useNavigate()
  const { nguoiDung } = usePhien()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [createRoomOpen, setCreateRoomOpen] = useState(false)

  if (!nguoiDung) return null
  if (!nguoiDung.isSchoolAdmin) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-muted-foreground text-sm">
        Bạn không có quyền quản trị viên trường học để truy cập trang này.
      </div>
    )
  }

  const tabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Bảng điều khiển', icon: Home },
    { id: 'rooms', label: 'Quản lý phòng', icon: BookOpen },
    { id: 'policy', label: 'Chính sách tự động', icon: Settings2 },
    { id: 'audit', label: 'Nhật ký kiểm duyệt', icon: ClipboardList },
  ]

  return (
    <div className="min-h-screen bg-canvas text-foreground pb-12">
      {/* Sub-Header Navigation Bar */}
      <div className="border-b border-border-subtle bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground -ml-2 h-8 px-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Sảnh</span>
            </Button>

            <div className="h-4 w-px bg-border-subtle" />

            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground leading-none">Trung tâm Kiểm soát Quản trị</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Digital Campus v2.1 • Control Plane</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-brand/40 bg-brand/10 text-brand text-xs font-semibold">
              Quyền Quản trị viên
            </Badge>

            <Button
              size="sm"
              onClick={() => setCreateRoomOpen(true)}
              className="h-8 text-xs bg-brand text-slate-950 font-bold hover:bg-brand-hover cursor-pointer"
            >
              + Tạo phòng
            </Button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold transition-all border-b-2 shrink-0 cursor-pointer ${
                tab === t.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === 'overview' && (
          <OverviewPanel onTabChange={setTab} onCreateRoom={() => setCreateRoomOpen(true)} />
        )}
        {tab === 'rooms' && <RoomsPanel />}
        {tab === 'policy' && <PolicyPanel />}
        {tab === 'audit' && <AuditPanel />}
      </div>

      {/* Create Study Room Dialog */}
      <CreateStudyRoomDialog
        open={createRoomOpen}
        onOpenChange={setCreateRoomOpen}
        onSuccess={() => setCreateRoomOpen(false)}
      />
    </div>
  )
}
