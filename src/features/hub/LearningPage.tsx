import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useCampus } from '@/hooks/use-campus'
import { usePhien } from '@/app/phien'
import { Input } from '@/components/ui/input'
import { RoomCard } from './RoomCard'
import { EmptyState } from '@/components/ui/empty-state'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { buildRoomFriendsMap, filterDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  BookOpen,
  Search,
  Users,
  Activity,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  LEARNING_OCCUPANCY_METRIC_CONFIG,
  matchRoomSubject,
} from './learning-semantics'
import { LearningHeader } from './components/learning/LearningHeader'
import { ClassChallengeCard } from './components/learning/ClassChallengeCard'
import { ClassLeaderboardCard } from './components/learning/ClassLeaderboardCard'
import { SubjectFilterStrip } from './components/learning/SubjectFilterStrip'
import { QuickStartStudyModal } from './components/learning/QuickStartStudyModal'

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
  const [selectedSubject, setSelectedSubject] = useState<string>('tat_ca')
  const [chiHienCoBanBe, setChiHienCoBanBe] = useState(false)
  const [phongCanMatKhau, setPhongCanMatKhau] = useState<PhongSanh | null>(null)
  const [moTaoPhong, setMoTaoPhong] = useState(false)
  const [moQuickStart, setMoQuickStart] = useState(false)

  // Mobile sub-tab: 'rooms' (Phòng học) vs 'class_goals' (Mục tiêu & Thi đua lớp)
  const [mobileTab, setMobileTab] = useState<'rooms' | 'class_goals'>('rooms')

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

  // Filter rooms by scope, keyword, friend attendance, and subject
  const danhSachPhongLoc = useMemo(() => {
    const baseList = filterDiscoveryRooms(rooms, roomFriendsMap, {
      tabPhamVi,
      tuKhoa,
      chiHienCoBanBe,
      userLopId: nguoiDung.lopId,
    })

    if (selectedSubject === 'tat_ca') return baseList

    return baseList.filter((room) => matchRoomSubject(room, selectedSubject))
  }, [rooms, roomFriendsMap, tabPhamVi, tuKhoa, chiHienCoBanBe, selectedSubject, nguoiDung.lopId])

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
      {/* ── 1. Learning Action Header ─────────────────────── */}
      <LearningHeader
        onOpenCreateRoom={() => setMoTaoPhong(true)}
        onOpenQuickStart={() => setMoQuickStart(true)}
      />

      {/* ── 2. Mobile View Switcher (Segmented Control) ────── */}
      <div className="flex sm:hidden rounded-xl bg-slate-900/80 p-1 border border-white/10">
        <button
          type="button"
          onClick={() => setMobileTab('rooms')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'rooms'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Phòng học ({rooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('class_goals')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'class_goals'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>Mục tiêu & Thi đua</span>
        </button>
      </div>

      {/* ── 3. Main 2-Column Responsive Layout ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Left Column (3 cols on desktop): Room Discovery Workspace */}
        <div className={`lg:col-span-3 space-y-4 ${mobileTab === 'class_goals' ? 'hidden sm:block' : 'block'}`}>
          {/* Subject Filter Strip */}
          <SubjectFilterStrip
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
          />

          {/* Scope & Keyword Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-white/10 bg-[#0c1222] p-2.5 sm:p-3 shadow-md">
            {/* Scope tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {SCOPE_TABS.map((tab) => {
                const isActive = tabPhamVi === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTabPhamVi(tab.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {tab.label}
                    {tab.id === 'tat_ca' && (
                      <span className={`ml-1 text-[10px] ${isActive ? 'text-slate-950 font-extrabold' : 'text-slate-400'}`}>
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
                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  chiHienCoBanBe
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Có bạn bè</span>
                {soPhongCoBanBe > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] ${chiHienCoBanBe ? 'bg-white text-indigo-700 font-extrabold' : 'bg-indigo-500/20 text-indigo-300'}`}>
                    {soPhongCoBanBe}
                  </span>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm tên phòng, nội dung..."
                className="h-8 sm:h-9 pl-9 pr-3 text-xs bg-slate-900/60 border-white/10 focus:border-cyan-500 rounded-xl"
              />
            </div>
          </div>

          {/* Room Cards Grid or Empty State */}
          {danhSachPhongLoc.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Chưa có phòng học phù hợp"
              description={
                tuKhoa || chiHienCoBanBe || tabPhamVi !== 'tat_ca' || selectedSubject !== 'tat_ca'
                  ? 'Thử thay đổi bộ lọc môn học hoặc từ khóa tìm kiếm để khám phá thêm phòng học.'
                  : 'Hiện tại chưa có phòng học nhóm nào đang mở. Bạn có thể mở phòng ngay để cùng học với bạn bè.'
              }
              action={
                tuKhoa || chiHienCoBanBe || tabPhamVi !== 'tat_ca' || selectedSubject !== 'tat_ca'
                  ? {
                      label: 'Xóa bộ lọc',
                      onClick: () => {
                        setTabPhamVi('tat_ca')
                        setSelectedSubject('tat_ca')
                        setTuKhoa('')
                        setChiHienCoBanBe(false)
                      },
                    }
                  : {
                      label: 'Bắt đầu học ngay',
                      onClick: () => setMoQuickStart(true),
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

        {/* Right Column (1 col on desktop): Goals, Leaderboard & Metrics */}
        <div className={`space-y-4 ${mobileTab === 'rooms' ? 'hidden sm:block' : 'block'}`}>
          {/* Class Weekly Challenge Card */}
          <ClassChallengeCard />

          {/* Class Leaderboard Card */}
          <ClassLeaderboardCard />

          {/* Live Occupancy Metric Box (Contract Invariant Compliant) */}
          <div className="rounded-2xl border border-white/10 bg-[#0c1222] p-4 shadow-lg space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-white/5">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Thống kê sảnh học tập
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đang mở</span>
                </div>
                <p className="text-lg font-black text-white mt-0.5">{rooms.length}</p>
                <p className="text-[10px] text-slate-400">Phòng hoạt động</p>
              </div>

              <div
                className="rounded-xl bg-slate-900/60 border border-white/5 p-2.5 text-center"
                data-testid="room-occupancy-metric"
              >
                <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-[11px] font-semibold">
                  <Users className="h-3 w-3" />
                  <span>{LEARNING_OCCUPANCY_METRIC_CONFIG.headerLabel}</span>
                </div>
                <p className="text-lg font-black text-white mt-0.5">{totalParticipants}</p>
                <p className="text-[10px] text-slate-400">{LEARNING_OCCUPANCY_METRIC_CONFIG.subLabel}</p>
              </div>
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

      <QuickStartStudyModal
        open={moQuickStart}
        onOpenChange={setMoQuickStart}
        onSuccess={(roomId) => {
          setMoQuickStart(false)
          navigate(`/room/phong-${roomId}`)
        }}
      />
    </div>
  )
}
