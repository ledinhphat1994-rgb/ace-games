import { CampusHero } from '@/components/layout/CampusHero'
import { JoinRoomModal } from './components/learning/JoinRoomModal'
import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { KhungTrongSanh, SanhHoatDong } from '@/components/lobby/SanhHoatDong'
import { RoomCard } from './RoomCard'
import { ThongKeHocTap } from './ThongKeHocTap'
import { GameArenaLeaderboard } from '@/features/games/GameArenaLeaderboard'
import { GameSocialSidebar } from '@/features/games/GameSocialSidebar'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap, chonPhongVaoNhanh, sortDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import { LogIn, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  LEARNING_OCCUPANCY_METRIC_CONFIG,
  deriveLobbyState,
  filterLobbyRooms,
} from './learning-semantics'

export { LEARNING_OCCUPANCY_METRIC_CONFIG }

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
  const [moVaoBangMa, setMoVaoBangMa] = useState(false)

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

  const laAdminToanQuyen = Boolean(
    nguoiDung && (nguoiDung.isSchoolAdmin || nguoiDung.role === 'admin' || nguoiDung.username === 'ledinhphat'),
  )
  void laAdminToanQuyen

  return (
    <>
      <SanhHoatDong
        testId="learning"
        tieuDe="Học tập"
        hero={<CampusHero eyebrow="Digital Campus" title="Học tập" description="Cùng nhau học tốt hơn mỗi ngày." art="/assets/learning/learning_hero.webp" />}
        vaoBangMa={{ nhan: 'Vào bằng mã', onClick: canDangNhap(() => setMoVaoBangMa(true)), testId: 'join-by-code-btn' }}
        thongKe={<ThongKeHocTap rooms={rooms} sanSang={lobbyState.status === 'ready'} />}
        choiNgay={rooms.length > 0 ? { nhan: 'Học ngay', onClick: canDangNhap(vaoPhongNhanh), testId: 'quick-join-btn' } : undefined}
        taoPhong={{ nhan: 'Tạo phòng', onClick: canDangNhap(() => setMoTaoPhong(true)), testId: 'create-room-btn' }}
        timKiem={nguoiDung ? { giaTri: tuKhoa, onDoi: datTuKhoa, goiY: 'Tìm phòng…' } : undefined}
        danhSach={{
          tieuDe: 'Phòng đang mở',
          soLuong: nguoiDung ? danhSachPhongLoc.length : undefined,
          trangThai:
            lobbyState.status === 'loading' ? 'dang_tai' : lobbyState.status === 'reconnecting' ? 'dang_ket_noi_lai' : 'san_sang',
          onKetNoiLai: ketNoiLai,
          rong: danhSachPhongLoc.length === 0,
          noiDungRong: !nguoiDung ? (
            <KhungTrongSanh
              testId="learning-empty-rooms"
              hinh={<HinhPhongTrong />}
              hoatHinh
              tieuDe="Đăng nhập để xem phòng đang mở"
              nut={{ nhan: 'Đăng nhập', icon: <LogIn />, onClick: () => moAuthModal('dang_nhap') }}
            />
          ) : tuKhoa.trim() ? (
            <KhungTrongSanh
              testId="learning-search-empty"
              hinh={<Search className="size-6 text-text-tertiary" />}
              tieuDe="Không tìm thấy phòng"
              nut={{ nhan: 'Xóa tìm kiếm', onClick: () => datTuKhoa(''), phu: true }}
            />
          ) : (
            <KhungTrongSanh
              testId="learning-empty-rooms"
              hinh={<HinhPhongTrong />}
              hoatHinh
              tieuDe="Chưa có phòng nào đang mở"
              nut={{ nhan: 'Tạo phòng học', icon: <Plus className="size-4" />, onClick: canDangNhap(() => setMoTaoPhong(true)) }}
            />
          ),
          children: danhSachPhongLoc.map((room) => (
            <RoomCard key={room.id} room={room} friends={roomFriendsMap.get(room.id)} onVaoPhong={xuLyVaoPhong} />
          )),
        }}
        cotTrai={<GameArenaLeaderboard defaultGame="hoc_tap" />}
        cotPhai={<GameSocialSidebar coChatPhong={false} />}
      />

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

      <JoinRoomModal open={moVaoBangMa} onOpenChange={setMoVaoBangMa} onJoinRoomId={id => navigate(`/room/phong-${id}`)} />
      <CreateStudyRoomDialog
        open={moTaoPhong}
        onOpenChange={setMoTaoPhong}
        onSuccess={(roomId) => {
          setMoTaoPhong(false)
          navigate(`/room/phong-${roomId}`)
        }}
      />
    </>
  )
}

/** Minh hoạ nét mảnh cho sảnh trống: màn trình chiếu chung và nhóm bạn cùng xem. */
function HinhPhongTrong() {
  return (
    <svg viewBox="0 0 200 120" className="h-[108px] w-[180px]" aria-hidden>
      <rect x="46" y="14" width="108" height="70" rx="12" fill="#0f172a" />
      <rect x="55" y="23" width="90" height="44" rx="6" fill="#131e30" />
      <path d="M95 37.5 L108 45 L95 52.5 Z" fill="#c6a15a" />
      <rect x="55" y="74" width="90" height="3" rx="1.5" fill="#1e293b" />
      <rect x="55" y="74" width="38" height="3" rx="1.5" fill="#c6a15a" />
      {[
        { cx: 78, mau: '#a78bfa' },
        { cx: 100, mau: '#c6a15a' },
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
