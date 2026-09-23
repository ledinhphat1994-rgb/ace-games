import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { JoinRoomModal } from './components/learning/JoinRoomModal'
import { buildRoomFriendsMap } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  AlertCircle,
  BookOpen,
  LogIn,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { LEARNING_OCCUPANCY_METRIC_CONFIG } from './learning-semantics'

export { LEARNING_OCCUPANCY_METRIC_CONFIG }

export function LearningPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''

  const { rooms, socialState, presenceMap, trangThai, ketNoiLai } = useCampus()

  const [tuKhoa, setTuKhoa] = useState(urlQuery)
  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)
  const [moVaoBangMa, setMoVaoBangMa] = useState(false)

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () => buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers),
    [rooms, friends, presenceMap, blockedUsers],
  )

  // Filter rooms by search query (room name or host name)
  const danhSachPhongLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase()
    if (!q) return rooms
    return rooms.filter((room) => {
      const matchName = room.ten.toLowerCase().includes(q)
      const matchHost = room.chuPhongTen.toLowerCase().includes(q)
      const matchSubject = (room.monHoc || '').toLowerCase().includes(q)
      return matchName || matchHost || matchSubject
    })
  }, [rooms, tuKhoa])

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

  const isDisconnected = trangThai === 'mat_ket_noi'

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* ── 1. Clean Learning Header ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Học tập</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Không gian phòng học và làm việc trực tuyến
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setMoTaoPhong(true)}
            data-testid="create-room-btn"
            className="h-9 px-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md shadow-cyan-500/15"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo phòng</span>
          </Button>

          <Button
            onClick={() => setMoVaoBangMa(true)}
            variant="outline"
            data-testid="join-by-code-btn"
            className="h-9 px-3.5 border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-xs gap-1.5"
          >
            <LogIn className="h-4 w-4 text-cyan-400" />
            <span>Vào bằng mã</span>
          </Button>
        </div>
      </div>

      {/* ── 2. Disconnected Truthful State Banner ──────────── */}
      {isDisconnected && (
        <div
          data-testid="learning-disconnected-banner"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Mất kết nối sảnh học tập. Đang tự động kết nối lại...</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={ketNoiLai}
            className="h-7 text-xs border-amber-500/30 text-amber-100 hover:bg-amber-500/20"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Thử lại
          </Button>
        </div>
      )}

      {/* ── 3. Contextual Search (In-lobby) ────────────────── */}
      {rooms.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={tuKhoa}
            onChange={(e) => {
              setTuKhoa(e.target.value)
              if (e.target.value) {
                setSearchParams({ q: e.target.value }, { replace: true })
              } else {
                setSearchParams({}, { replace: true })
              }
            }}
            placeholder="Tìm theo tên phòng hoặc chủ phòng..."
            data-testid="learning-search-input"
            className="h-9 pl-9 pr-3 text-xs border-white/10 bg-white/5 placeholder:text-slate-500 focus-visible:ring-cyan-500/40"
          />
        </div>
      )}

      {/* ── 4. Active Rooms Section ────────────────────────── */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
            Đang hoạt động {rooms.length > 0 ? `(${danhSachPhongLoc.length})` : ''}
          </h2>
        </div>

        {danhSachPhongLoc.length > 0 ? (
          <div
            data-testid="learning-active-rooms-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
            className="rounded-2xl border border-white/10 bg-[#0c1222] p-8 text-center space-y-2"
          >
            <p className="text-sm font-semibold text-white">Không tìm thấy phòng học</p>
            <p className="text-xs text-slate-400">
              Không có phòng học nào khớp với từ khóa "{tuKhoa.trim()}".
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTuKhoa('')
                setSearchParams({}, { replace: true })
              }}
              className="mt-2 text-xs border-white/15 text-slate-300"
            >
              Xóa tìm kiếm
            </Button>
          </div>
        ) : (
          <div
            data-testid="learning-empty-rooms"
            className="rounded-2xl border border-white/10 bg-[#0c1222] p-8 text-center space-y-3"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Chưa có phòng học nào đang mở</p>
              <p className="text-xs text-slate-400 mt-1">
                Hãy là người đầu tiên tạo phòng học để bắt đầu cùng bạn bè.
              </p>
            </div>
            <Button
              onClick={() => setMoTaoPhong(true)}
              data-testid="empty-create-room-btn"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs h-8 px-3.5"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Tạo phòng học đầu tiên
            </Button>
          </div>
        )}
      </div>

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
        open={moVaoBangMa}
        onOpenChange={setMoVaoBangMa}
        onJoinRoomId={handleJoinById}
      />
    </div>
  )
}
