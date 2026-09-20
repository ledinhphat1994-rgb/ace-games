import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RoomCard } from './RoomCard'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { buildRoomFriendsMap, filterDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  BookOpen,
  Plus,
  Radio,
  Search,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

export function LearningPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const { nguoiDung } = usePhien()
  const { rooms, socialState, presenceMap } = useCampus()

  // Discovery filter state
  const [tabPhamVi, setTabPhamVi] = useState<'tat_ca' | 'truong' | 'lop'>('tat_ca')
  const [tuKhoa, setTuKhoa] = useState(initialQuery)
  const [chiHienCoBanBe, setChiHienCoBanBe] = useState(false)
  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)

  // Friends & presence projection
  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () => buildRoomFriendsMap(rooms, friends, presenceMap, blockedUsers),
    [rooms, friends, presenceMap, blockedUsers],
  )

  const soPhongCoBanBe = useMemo(() => {
    let dem = 0
    for (const ds of roomFriendsMap.values()) {
      if (ds.length > 0) dem++
    }
    return dem
  }, [roomFriendsMap])

  const danhSachPhongLoc = useMemo(() => {
    return filterDiscoveryRooms(rooms, roomFriendsMap, {
      tabPhamVi,
      tuKhoa,
      chiHienCoBanBe,
      userLopId: nguoiDung.lopId,
    })
  }, [rooms, roomFriendsMap, tabPhamVi, tuKhoa, chiHienCoBanBe, nguoiDung.lopId])

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

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>Học tập & Nghiên cứu</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Không gian học nhóm trực tuyến, video bài giảng đồng bộ và thảo luận bài học
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate(`/room/phong-${Date.now().toString(36)}`)}
          className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo phòng học mới</span>
        </Button>
      </div>

      {/* 2. Unified Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-3">
        {/* Scope chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTabPhamVi('tat_ca')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tabPhamVi === 'tat_ca'
                ? 'bg-primary/15 text-primary font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            Tất cả ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setTabPhamVi('truong')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tabPhamVi === 'truong'
                ? 'bg-primary/15 text-primary font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            Toàn trường
          </button>
          <button
            type="button"
            onClick={() => setTabPhamVi('lop')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tabPhamVi === 'lop'
                ? 'bg-primary/15 text-primary font-bold shadow-xs'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            Lớp tôi
          </button>

          <div className="h-5 w-px bg-border/60 mx-1 hidden sm:block" />

          {/* "Có bạn bè" filter chip (preserves data-testid="filter-co-ban-be") */}
          <button
            type="button"
            data-testid="filter-co-ban-be"
            onClick={() => setChiHienCoBanBe((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              chiHienCoBanBe
                ? 'border-indigo-500/60 bg-indigo-600 text-white shadow-sm'
                : 'border-border/70 bg-background/60 text-muted-foreground hover:border-border hover:text-foreground'
            }`}
            aria-pressed={chiHienCoBanBe}
            aria-label="Lọc phòng có bạn bè đang tham gia"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Có bạn bè</span>
            {soPhongCoBanBe > 0 && (
              <Badge
                variant="secondary"
                className={`ml-0.5 px-1.5 py-0 text-[10px] ${
                  chiHienCoBanBe ? 'bg-white/20 text-white' : ''
                }`}
              >
                {soPhongCoBanBe}
              </Badge>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm phòng theo tên, chủ phòng…"
            className="h-8 pl-8 text-xs bg-background/80 border-border/70"
          />
        </div>
      </div>

      {/* 3. Room Grid */}
      {danhSachPhongLoc.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/20">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
            <Radio className="h-7 w-7 opacity-60" />
          </div>
          <h4 className="text-sm font-semibold text-foreground">Không tìm thấy phòng học nào</h4>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            {tuKhoa || chiHienCoBanBe
              ? 'Không có phòng học phù hợp với bộ lọc hiện tại. Thử xóa bớt từ khóa hoặc tắt bộ lọc bạn bè.'
              : 'Hiện chưa có phòng học nào đang mở. Hãy tạo phòng đầu tiên để bắt đầu học tập cùng bạn bè!'}
          </p>
          <Button
            size="sm"
            className="mt-4 h-9 gap-1.5 text-xs font-semibold"
            onClick={() => navigate(`/room/phong-${Date.now().toString(36)}`)}
          >
            <Plus className="h-3.5 w-3.5" />
            Tạo phòng học ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {danhSachPhongLoc.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              friends={roomFriendsMap.get(room.id)}
              onVaoPhong={xuLyVaoPhong}
            />
          ))}
        </div>
      )}

      {/* Password Modal */}
      <PasswordRoomDialog
        room={phongCanMatKhau}
        onClose={() => setPhongCanMatKhau(null)}
        onSuccess={(room) => {
          setPhongCanMatKhau(null)
          navigate(`/room/phong-${room.id}`)
        }}
      />
    </div>
  )
}
