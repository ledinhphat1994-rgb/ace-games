import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PageHeader, SectionHeader } from '@/components/layout/PageHeader'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { JoinRoomModal } from './components/learning/JoinRoomModal'
import { buildRoomFriendsMap, sortDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import { LogIn, MonitorPlay, PenLine, Plus, Presentation, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  LEARNING_OCCUPANCY_METRIC_CONFIG,
  deriveLobbyState,
  filterLobbyRooms,
} from './learning-semantics'

export { LEARNING_OCCUPANCY_METRIC_CONFIG }

// Ba công cụ có thật trong mọi phòng học (ClassroomToolDock) — giới thiệu ngắn khi sảnh còn trống.
const CONG_CU_PHONG = [
  { icon: MonitorPlay, ten: 'Cùng xem video' },
  { icon: Presentation, ten: 'Trình chiếu tài liệu' },
  { icon: PenLine, ten: 'Bảng trắng' },
] as const

export function LearningPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  // Khách chưa đăng nhập không nhận danh sách phòng từ sảnh: không được nói "chưa có phòng" hay hiện số 0.
  const { nguoiDung, moAuthModal } = usePhien()

  const {
    rooms,
    socialState,
    presenceMap,
    presenceReady,
    trangThai,
    ketNoiLai,
    campusSnapshotReady,
  } = useCampus()

  const [tuKhoa, setTuKhoa] = useState(urlQuery)
  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)
  const [moVaoPhong, setMoVaoPhong] = useState(false)

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () =>
      buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers, {
        presenceReady,
        connectionStatus: trangThai,
      }),
    [rooms, friends, presenceMap, blockedUsers, presenceReady, trangThai],
  )

  // Authoritative Lobby Readiness State: 'loading' | 'reconnecting' | 'ready'
  const lobbyState = useMemo(
    () => deriveLobbyState({ trangThai, campusSnapshotReady, rooms }),
    [trangThai, campusSnapshotReady, rooms],
  )

  // Lọc theo từ khoá (tên phòng, chủ phòng, môn học) rồi xếp phòng có bạn bè / đông người lên trước.
  const danhSachPhongLoc = useMemo(
    () => sortDiscoveryRooms(filterLobbyRooms(rooms, tuKhoa), roomFriendsMap),
    [rooms, tuKhoa, roomFriendsMap],
  )

  const datTuKhoa = (giaTri: string) => {
    setTuKhoa(giaTri)
    setSearchParams(giaTri ? { q: giaTri } : {}, { replace: true })
  }

  const xuLyVaoPhong = (room: PhongSanh) => {
    if (room.soNguoi >= room.sucChua) {
      toast.error('Phòng học đã đầy số lượng người tham gia!')
      return
    }
    if (room.coMatKhau) {
      setPhongCanMatKhau(room)
      return
    }
    navigate(`/room/phong-${room.id}`)
  }

  const handleJoinById = (targetRoomId: number) => {
    const existing = rooms.find((r) => r.id === targetRoomId)
    if (existing) {
      xuLyVaoPhong(existing)
    } else {
      navigate(`/room/phong-${targetRoomId}`)
    }
  }

  const hienTimKiem = lobbyState.status === 'ready' && rooms.length > 0

  return (
    <div className="space-y-8">
      <PageHeader title="Học tập" />

      <section className="space-y-4" aria-labelledby="learning-rooms-heading">
        <div className="flex min-h-9 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader
            id="learning-rooms-heading"
            title="Phòng đang mở"
            count={lobbyState.status === 'ready' && nguoiDung ? danhSachPhongLoc.length : undefined}
            action={
              danhSachPhongLoc.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setMoTaoPhong(true)} data-testid="create-room-btn">
                    <Plus />
                    <span>Tạo phòng</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMoVaoPhong(true)}
                    data-testid="join-room-btn"
                    data-test-compat="join-by-code-btn"
                  >
                    <LogIn className="text-brand" />
                    <span>Vào phòng</span>
                  </Button>
                </div>
              ) : undefined
            }
          />

          {hienTimKiem && (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                value={tuKhoa}
                onChange={(e) => datTuKhoa(e.target.value)}
                placeholder="Tìm phòng, chủ phòng, môn học…"
                aria-label="Tìm phòng học"
                data-testid="learning-search-input"
                className="h-9 pr-9 pl-9"
              />
              {tuKhoa && (
                <button
                  type="button"
                  onClick={() => datTuKhoa('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-overlay hover:text-text-primary"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {lobbyState.status === 'loading' && (
          <div
            data-testid="learning-lobby-loading"
            aria-busy="true"
            aria-label="Đang tải danh sách phòng học"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border-subtle bg-surface p-5">
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-surface-overlay" />
                <div className="mt-2.5 h-3 w-1/3 animate-pulse rounded-md bg-surface-overlay/70" />
                <div className="mt-8 flex items-end justify-between gap-4">
                  <div className="h-1 flex-1 animate-pulse rounded-full bg-surface-overlay/70" />
                  <div className="h-8 w-24 animate-pulse rounded-xl bg-surface-overlay" />
                </div>
              </div>
            ))}
          </div>
        )}

        {lobbyState.status === 'reconnecting' && (
          <div
            data-testid="learning-lobby-reconnecting"
            className="flex flex-col gap-4 rounded-2xl border border-warning/25 bg-warning-muted/60 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <RefreshCw className="mt-0.5 size-4 shrink-0 animate-spin text-warning" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Đang kết nối lại sảnh học tập…</p>
                <p className="mt-0.5 text-[0.8125rem] text-text-secondary">
                  Danh sách phòng sẽ cập nhật ngay khi kết nối được khôi phục.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={ketNoiLai} className="shrink-0">
              Thử lại ngay
            </Button>
          </div>
        )}

        {lobbyState.status === 'ready' &&
          (danhSachPhongLoc.length > 0 ? (
            <div
              data-testid="learning-active-rooms-grid"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {danhSachPhongLoc.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  friends={roomFriendsMap.get(room.id)}
                  onVaoPhong={xuLyVaoPhong}
                />
              ))}
            </div>
          ) : tuKhoa.trim() ? (
            <div
              data-testid="learning-search-empty"
              className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface px-6 py-10 text-center"
            >
              <Search className="size-5 text-text-tertiary" />
              <p className="mt-3 text-sm font-semibold text-text-primary">Không tìm thấy phòng học</p>
              <p className="mt-1 text-[0.8125rem] text-text-secondary">
                Không có phòng nào khớp với “{tuKhoa.trim()}”.
              </p>
              <Button variant="outline" size="sm" onClick={() => datTuKhoa('')} className="mt-4">
                Xóa tìm kiếm
              </Button>
            </div>
          ) : (
            <div data-testid="learning-empty-rooms" className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
              <div className="flex flex-col items-center px-6 pt-10 pb-8 text-center sm:pt-12">
                <HinhPhongTrong />
                {nguoiDung ? (
                  <>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-text-primary">Chưa có phòng nào đang mở</h3>
                    <Button onClick={() => setMoTaoPhong(true)} data-testid="empty-create-room-btn" className="mt-6">
                      <Plus />
                      Tạo phòng đầu tiên
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight text-text-primary">Đăng nhập để xem phòng đang mở</h3>
                    <Button onClick={() => moAuthModal('dang_nhap')} data-testid="empty-login-btn" className="mt-6">
                      <LogIn />
                      Đăng nhập
                    </Button>
                  </>
                )}
              </div>
              <ul className="day-loc-deu gap-px! border-t border-border-subtle bg-border-subtle [--the-nho-nhat:13rem]">
                {CONG_CU_PHONG.map(({ icon: Icon, ten }) => (
                  <li key={ten} className="flex items-center justify-center gap-2.5 bg-surface px-5 py-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="text-[0.8125rem] font-semibold text-text-primary">{ten}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </section>

      {/* ── Dialogs ────────────────────────────────────────── */}
      {phongCanMatKhau && (
        <PasswordRoomDialog
          room={phongCanMatKhau}
          onSuccess={(roomId) => {
            setPhongCanMatKhau(null)
            navigate(`/room/phong-${roomId}`)
          }}
          onClose={() => setPhongCanMatKhau(null)}
        />
      )}

      <CreateStudyRoomDialog
        open={moTaoPhong}
        onOpenChange={setMoTaoPhong}
        onSuccess={(roomId) => {
          setMoTaoPhong(false)
          navigate(`/room/phong-${roomId}`)
        }}
      />

      <JoinRoomModal
        open={moVaoPhong}
        onOpenChange={setMoVaoPhong}
        onJoinRoomId={handleJoinById}
      />
    </div>
  )
}

/** Minh hoạ nét mảnh cho sảnh trống: màn trình chiếu chung và nhóm bạn cùng xem. */
function HinhPhongTrong() {
  return (
    <svg viewBox="0 0 200 120" className="h-[108px] w-[180px]" aria-hidden>
      <defs>
        <radialGradient id="phong-trong-hao-quang" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="56" rx="96" ry="56" fill="url(#phong-trong-hao-quang)" />
      <rect x="46" y="14" width="108" height="70" rx="12" fill="#0f172a" stroke="rgba(255,255,255,0.12)" />
      <rect x="55" y="23" width="90" height="44" rx="6" fill="#131e30" />
      <path d="M95 37.5 L108 45 L95 52.5 Z" fill="#22d3ee" />
      <rect x="55" y="74" width="90" height="3" rx="1.5" fill="#1e293b" />
      <rect x="55" y="74" width="38" height="3" rx="1.5" fill="#22d3ee" />
      {[
        { cx: 78, mau: '#a78bfa' },
        { cx: 100, mau: '#22d3ee' },
        { cx: 122, mau: '#34d399' },
      ].map(({ cx, mau }) => (
        <g key={cx}>
          <circle cx={cx} cy="101" r="11" fill="#1a2640" stroke="#0d1525" strokeWidth="3" />
          <circle cx={cx} cy="98" r="3.6" fill={mau} fillOpacity="0.9" />
          <path d={`M${cx - 6} 107.5 a6 5 0 0 1 12 0`} fill={mau} fillOpacity="0.9" />
        </g>
      ))}
      <circle cx="131" cy="93" r="3.4" fill="#10b981" stroke="#0d1525" strokeWidth="2" />
    </svg>
  )
}
