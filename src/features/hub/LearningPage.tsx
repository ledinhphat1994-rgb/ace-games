import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoomCard } from './RoomCard'
import { EmptyState } from '@/components/ui/empty-state'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap, filterDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Target,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'

import { LEARNING_OCCUPANCY_METRIC_CONFIG } from './learning-semantics'
export { LEARNING_OCCUPANCY_METRIC_CONFIG }

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

  const totalParticipants = useMemo(() => {
    return rooms.reduce((acc, r) => acc + (r.soNguoi || 0), 0)
  }, [rooms])

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
      {/* ── 1. Learning Hero Banner ───────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#080d19] shadow-2xl">
        {/* Background artwork */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-right bg-no-repeat opacity-80 sm:opacity-95"
          style={{
            backgroundImage: 'url(/assets/learning/learning_hero.webp)',
            backgroundPosition: 'right 15% center',
          }}
        />
        {/* Dark directional gradient mask */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#080d19] via-[#080d19]/80 to-transparent sm:bg-gradient-to-r sm:from-[#080d19] sm:via-[#080d19]/90 sm:via-45% sm:to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between min-h-[190px] sm:min-h-[210px] p-5 sm:p-7">
          <div className="max-w-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs tracking-wider uppercase">
              <BookOpen className="h-4 w-4" />
              <span>Không gian học tập &amp; nghiên cứu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow">
              Học tập trực tuyến
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2">
              Không gian phòng học nhóm, trao đổi kiến thức và đồng hành tiến bộ mỗi ngày.
            </p>
          </div>

          {/* 3 Core Value Pills + Slogan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/25 text-[11px] font-semibold text-cyan-300 backdrop-blur-md">
                <Target className="h-3 w-3 text-cyan-400" />
                Tập trung hơn
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/25 text-[11px] font-semibold text-indigo-300 backdrop-blur-md">
                <Users className="h-3 w-3 text-indigo-400" />
                Kết nối dễ dàng
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/25 text-[11px] font-semibold text-emerald-300 backdrop-blur-md">
                <TrendingUp className="h-3 w-3 text-emerald-400" />
                Tiến bộ mỗi ngày
              </span>
            </div>

            <p className="hidden md:block text-xs font-semibold text-cyan-200/80 italic tracking-wide">
              Học cùng nhau đi xa hơn mỗi ngày
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Compact Filter & Search Toolbar ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0c1222] p-3 shadow-md">
        {/* Scope tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SCOPE_TABS.map((tab) => {
            const isActive = tabPhamVi === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabPhamVi(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.label}
                {tab.id === 'tat_ca' && (
                  <span className={`ml-1.5 text-[10px] ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-400'}`}>
                    ({rooms.length})
                  </span>
                )}
              </button>
            )
          })}

          <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* Friend filter chip */}
          <button
            type="button"
            onClick={() => setChiHienCoBanBe(!chiHienCoBanBe)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
              chiHienCoBanBe
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Có bạn bè</span>
            {soPhongCoBanBe > 0 && (
              <span className={`rounded-full px-1.5 text-[10px] ${chiHienCoBanBe ? 'bg-white text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'}`}>
                {soPhongCoBanBe}
              </span>
            )}
          </button>
        </div>

        {/* Search input + Create button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm theo tên phòng, môn học..."
              className="h-9 pl-9 pr-3 text-xs bg-slate-900/60 border-white/10 focus:border-cyan-500 rounded-xl"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setMoTaoPhong(true)}
            className="h-9 px-3.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 gap-1.5 shadow-md shadow-cyan-500/20 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo phòng</span>
          </Button>
        </div>
      </div>

      {/* ── 3. Main Content: Room Grid + Stats Sidebar ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Room Grid (3 cols on desktop) */}
        <div className="lg:col-span-3">
          {danhSachPhongLoc.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Không tìm thấy phòng học phù hợp"
              description={
                tuKhoa || chiHienCoBanBe || tabPhamVi !== 'tat_ca'
                  ? 'Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa để tìm thêm phòng học.'
                  : 'Hiện chưa có phòng học nào đang hoạt động. Bạn có muốn tạo phòng mới không?'
              }
              action={
                tuKhoa || chiHienCoBanBe || tabPhamVi !== 'tat_ca'
                  ? {
                      label: 'Xóa bộ lọc',
                      onClick: () => {
                        setTabPhamVi('tat_ca')
                        setTuKhoa('')
                        setChiHienCoBanBe(false)
                      },
                    }
                  : {
                      label: 'Tạo phòng học ngay',
                      onClick: () => setMoTaoPhong(true),
                    }
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>

        {/* Right Sidebar: Today's Summary & Inspiration Poster */}
        <div className="space-y-4">
          {/* Today's Stats Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Tổng quan hôm nay
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đang mở</span>
                </div>
                <p className="text-xl font-black text-white mt-1">{rooms.length}</p>
                <p className="text-[10px] text-slate-400">Phòng hoạt động</p>
              </div>

              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3" data-testid="room-occupancy-metric">
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                  <Users className="h-3 w-3" />
                  <span>Đang tham gia</span>
                </div>
                <p className="text-xl font-black text-white mt-1">{totalParticipants}</p>
                <p className="text-[10px] text-slate-400">Lượt trong phòng</p>
              </div>
            </div>
          </div>

          {/* Educational Quote & Graduation Art Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg min-h-[160px] flex flex-col justify-end">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
              style={{ backgroundImage: 'url(/assets/learning/learning_quote.webp)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1222] via-[#0c1222]/85 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-1">
              <p className="text-xs font-bold text-white leading-snug drop-shadow">
                Kiến thức hôm nay là cơ hội của ngày mai.
              </p>
              <p className="text-[10px] text-cyan-300/80 font-medium">
                Better Students · Brighter Tomorrow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
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
    </div>
  )
}
