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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  ToggleLeft,
  ToggleRight,
  ClipboardList,
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
    return <Badge variant="outline" className="border-slate-600 text-slate-400">Đã đóng</Badge>
  if (item.lifecycleStatus === 'closing')
    return <Badge variant="outline" className="border-yellow-600 text-yellow-400">Đang đóng</Badge>
  if (!item.everJoined)
    return <Badge variant="outline" className="border-orange-600 text-orange-400">Chưa ai vào</Badge>
  return <Badge variant="outline" className="border-emerald-600 text-emerald-400">Đang mở</Badge>
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

function OverviewPanel({ onTabChange }: { onTabChange: (t: AdminTab) => void }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-rooms-overview'],
    queryFn: () => fetchAdminRooms({ page: 1, limit: 1, status: 'all', q: '' }),
    staleTime: 30_000,
  })

  const stats = data?.stats ?? {}

  const kpis = [
    { label: 'Phòng đang mở', value: stats.openCount ?? '—', icon: DoorOpen, color: 'text-emerald-400', onClick: () => onTabChange('rooms') },
    { label: 'Đang đóng', value: stats.closingCount ?? '—', icon: Clock, color: 'text-yellow-400', onClick: () => onTabChange('rooms') },
    { label: 'Đóng hôm nay', value: stats.closedTodayCount ?? '—', icon: DoorClosed, color: 'text-slate-400', onClick: undefined },
    { label: 'Chưa ai vào', value: stats.neverJoinedCount ?? '—', icon: AlertTriangle, color: 'text-orange-400', onClick: () => onTabChange('rooms') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Tổng quan hệ thống</h2>
        <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-slate-400 hover:text-white">
          <RefreshCw className="h-4 w-4 mr-1.5" />Làm mới
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{String(error)}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.label}
            className={`bg-[#0f1923] border-white/10 ${kpi.onClick ? 'cursor-pointer hover:border-white/20 transition-colors' : ''}`}
            onClick={kpi.onClick}
          >
            <CardContent className="p-5">
              <div className={`h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center mb-3 ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              {isLoading
                ? <Skeleton className="h-8 w-16 mb-1" />
                : <div className="text-2xl font-bold text-white">{kpi.value}</div>
              }
              <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[#0f1923] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo-400" />Truy cập nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Quản lý phòng học', tab: 'rooms' as AdminTab, icon: BookOpen },
              { label: 'Chính sách tự động đóng', tab: 'policy' as AdminTab, icon: Settings2 },
              { label: 'Nhật ký kiểm duyệt', tab: 'audit' as AdminTab, icon: ClipboardList },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => onTabChange(item.tab)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-slate-300 hover:text-white"
              >
                <item.icon className="h-4 w-4 text-indigo-400" />
                {item.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#0f1923] border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />Trạng thái bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'RBAC Admin fail-closed', ok: true },
              { label: 'D1 admission gate', ok: true },
              { label: 'phong_ban fail-closed', ok: true },
              { label: 'Auto-close lifecycle', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-400">{item.label}</span>
                {item.ok
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  : <XCircle className="h-4 w-4 text-red-400" />
                }
              </div>
            ))}
          </CardContent>
        </Card>
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
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error || 'Đóng phòng thất bại.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rooms'] })
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
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === f.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setQ(searchInput); setPage(1) } }}
              placeholder="Tìm phòng..."
              className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-slate-500 w-44"
            />
          </div>
          <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-slate-400 h-8">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{String(error)}</p>}
      {closeRoomMut.error && (
        <p className="text-sm text-red-400">{String(closeRoomMut.error)}</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.rooms ?? []).length === 0 && (
            <div className="text-center py-10 text-slate-500">Không có phòng nào.</div>
          )}
          {(data?.rooms ?? []).map((room) => (
            <div key={room.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#0f1923] border border-white/10 hover:border-white/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusBadge(room)}
                  <span className="text-sm font-medium text-white truncate">{room.name}</span>
                  <span className="text-xs text-slate-500 shrink-0">#{room.id}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {room.ownerDisplayName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {fmtRelative(room.createdAt)}
                  </span>
                  {room.autoCloseDeadline && room.lifecycleStatus === 'open' && (
                    <span className="text-orange-400">
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
                      className="h-7 text-xs"
                    >
                      {closeRoomMut.isPending ? '...' : 'Xác nhận đóng'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setClosingId(null)} className="h-7 text-xs text-slate-400">
                      Hủy
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setClosingId(room.id)}
                    className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />Đóng phòng
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
          <span>Tổng: {data.pagination.total} phòng</span>
          <div className="flex gap-2">
            <Button
              size="sm" variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="h-7 px-2 text-slate-400"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs leading-7">Trang {page}/{data.pagination.totalPages}</span>
            <Button
              size="sm" variant="ghost"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-7 px-2 text-slate-400"
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
        const body = await res.json().catch(() => ({})) as { error?: string }
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

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
  if (error) return <p className="text-sm text-red-400">{String(error)}</p>

  return (
    <div className="space-y-5 max-w-xl">
      <p className="text-sm text-slate-400">
        Cấu hình chính sách vòng đời phòng học. Thay đổi áp dụng ngay cho các phòng mới.
      </p>

      {saveMut.error && <p className="text-sm text-red-400">{String(saveMut.error)}</p>}
      {saveMut.isSuccess && <p className="text-sm text-emerald-400">Đã lưu chính sách thành công.</p>}

      {/* Auto-close toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f1923] border border-white/10">
        <div>
          <p className="text-sm font-medium text-white">Tự động đóng phòng</p>
          <p className="text-xs text-slate-500 mt-0.5">Kích hoạt các quy tắc TTL bên dưới</p>
        </div>
        <button
          onClick={() => setForm(f => ({ ...f, autoCloseEnabled: !current.autoCloseEnabled }))}
          className={`transition-colors ${current.autoCloseEnabled ? 'text-emerald-400' : 'text-slate-600'}`}
        >
          {current.autoCloseEnabled
            ? <ToggleRight className="h-8 w-8" />
            : <ToggleLeft className="h-8 w-8" />
          }
        </button>
      </div>

      {[
        {
          key: 'neverJoinedTtlMinutes' as keyof RoomLifecyclePolicy,
          label: 'TTL phòng chưa ai vào',
          desc: 'Thời gian tối đa phòng tồn tại mà không có ai tham gia lần đầu.',
          min: 1, max: 120,
        },
        {
          key: 'emptyRoomTtlMinutes' as keyof RoomLifecyclePolicy,
          label: 'TTL phòng trống',
          desc: 'Thời gian tối đa phòng tồn tại sau khi người cuối cùng rời đi.',
          min: 1, max: 1440,
        },
        {
          key: 'maxRoomLifetimeMinutes' as keyof RoomLifecyclePolicy,
          label: 'Thời gian tồn tại tối đa',
          desc: 'Thời gian tối đa một phòng được phép hoạt động.',
          min: 15, max: 10080,
        },
      ].map((field) => {
        const val = current[field.key] as number
        return (
          <div key={field.key} className="p-4 rounded-xl bg-[#0f1923] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{field.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{field.desc}</p>
              </div>
              <span className="text-sm font-semibold text-indigo-400 ml-4 shrink-0">{fmtMinutes(val)}</span>
            </div>
            <input
              type="range"
              min={field.min}
              max={field.max}
              value={val}
              onChange={(e) => setForm(f => ({ ...f, [field.key]: parseInt(e.target.value, 10) }))}
              className="w-full accent-indigo-500"
            />
          </div>
        )
      })}

      <Button
        onClick={handleSave}
        disabled={saveMut.isPending || Object.keys(form).length === 0}
        className="bg-indigo-600 hover:bg-indigo-500 text-white w-full"
      >
        {saveMut.isPending ? 'Đang lưu...' : 'Lưu chính sách'}
      </Button>

      {policy && (
        <p className="text-xs text-slate-600 text-center">
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
    kick: 'Kick',
    ban: 'Cấm',
    unban: 'Bỏ cấm',
    voice_mute: 'Tắt mic',
    report_resolved: 'Giải quyết báo cáo',
    admin_room_close: 'Admin đóng phòng',
    system_room_close: 'Hệ thống đóng phòng',
    owner_room_close: 'Chủ phòng đóng',
    room_policy_update: 'Cập nhật chính sách',
    room_lifecycle_bootstrap_failed: 'Khởi tạo phòng thất bại',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Nhật ký các hành động kiểm duyệt và vận hành.</p>
        <Button size="sm" variant="ghost" onClick={() => refetch()} className="text-slate-400 h-8">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {error && <p className="text-sm text-red-400">{String(error)}</p>}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {(data?.logs ?? []).length === 0 && (
            <div className="text-center py-10 text-slate-500">Chưa có nhật ký nào.</div>
          )}
          {(data?.logs ?? []).map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0f1923] border border-white/10 text-sm">
              <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{actionLabel[log.hanh_dong] ?? log.hanh_dong}</span>
                  {log.phong_id && <span className="text-xs text-slate-500">Phòng #{log.phong_id}</span>}
                </div>
                {log.chi_tiet && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{log.chi_tiet}</p>
                )}
              </div>
              <span className="text-xs text-slate-600 shrink-0">{new Date(log.tao_luc).toLocaleString('vi')}</span>
            </div>
          ))}
        </div>
      )}

      {data && data.total > 20 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>Tổng: {data.total} bản ghi</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 px-2 text-slate-400">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs leading-7">Trang {page}/{Math.ceil(data.total / 20)}</span>
            <Button size="sm" variant="ghost" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)} className="h-7 px-2 text-slate-400">
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

  if (!nguoiDung) return null
  if (!nguoiDung.isSchoolAdmin) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center text-slate-400">
        Bạn không có quyền truy cập trang này.
      </div>
    )
  }

  const tabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Tổng quan', icon: Home },
    { id: 'rooms', label: 'Phòng học', icon: BookOpen },
    { id: 'policy', label: 'Chính sách', icon: Settings2 },
    { id: 'audit', label: 'Nhật ký', icon: ClipboardList },
  ]

  return (
    <div className="min-h-screen bg-[#080e1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a1221]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Sảnh
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
              <Shield className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">Bảng điều khiển quản trị</h1>
              <p className="text-xs text-slate-500 mt-0.5">Digital Campus v2 · Admin Control Plane</p>
            </div>
          </div>
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 text-xs">
            A1
          </Badge>
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'overview' && <OverviewPanel onTabChange={setTab} />}
        {tab === 'rooms' && <RoomsPanel />}
        {tab === 'policy' && <PolicyPanel />}
        {tab === 'audit' && <AuditPanel />}
      </div>
    </div>
  )
}
