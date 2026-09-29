import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { SanhHoatDong } from '@/components/lobby/SanhHoatDong'
import { RoomCard } from './RoomCard'
import { GameArenaLeaderboard } from '@/features/games/GameArenaLeaderboard'
import { GameSocialSidebar } from '@/features/games/GameSocialSidebar'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { JoinRoomModal } from './components/learning/JoinRoomModal'
import { buildRoomFriendsMap, chonPhongVaoNhanh, sortDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import { LogIn, MonitorPlay, PenLine, Plus, Presentation, Search } from 'lucide-react'
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

  // Vào bằng ID / link phòng: phòng có trong sảnh thì đi qua cùng kiểm tra (đầy / mật khẩu).
  const vaoTheoId = (id: number) => {
    const phong = rooms.find((r) => r.id === id)
    if (phong) xuLyVaoPhong(phong)
    else navigate(`/room/phong-${id}`)
  }

  const canDangNhap = (viec: () => void) => () => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    viec()
  }

  // Học ngay: không cần chọn — tự vào phòng tốt nhất còn chỗ, không mật khẩu (xét mọi phòng, không theo ô tìm kiếm).
  const vaoPhongNhanh = () => {
    const phong = chonPhongVaoNhanh(rooms, roomFriendsMap)
    if (!phong) {
      toast.info('Các phòng đang mở đều đã đầy hoặc cần mật khẩu.')
      return
    }
    navigate(`/room/phong-${phong.id}`)
  }

  return (
    <>
      <SanhHoatDong
        testId="learning"
        tieuDe="Học tập"
        chiSo={
          nguoiDung && lobbyState.status === 'ready'
            ? [
                { nhan: 'Phòng đang mở', giaTri: rooms.length },
                { nhan: 'Đang học', giaTri: rooms.reduce((tong, r) => tong + r.soNguoi, 0), mau: 'text-emerald-400' },
              ]
            : undefined
        }
        choiNgay={{ nhan: 'Học ngay', onClick: canDangNhap(vaoPhongNhanh), testId: 'quick-join-btn' }}
        taoPhong={{ nhan: 'Tạo phòng', onClick: canDangNhap(() => setMoTaoPhong(true)), testId: 'create-room-btn' }}
        vaoPhong={{ nhan: 'Vào phòng', onClick: canDangNhap(() => setMoVaoPhong(true)), testId: 'join-room-btn' }}
        timKiem={nguoiDung ? { giaTri: tuKhoa, onDoi: datTuKhoa, goiY: 'Tìm phòng, chủ phòng, môn học…' } : undefined}
        danhSach={{
          tieuDe: 'Phòng đang mở',
          soLuong: nguoiDung ? danhSachPhongLoc.length : undefined,
          trangThai:
            lobbyState.status === 'loading' ? 'dang_tai' : lobbyState.status === 'reconnecting' ? 'dang_ket_noi_lai' : 'san_sang',
          onKetNoiLai: ketNoiLai,
          rong: danhSachPhongLoc.length === 0,
          noiDungRong: tuKhoa.trim() ? (
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
          ),
          children: (
            <div data-testid="learning-active-rooms-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1800px]:grid-cols-3">
              {danhSachPhongLoc.map((room) => (
                <RoomCard key={room.id} room={room} friends={roomFriendsMap.get(room.id)} onVaoPhong={xuLyVaoPhong} />
              ))}
            </div>
          ),
        }}
        cotTrai={<GameArenaLeaderboard defaultGame="hoc_tap" />}
        cotPhai={<GameSocialSidebar coChatPhong={false} />}
      />

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

      <JoinRoomModal open={moVaoPhong} onOpenChange={setMoVaoPhong} onJoinRoomId={vaoTheoId} />
    </>
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
