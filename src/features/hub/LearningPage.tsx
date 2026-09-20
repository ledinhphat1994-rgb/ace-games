import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { RoomCard } from './RoomCard'
import { EmptyState } from '@/components/ui/empty-state'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
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

type TabPhamVi = 'tat_ca' | 'truong' | 'lop'

const SCOPE_TABS: { id: TabPhamVi; label: string }[] = [
  { id: 'tat_ca', label: 'Tất cả' },
  { id: 'truong', label: 'Toàn trường' },
  { id: 'lop', label: 'Lớp tôi' },
]

export function LearningPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''

  const { nguoiDung } = usePhien()
  const { rooms, socialState, presenceMap } = useCampus()

  const [tabPhamVi, setTabPhamVi] = useState<TabPhamVi>('tat_ca')
  const [tuKhoa, setTuKhoa] = useState(urlQuery)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery)
  const [chiHienCoBanBe, setChiHienCoBanBe] = useState(false)
  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)

  // Sync URL ?q param → local filter state
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery)
    setTuKhoa(urlQuery)
  }

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
    <div className="space-y-5">
      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-brand" />
            Học tập &amp; Nghiên cứu
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Phòng học nhóm trực tuyến, video đồng bộ và thảo luận bài học
          </p>
        </div>

        <Button size="default" onClick={() => setMoTaoPhong(true)}>
          <Plus className="h-4 w-4" />
          Tạo phòng học
        </Button>
      </div>

      {/* ── Filter bar ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-default bg-surface/50 p-3">
        {/* Scope chips + friend filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Scope toggle buttons */}
          {SCOPE_TABS.map((tab) => {
            const isActive = tabPhamVi === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabPhamVi(tab.id)}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-brand/15 text-brand font-semibold'
                    : 'text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                ].join(' ')}
              >
                {tab.label}
                {tab.id === 'tat_ca' && (
                  <span className="ml-1.5 text-text-tertiary">({rooms.length})</span>
                )}
              </button>
            )
          })}

          <div className="h-5 w-px bg-border-default mx-0.5 hidden sm:block" />

          {/* Friend filter chip */}
          <button
            type="button"
            data-testid="filter-co-ban-be"
            onClick={() => setChiHienCoBanBe((prev) => !prev)}
            aria-pressed={chiHienCoBanBe}
            aria-label="Lọc phòng có bạn bè đang tham gia"
            className={[
              'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-150',
              chiHienCoBanBe
                ? 'border-social/50 bg-social text-white shadow-sm'
                : 'border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary',
            ].join(' ')}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Có bạn bè</span>
            {soPhongCoBanBe > 0 && (
              <Badge
                variant="secondary"
                className={[
                  'ml-0.5 px-1.5 py-0 text-[10px]',
                  chiHienCoBanBe ? 'bg-white/20 text-white border-white/20' : '',
                ].join(' ')}
              >
                {soPhongCoBanBe}
              </Badge>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
          <Input
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            placeholder="Tìm phòng, chủ phòng…"
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* ── Room grid ─────────────────────────────────────── */}
      {danhSachPhongLoc.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="Không tìm thấy phòng học"
          description={
            tuKhoa || chiHienCoBanBe
              ? 'Thử xóa bớt từ khóa hoặc tắt bộ lọc bạn bè.'
              : 'Hiện chưa có phòng nào đang mở. Hãy tạo phòng đầu tiên!'
          }
          action={{
            label: 'Tạo phòng học ngay',
            icon: Plus,
            onClick: () => setMoTaoPhong(true),
          }}
        />
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

      {/* Modals */}
      <CreateStudyRoomDialog open={moTaoPhong} onOpenChange={setMoTaoPhong} />
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
