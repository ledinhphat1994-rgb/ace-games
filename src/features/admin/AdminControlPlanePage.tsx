// Digital Campus v2: Milestone A1 — Admin Control Plane
// src/features/admin/AdminControlPlanePage.tsx
//
// Chỉ hiển thị số liệu thật từ /api/admin/*: không biểu đồ trang trí, không thông báo viết cứng, không ảnh minh hoạ giả.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { usePhien } from '@/app/phien'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreateStudyRoomDialog } from '@/features/hub/CreateStudyRoomDialog'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DoorClosed,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'
import type { AdminRoomItem, RoomLifecyclePolicy } from '@shared/protocol/room'
import type {
  AdminAccountCounts,
  AdminAccountItem,
  HanhDongTaiKhoan,
  LocTaiKhoan,
} from '@shared/protocol/admin-accounts'

// ─── Types ───────────────────────────────────────────────────────────────────

/** Một dòng nhật ký đúng như GET /api/admin/audit-logs trả về. */
interface AuditLogEntry {
  id: number
  actorId: number | null
  actorName: string | null
  targetId: number | null
  targetName: string | null
  roomId: number | null
  roomTitle: string | null
  action: string
  reason: string | null
  createdAt: number
}

type AdminTab = 'overview' | 'rooms' | 'accounts' | 'policy' | 'audit'
type LocPhong = 'all' | 'mo' | 'never_joined' | 'empty' | 'closing' | 'dong'

const SO_NHAT_KY_MOI_TRANG = 20

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

/** Hạn tự đóng nằm ở tương lai (trước đây dùng chung hàm "… trước" nên luôn hiện "vừa xong"). */
function fmtHanTuDong(ts: number): string {
  const conLai = ts - Date.now()
  if (conLai <= 60_000) return 'sắp tự đóng'
  if (conLai < 3600_000) return `tự đóng sau ${Math.ceil(conLai / 60_000)} phút`
  if (conLai < 86400_000) return `tự đóng sau ${Math.round(conLai / 3600_000)} giờ`
  return `tự đóng sau ${Math.round(conLai / 86400_000)} ngày`
}

/** "25/09 13:07" — tự ghép vì Intl vi-VN cho ngày/tháng ra "25-09". */
function fmtThoiDiem(ts: number): string {
  const d = new Date(ts)
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${hai(d.getDate())}/${hai(d.getMonth() + 1)} ${hai(d.getHours())}:${hai(d.getMinutes())}`
}

const TEN_HANH_DONG: Record<string, string> = {
  kick: 'Mời ra khỏi phòng',
  ban: 'Cấm vào phòng',
  unban: 'Bỏ cấm',
  voice_mute: 'Tắt micro',
  report_resolved: 'Xử lý báo cáo',
  admin_room_close: 'Quản trị viên đóng phòng',
  system_room_close: 'Hệ thống tự đóng phòng',
  owner_room_close: 'Chủ phòng đóng phòng',
  room_policy_update: 'Cập nhật chính sách tự đóng',
  room_lifecycle_bootstrap_failed: 'Khởi tạo phòng lỗi',
  teacher_approve: 'Duyệt giáo viên',
  teacher_reject: 'Từ chối yêu cầu giáo viên',
  teacher_grant: 'Cấp quyền giáo viên',
  account_lock: 'Khoá tài khoản',
  account_unlock: 'Mở khoá tài khoản',
}

const LY_DO: Record<string, string> = {
  admin_closed: 'quản trị viên đóng',
  owner_closed: 'chủ phòng đóng',
  empty_timeout: 'phòng trống quá hạn',
  never_joined_timeout: 'không ai vào trong thời hạn',
  max_lifetime: 'hết thời lượng tối đa',
  moderation: 'kiểm duyệt',
  moderator_room_close: 'kiểm duyệt',
  system_cleanup: 'dọn dẹp tự động',
  aborted: 'huỷ giữa chừng',
}

const LOC_PHONG: { value: LocPhong; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'mo', label: 'Đang mở' },
  { value: 'never_joined', label: 'Chưa ai vào' },
  { value: 'empty', label: 'Đang trống' },
  { value: 'closing', label: 'Đang đóng' },
  { value: 'dong', label: 'Đã đóng' },
]

const LOC_TAI_KHOAN_UI: { value: LocTaiKhoan; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending_teacher', label: 'Chờ duyệt' },
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'student', label: 'Học sinh' },
  { value: 'locked', label: 'Đã khoá' },
]

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
  // Máy chủ phân trang theo `page` (trước đây gửi `offset` nên luôn trả trang đầu)
  const res = await fetch(`/api/admin/audit-logs?limit=${SO_NHAT_KY_MOI_TRANG}&page=${page}`)
  if (!res.ok) throw new Error('Không thể tải nhật ký.')
  return res.json()
}

async function fetchAdminAccounts(params: {
  page: number
  limit: number
  filter: LocTaiKhoan
  q: string
}): Promise<{
  ok: boolean
  accounts: AdminAccountItem[]
  pagination: { total: number; page: number; totalPages: number }
  counts: AdminAccountCounts
}> {
  const sp = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    filter: params.filter,
    q: params.q,
  })
  const res = await fetch(`/api/admin/accounts?${sp}`)
  if (!res.ok) throw new Error('Không thể tải danh sách tài khoản.')
  return res.json()
}

const THONG_BAO_THAO_TAC: Record<HanhDongTaiKhoan, string> = {
  approve_teacher: 'Đã duyệt tài khoản giáo viên.',
  reject_teacher: 'Đã từ chối — tài khoản chuyển về học sinh.',
  grant_teacher: 'Đã cấp quyền giáo viên.',
  lock: 'Đã khoá tài khoản và ngắt các phiên đang mở.',
  unlock: 'Đã mở khoá tài khoản.',
}

function useThaoTacTaiKhoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: HanhDongTaiKhoan }) => {
      const res = await fetch(`/api/admin/accounts/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; loi?: string }
        throw new Error(body.error || body.loi || 'Thao tác thất bại.')
      }
      return res.json()
    },
    onSuccess: (_data, { action }) => toast.success(THONG_BAO_THAO_TAC[action]),
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Thao tác thất bại.'),
    // Thành công hay 409 (vừa đổi ở nơi khác) đều nạp lại để danh sách khớp máy chủ.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin-accounts'] })
      qc.invalidateQueries({ queryKey: ['admin-account-counts'] })
      qc.invalidateQueries({ queryKey: ['admin-audit-logs'] })
    },
  })
}

function useDongPhong() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (roomId: number) => {
      const res = await fetch(`/api/admin/rooms/${roomId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'admin_closed' }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; loi?: string }
        throw new Error(body.error || body.loi || 'Đóng phòng thất bại.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rooms-overview'] })
      qc.invalidateQueries({ queryKey: ['admin-rooms'] })
      toast.success('Đã đóng phòng.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Đóng phòng thất bại.'),
  })
}

// ─── Shared pieces ───────────────────────────────────────────────────────────

function NhanTrangThai({ room }: { room: AdminRoomItem }) {
  const [nhan, mau] =
    room.lifecycleStatus === 'closed'
      ? ['Đã đóng', 'bg-surface-overlay text-text-tertiary']
      : room.lifecycleStatus === 'closing'
        ? ['Đang đóng', 'bg-warning/12 text-warning']
        : !room.everJoined
          ? ['Chưa ai vào', 'bg-social/12 text-social']
          : ['Đang mở', 'bg-success/12 text-success']
  return (
    <span className={cn('inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium', mau)}>
      {nhan}
    </span>
  )
}

function DanhSachPhong({ rooms }: { rooms: AdminRoomItem[] }) {
  const navigate = useNavigate()
  const dongPhong = useDongPhong()
  const [phongCanDong, setPhongCanDong] = useState<AdminRoomItem | null>(null)

  return (
    <>
      <ul className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface">
        {rooms.map((room) => (
          <li key={room.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="min-w-0 text-sm font-medium break-words text-text-primary">{room.name}</span>
                <NhanTrangThai room={room} />
              </p>
              <p className="mt-1 text-xs break-words text-text-tertiary">
                #{room.id} · {room.ownerDisplayName} · {room.scope === 'truong' ? 'Toàn trường' : 'Trong lớp'}
                {room.accessMode === 'password' ? ' · Có mật khẩu' : ''} · tạo {fmtRelative(room.createdAt)}
                {room.lifecycleStatus === 'open' && room.autoCloseDeadline ? (
                  <span className="text-warning"> · {fmtHanTuDong(room.autoCloseDeadline)}</span>
                ) : null}
              </p>
            </div>

            {room.lifecycleStatus === 'open' && (
              <div className="max-sm:day-loc-deu-co-gian shrink-0 gap-2 sm:flex">
                <Button size="xs" variant="outline" onClick={() => navigate(`/room/phong-${room.id}`)}>
                  <ExternalLink />
                  Vào phòng
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setPhongCanDong(room)}
                >
                  <XCircle />
                  Đóng phòng
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <AlertDialog
        open={phongCanDong !== null}
        onOpenChange={(mo) => {
          if (!mo && !dongPhong.isPending) setPhongCanDong(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Đóng phòng này?</AlertDialogTitle>
            <AlertDialogDescription>
              “{phongCanDong?.name}” sẽ đóng ngay, mọi người trong phòng được mời ra và phòng không mở lại được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dongPhong.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={dongPhong.isPending}
              onClick={() => {
                if (phongCanDong) dongPhong.mutate(phongCanDong.id, { onSettled: () => setPhongCanDong(null) })
              }}
            >
              {dongPhong.isPending && <Loader2 className="animate-spin" />}
              Đóng phòng
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function KhungTai({ dong = 3, cao = 'h-16' }: { dong?: number; cao?: string }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: dong }, (_, i) => (
        <Skeleton key={i} className={cn('w-full rounded-2xl', cao)} />
      ))}
    </div>
  )
}

function KhungLoi({ thongBao, onThuLai }: { thongBao: string; onThuLai: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-surface px-6 py-10 text-center">
      <AlertCircle className="size-6 text-destructive" />
      <p className="mt-2 text-sm font-medium text-text-primary">{thongBao}</p>
      <Button variant="outline" size="xs" className="mt-3" onClick={onThuLai}>
        <RefreshCw />
        Thử lại
      </Button>
    </div>
  )
}

function KhungTrong({ icon: Icon, tieuDe, moTa }: { icon: typeof DoorClosed; tieuDe: string; moTa?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle px-6 py-10 text-center">
      <Icon className="size-6 text-text-tertiary" />
      <p className="mt-2 text-sm font-medium text-text-primary">{tieuDe}</p>
      {moTa && <p className="mt-1 max-w-sm text-xs text-text-tertiary">{moTa}</p>}
    </div>
  )
}

function PhanTrang({ trang, tongTrang, onDoi }: { trang: number; tongTrang: number; onDoi: (trang: number) => void }) {
  if (tongTrang <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2 text-xs text-text-tertiary">
      <Button size="icon-sm" variant="ghost" disabled={trang <= 1} onClick={() => onDoi(trang - 1)} aria-label="Trang trước">
        <ChevronLeft />
      </Button>
      <span className="tabular-nums">
        Trang {trang} / {tongTrang}
      </span>
      <Button
        size="icon-sm"
        variant="ghost"
        disabled={trang >= tongTrang}
        onClick={() => onDoi(trang + 1)}
        aria-label="Trang sau"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

// ─── Overview Panel ───────────────────────────────────────────────────────────

function OverviewPanel({
  onXemPhong,
  onXemChinhSach,
  onTaoPhong,
}: {
  onXemPhong: (loc: LocPhong) => void
  onXemChinhSach: () => void
  onTaoPhong: () => void
}) {
  const {
    data: roomsData,
    isLoading: loadingRooms,
    isError: roomsError,
    refetch: refetchRooms,
    isFetching,
  } = useQuery({
    queryKey: ['admin-rooms-overview'],
    queryFn: () => fetchAdminRooms({ page: 1, limit: 6, status: 'all', q: '' }),
    staleTime: 20_000,
  })

  const {
    data: policyData,
    isLoading: loadingPolicy,
    isError: policyError,
    refetch: refetchPolicy,
  } = useQuery({
    queryKey: ['admin-room-policy'],
    queryFn: fetchPolicy,
    staleTime: 60_000,
  })

  const policy = policyData?.policy
  const stats = roomsData?.stats
  const rooms = roomsData?.rooms ?? []

  const chiSo: { loc: LocPhong; nhan: string; giaTri: number | undefined; mau: string }[] = [
    { loc: 'mo', nhan: 'Đang mở', giaTri: stats?.openCount, mau: 'text-success' },
    { loc: 'never_joined', nhan: 'Chưa ai vào', giaTri: stats?.neverJoinedCount, mau: 'text-social' },
    { loc: 'closing', nhan: 'Đang đóng dần', giaTri: stats?.closingCount, mau: 'text-warning' },
    { loc: 'dong', nhan: 'Đã đóng hôm nay', giaTri: stats?.closedTodayCount, mau: 'text-text-primary' },
  ]

  const dongChinhSach: { nhan: string; giaTri: string }[] = policy
    ? [
        { nhan: 'Tự động đóng', giaTri: policy.autoCloseEnabled ? 'Đang bật' : 'Đang tắt' },
        { nhan: 'Phòng chưa ai vào', giaTri: `sau ${fmtMinutes(policy.neverJoinedTtlMinutes)}` },
        { nhan: 'Phòng trống', giaTri: `sau ${fmtMinutes(policy.emptyRoomTtlMinutes)}` },
        { nhan: 'Thời lượng tối đa', giaTri: fmtMinutes(policy.maxRoomLifetimeMinutes) },
      ]
    : []

  return (
    <div className="space-y-8">
      {/* Số liệu phòng thật — bấm để xem danh sách đã lọc sẵn */}
      <div className="day-loc-deu gap-3 [--the-nho-nhat:9rem]">
        {chiSo.map((c) => (
          <button
            key={c.loc}
            type="button"
            onClick={() => onXemPhong(c.loc)}
            className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface px-3 py-4 text-center transition-colors outline-none hover:border-border-default hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring"
          >
            {loadingRooms ? (
              <Skeleton className="h-8 w-10" />
            ) : (
              <span className={cn('text-2xl font-semibold tabular-nums', c.mau)}>
                {roomsError ? '—' : (c.giaTri ?? 0)}
              </span>
            )}
            <span className="mt-1 text-xs text-text-tertiary">{c.nhan}</span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-7">
          <SectionHeader
            title="Phòng mới tạo gần đây"
            description="6 phòng gần nhất, mọi trạng thái."
            action={
              <Button variant="ghost" size="xs" onClick={() => void refetchRooms()} disabled={isFetching}>
                <RefreshCw className={cn(isFetching && 'animate-spin')} />
                Làm mới
              </Button>
            }
          />
          {loadingRooms ? (
            <KhungTai dong={4} />
          ) : roomsError ? (
            <KhungLoi thongBao="Không tải được danh sách phòng." onThuLai={() => void refetchRooms()} />
          ) : rooms.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle px-6 py-10 text-center">
              <DoorClosed className="size-6 text-text-tertiary" />
              <p className="mt-2 text-sm font-medium text-text-primary">Chưa có phòng học nào</p>
              <Button size="sm" className="mt-4" onClick={onTaoPhong}>
                <Plus />
                Tạo phòng đầu tiên
              </Button>
            </div>
          ) : (
            <>
              <DanhSachPhong rooms={rooms} />
              <Button variant="ghost" size="sm" className="text-text-secondary" onClick={() => onXemPhong('all')}>
                Xem tất cả phòng
                <ArrowRight />
              </Button>
            </>
          )}
        </section>

        <section className="space-y-3 lg:col-span-5">
          <SectionHeader
            title="Tự động đóng phòng"
            description="Áp dụng cho phòng tạo mới."
            action={
              <Button variant="ghost" size="xs" onClick={onXemChinhSach}>
                Chỉnh
                <ArrowRight />
              </Button>
            }
          />
          {loadingPolicy ? (
            <KhungTai dong={1} cao="h-48" />
          ) : policyError || !policy ? (
            <KhungLoi thongBao="Không tải được chính sách." onThuLai={() => void refetchPolicy()} />
          ) : (
            <dl className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
              {dongChinhSach.map((d) => (
                <div key={d.nhan} className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-sm text-text-secondary">{d.nhan}</dt>
                  <dd className="text-sm font-medium text-text-primary tabular-nums">{d.giaTri}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </div>
  )
}

// ─── Rooms Panel ─────────────────────────────────────────────────────────────

function RoomsPanel({ loc, onLoc }: { loc: LocPhong; onLoc: (loc: LocPhong) => void }) {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')

  // Tìm theo tên khi ngừng gõ, không cần nhấn Enter
  useEffect(() => {
    const henGio = setTimeout(() => {
      setQ(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(henGio)
  }, [searchInput])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-rooms', page, loc, q],
    queryFn: () => fetchAdminRooms({ page, limit: 20, status: loc, q }),
    staleTime: 15_000,
  })

  const rooms = data?.rooms ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-sm:day-loc-deu gap-2 [--the-nho-nhat:6.5rem] sm:flex sm:flex-wrap">
          {LOC_PHONG.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={loc === f.value}
              onClick={() => {
                onLoc(f.value)
                setPage(1)
              }}
              className={cn(
                'inline-flex h-8 items-center justify-center rounded-full border px-3.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                loc === f.value
                  ? 'border-brand/50 bg-brand/10 text-brand'
                  : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên phòng"
            aria-label="Tìm phòng theo tên"
            className="h-9 pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <KhungTai dong={4} />
      ) : isError ? (
        <KhungLoi thongBao="Không tải được danh sách phòng." onThuLai={() => void refetch()} />
      ) : rooms.length === 0 ? (
        <KhungTrong icon={DoorClosed} tieuDe="Không có phòng nào khớp bộ lọc" moTa={q ? `Từ khoá: “${q}”` : undefined} />
      ) : (
        <>
          <DanhSachPhong rooms={rooms} />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-tertiary tabular-nums">{data?.pagination.total ?? rooms.length} phòng</p>
            <PhanTrang trang={page} tongTrang={data?.pagination.totalPages ?? 1} onDoi={setPage} />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Policy Panel ─────────────────────────────────────────────────────────────

const TRUONG_CHINH_SACH: {
  key: 'neverJoinedTtlMinutes' | 'emptyRoomTtlMinutes' | 'maxRoomLifetimeMinutes'
  label: string
  desc: string
  min: number
  max: number
}[] = [
  {
    key: 'neverJoinedTtlMinutes',
    label: 'Phòng chưa ai vào',
    desc: 'Đóng nếu từ lúc tạo đến hết thời gian này vẫn chưa ai tham gia.',
    min: 1,
    max: 120,
  },
  {
    key: 'emptyRoomTtlMinutes',
    label: 'Phòng trống',
    desc: 'Đóng sau khoảng này kể từ khi người cuối cùng rời phòng.',
    min: 1,
    max: 1440,
  },
  {
    key: 'maxRoomLifetimeMinutes',
    label: 'Thời lượng tối đa',
    desc: 'Một phòng được mở lâu nhất bao lâu.',
    min: 15,
    max: 10080,
  },
]

function PolicyPanel() {
  const qc = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
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
        const body = (await res.json().catch(() => ({}))) as { error?: string; loi?: string }
        throw new Error(body.error || body.loi || 'Lưu chính sách thất bại.')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-room-policy'] })
      setForm({})
      toast.success('Đã lưu chính sách.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Lưu chính sách thất bại.'),
  })

  if (isLoading) return <KhungTai dong={4} cao="h-20" />
  if (isError || !policy) return <KhungLoi thongBao="Không tải được chính sách." onThuLai={() => void refetch()} />

  const current = { ...policy, ...form }
  const coThayDoi = Object.keys(form).length > 0

  const handleSave = () => {
    saveMut.mutate({
      autoCloseEnabled: current.autoCloseEnabled,
      neverJoinedTtlMinutes: current.neverJoinedTtlMinutes,
      emptyRoomTtlMinutes: current.emptyRoomTtlMinutes,
      maxRoomLifetimeMinutes: current.maxRoomLifetimeMinutes,
      expectedRevision: policy.revision,
    })
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="rounded-xl border border-border-subtle bg-surface px-4 py-3 text-xs leading-relaxed text-text-secondary">
        Thay đổi chỉ áp dụng cho phòng tạo sau khi lưu. Phòng đang mở giữ chính sách ở thời điểm được tạo.
      </p>

      <div className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary">Tự động đóng phòng</p>
            <p className="mt-0.5 text-xs text-text-tertiary">Bật các mốc thời gian bên dưới.</p>
          </div>
          <Switch
            checked={current.autoCloseEnabled}
            onCheckedChange={(bat) => setForm((f) => ({ ...f, autoCloseEnabled: bat }))}
            aria-label="Tự động đóng phòng"
          />
        </div>

        {TRUONG_CHINH_SACH.map((field) => {
          const val = current[field.key]
          return (
            <div key={field.key} className="space-y-3 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-text-primary">{field.label}</p>
                  <p className="mt-0.5 text-xs text-text-tertiary">{field.desc}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-brand tabular-nums">{fmtMinutes(val)}</span>
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                value={val}
                aria-label={field.label}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: parseInt(e.target.value, 10) }))}
                className="w-full accent-brand"
              />
            </div>
          )
        })}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-tertiary">
          Phiên bản #{policy.revision} · cập nhật {fmtRelative(policy.updatedAt)}
        </p>
        <div className="max-sm:day-loc-deu-co-gian gap-2 sm:flex">
          {coThayDoi && (
            <Button variant="ghost" onClick={() => setForm({})} disabled={saveMut.isPending}>
              Hoàn tác
            </Button>
          )}
          <Button onClick={handleSave} disabled={saveMut.isPending || !coThayDoi}>
            {saveMut.isPending && <Loader2 className="animate-spin" />}
            Lưu chính sách
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Accounts Panel ───────────────────────────────────────────────────────────

function NhanTaiKhoan({ tk }: { tk: AdminAccountItem }) {
  const [nhan, mau] = tk.isSchoolAdmin
    ? ['Quản trị', 'bg-brand/12 text-brand']
    : tk.teacherPending
      ? ['GV chờ duyệt', 'bg-warning/12 text-warning']
      : tk.role === 'teacher'
        ? ['Giáo viên', 'bg-social/12 text-social']
        : ['Học sinh', 'bg-surface-overlay text-text-secondary']
  return (
    <>
      <span className={cn('inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-medium', mau)}>
        {nhan}
      </span>
      {!tk.active && (
        <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-destructive/12 px-2 text-[11px] font-medium text-destructive">
          Đã khoá
        </span>
      )}
    </>
  )
}

const XAC_NHAN_THAO_TAC: Partial<Record<HanhDongTaiKhoan, { tieuDe: string; moTa: (ten: string) => string; nut: string }>> = {
  lock: {
    tieuDe: 'Khoá tài khoản này?',
    moTa: (ten) => `${ten} bị đăng xuất khỏi mọi thiết bị ngay và không đăng nhập được cho tới khi mở khoá.`,
    nut: 'Khoá tài khoản',
  },
  grant_teacher: {
    tieuDe: 'Cấp quyền giáo viên?',
    moTa: (ten) => `${ten} có quyền giáo viên ngay, không cần đăng nhập lại.`,
    nut: 'Cấp quyền',
  },
  reject_teacher: {
    tieuDe: 'Từ chối yêu cầu giáo viên?',
    moTa: (ten) => `${ten} vẫn dùng Campus được nhưng với vai trò học sinh.`,
    nut: 'Từ chối',
  },
}

function AccountsPanel({ loc, onLoc, myId }: { loc: LocTaiKhoan; onLoc: (loc: LocTaiKhoan) => void; myId: number }) {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [q, setQ] = useState('')
  const [canXacNhan, setCanXacNhan] = useState<{ tk: AdminAccountItem; action: HanhDongTaiKhoan } | null>(null)
  const thaoTac = useThaoTacTaiKhoan()

  useEffect(() => {
    const henGio = setTimeout(() => {
      setQ(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(henGio)
  }, [searchInput])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-accounts', page, loc, q],
    queryFn: () => fetchAdminAccounts({ page, limit: 20, filter: loc, q }),
    staleTime: 15_000,
  })
  const accounts = data?.accounts ?? []

  const chay = (tk: AdminAccountItem, action: HanhDongTaiKhoan) => {
    if (XAC_NHAN_THAO_TAC[action]) setCanXacNhan({ tk, action })
    else thaoTac.mutate({ id: tk.id, action })
  }
  const xacNhan = canXacNhan ? XAC_NHAN_THAO_TAC[canXacNhan.action] : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-sm:day-loc-deu gap-2 [--the-nho-nhat:6.5rem] sm:flex sm:flex-wrap">
          {LOC_TAI_KHOAN_UI.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={loc === f.value}
              onClick={() => {
                onLoc(f.value)
                setPage(1)
              }}
              className={cn(
                'inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                loc === f.value
                  ? 'border-brand/50 bg-brand/10 text-brand'
                  : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
              )}
            >
              {f.label}
              {f.value === 'pending_teacher' && (data?.counts.pendingTeacher ?? 0) > 0 && (
                <span className="rounded-full bg-warning px-1.5 text-[10px] font-semibold text-background tabular-nums">
                  {data?.counts.pendingTeacher}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm tên hoặc tên đăng nhập"
            aria-label="Tìm tài khoản"
            maxLength={64}
            className="h-9 pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <KhungTai dong={5} cao="h-14" />
      ) : isError ? (
        <KhungLoi thongBao="Không tải được danh sách tài khoản." onThuLai={() => void refetch()} />
      ) : accounts.length === 0 ? (
        <KhungTrong
          icon={Users}
          tieuDe={loc === 'pending_teacher' && !q ? 'Không có giáo viên nào đang chờ duyệt' : 'Không có tài khoản nào khớp bộ lọc'}
          moTa={q ? `Từ khoá: “${q}”` : undefined}
        />
      ) : (
        <>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface">
            {accounts.map((tk) => {
              const dangXuLy = thaoTac.isPending && thaoTac.variables?.id === tk.id
              const coTheKhoa = !tk.isSchoolAdmin && tk.active && tk.id !== myId
              return (
                <li key={tk.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="min-w-0 text-sm font-medium break-words text-text-primary">{tk.displayName}</span>
                      <NhanTaiKhoan tk={tk} />
                    </p>
                    <p className="mt-1 text-xs break-words text-text-tertiary">
                      @{tk.username}
                      {tk.lopTen ? ` · Lớp ${tk.lopTen}` : ''}
                      {tk.googleEmail ? ` · ${tk.googleEmail}` : ''}
                      {tk.createdAt ? ` · tạo ${fmtRelative(tk.createdAt)}` : ''}
                    </p>
                  </div>

                  {!tk.isSchoolAdmin && (
                    <div className="max-sm:day-loc-deu-co-gian shrink-0 gap-2 sm:flex">
                      {tk.teacherPending && tk.active && (
                        <>
                          <Button size="xs" disabled={dangXuLy} onClick={() => chay(tk, 'approve_teacher')}>
                            {dangXuLy ? <Loader2 className="animate-spin" /> : <UserCheck />}
                            Duyệt
                          </Button>
                          <Button size="xs" variant="outline" disabled={dangXuLy} onClick={() => chay(tk, 'reject_teacher')}>
                            Từ chối
                          </Button>
                        </>
                      )}
                      {tk.role === 'student' && tk.active && (
                        <Button size="xs" variant="outline" disabled={dangXuLy} onClick={() => chay(tk, 'grant_teacher')}>
                          Cấp quyền giáo viên
                        </Button>
                      )}
                      {coTheKhoa && (
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={dangXuLy}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => chay(tk, 'lock')}
                        >
                          Khoá
                        </Button>
                      )}
                      {!tk.active && (
                        <Button size="xs" variant="outline" disabled={dangXuLy} onClick={() => chay(tk, 'unlock')}>
                          {dangXuLy && <Loader2 className="animate-spin" />}
                          Mở khoá
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-tertiary tabular-nums">{data?.pagination.total ?? accounts.length} tài khoản</p>
            <PhanTrang trang={page} tongTrang={data?.pagination.totalPages ?? 1} onDoi={setPage} />
          </div>
        </>
      )}

      <AlertDialog
        open={canXacNhan !== null}
        onOpenChange={(mo) => {
          if (!mo && !thaoTac.isPending) setCanXacNhan(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{xacNhan?.tieuDe}</AlertDialogTitle>
            <AlertDialogDescription>{canXacNhan && xacNhan?.moTa(canXacNhan.tk.displayName)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={thaoTac.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              variant={canXacNhan?.action === 'grant_teacher' ? 'default' : 'destructive'}
              disabled={thaoTac.isPending}
              onClick={() => {
                if (canXacNhan) {
                  thaoTac.mutate(
                    { id: canXacNhan.tk.id, action: canXacNhan.action },
                    { onSettled: () => setCanXacNhan(null) },
                  )
                }
              }}
            >
              {thaoTac.isPending && <Loader2 className="animate-spin" />}
              {xacNhan?.nut}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Audit Panel ──────────────────────────────────────────────────────────────

function AuditPanel() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: () => fetchAuditLogs(page),
    staleTime: 30_000,
  })

  const logs = data?.logs ?? []
  const tongTrang = Math.max(1, Math.ceil((data?.total ?? 0) / SO_NHAT_KY_MOI_TRANG))

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Nhật ký kiểm duyệt"
        description="Đóng phòng, mời ra, cấm vào, duyệt/khoá tài khoản và thay đổi chính sách — mới nhất ở trên."
        action={
          <Button variant="ghost" size="xs" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={cn(isFetching && 'animate-spin')} />
            Làm mới
          </Button>
        }
      />

      {isLoading ? (
        <KhungTai dong={5} cao="h-14" />
      ) : isError ? (
        <KhungLoi thongBao="Không tải được nhật ký." onThuLai={() => void refetch()} />
      ) : logs.length === 0 ? (
        <KhungTrong icon={ClipboardList} tieuDe="Chưa có nhật ký nào" />
      ) : (
        <>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-2xl border border-border-subtle bg-surface">
            {logs.map((log) => {
              const lyDo = log.reason ? (LY_DO[log.reason] ?? log.reason) : null
              return (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-overlay text-text-tertiary">
                    <ShieldAlert className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-words text-text-primary">
                      {TEN_HANH_DONG[log.action] ?? log.action}
                      {log.targetName ? <span className="font-normal text-text-secondary"> · {log.targetName}</span> : null}
                    </p>
                    <p className="mt-0.5 text-xs break-words text-text-tertiary">
                      {log.actorName ?? 'Hệ thống'}
                      {log.roomId ? ` · ${log.roomTitle ? `“${log.roomTitle}”` : 'Phòng'} #${log.roomId}` : ''}
                      {lyDo ? ` · ${lyDo}` : ''}
                      {' · '}
                      <time dateTime={new Date(log.createdAt).toISOString()} className="tabular-nums">
                        {fmtThoiDiem(log.createdAt)}
                      </time>
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-tertiary tabular-nums">{data?.total ?? logs.length} bản ghi</p>
            <PhanTrang trang={page} tongTrang={tongTrang} onDoi={setPage} />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminControlPlanePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { nguoiDung } = usePhien()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [locPhong, setLocPhong] = useState<LocPhong>('all')
  const [locTaiKhoan, setLocTaiKhoan] = useState<LocTaiKhoan>('all')
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const laQuanTri = Boolean(nguoiDung?.isSchoolAdmin)

  // Số giáo viên chờ duyệt cho huy hiệu ở tab — việc cần quản trị viên xử lý nhất.
  const { data: demTaiKhoan } = useQuery({
    queryKey: ['admin-account-counts'],
    queryFn: () => fetchAdminAccounts({ page: 1, limit: 1, filter: 'pending_teacher', q: '' }),
    staleTime: 30_000,
    enabled: laQuanTri,
  })
  const soChoDuyet = demTaiKhoan?.counts.pendingTeacher ?? 0

  if (!nguoiDung) return null
  if (!nguoiDung.isSchoolAdmin) {
    return (
      <div className="flex min-h-[50svh] flex-col items-center justify-center text-center">
        <ShieldAlert className="size-7 text-text-tertiary" />
        <p className="mt-3 text-sm font-medium text-text-primary">Trang này dành cho quản trị viên trường</p>
        <p className="mt-1 text-xs text-text-tertiary">Tài khoản của bạn chưa có quyền quản trị.</p>
      </div>
    )
  }

  const xemPhong = (loc: LocPhong) => {
    setLocPhong(loc)
    setTab('rooms')
  }

  const xemGiaoVienChoDuyet = () => {
    setLocTaiKhoan('pending_teacher')
    setTab('accounts')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản trị trường"
        description="Phòng học, tài khoản, chính sách tự đóng và nhật ký kiểm duyệt của toàn trường."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/admin/analytics')}>
              <BarChart3 />
              Báo cáo
            </Button>
            <Button onClick={() => setCreateRoomOpen(true)}>
              <Plus />
              Tạo phòng
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as AdminTab)} className="gap-6">
        <TabsList className="[--the-nho-nhat:7rem]">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="rooms">Phòng học</TabsTrigger>
          <TabsTrigger value="accounts">
            Tài khoản
            {soChoDuyet > 0 && (
              <span
                className="rounded-full bg-warning px-1.5 text-[10px] font-semibold text-background tabular-nums"
                aria-label={`${soChoDuyet} giáo viên chờ duyệt`}
              >
                {soChoDuyet}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="policy">Tự động đóng</TabsTrigger>
          <TabsTrigger value="audit">Nhật ký</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {soChoDuyet > 0 && (
            <button
              type="button"
              onClick={xemGiaoVienChoDuyet}
              className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-warning/30 bg-warning-muted/40 px-4 py-3 text-left transition-colors outline-none hover:bg-warning-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UserCheck className="size-5 shrink-0 text-warning" />
              <span className="min-w-0 flex-1 text-sm text-text-primary">
                <span className="font-semibold tabular-nums">{soChoDuyet}</span> giáo viên đang chờ duyệt tài khoản
              </span>
              <ArrowRight className="size-4 shrink-0 text-text-tertiary" />
            </button>
          )}
          <OverviewPanel
            onXemPhong={xemPhong}
            onXemChinhSach={() => setTab('policy')}
            onTaoPhong={() => setCreateRoomOpen(true)}
          />
        </TabsContent>
        <TabsContent value="rooms">
          <RoomsPanel loc={locPhong} onLoc={setLocPhong} />
        </TabsContent>
        <TabsContent value="accounts">
          <AccountsPanel loc={locTaiKhoan} onLoc={setLocTaiKhoan} myId={nguoiDung.accountId} />
        </TabsContent>
        <TabsContent value="policy">
          <PolicyPanel />
        </TabsContent>
        <TabsContent value="audit">
          <AuditPanel />
        </TabsContent>
      </Tabs>

      {/* Create Study Room Dialog */}
      <CreateStudyRoomDialog
        open={createRoomOpen}
        onOpenChange={setCreateRoomOpen}
        onSuccess={(roomId) => {
          setCreateRoomOpen(false)
          qc.invalidateQueries({ queryKey: ['admin-rooms-overview'] })
          qc.invalidateQueries({ queryKey: ['admin-rooms'] })
          toast.success('Đã tạo phòng.', {
            action: { label: 'Vào phòng', onClick: () => navigate(`/room/phong-${roomId}`) },
          })
        }}
      />
    </div>
  )
}
