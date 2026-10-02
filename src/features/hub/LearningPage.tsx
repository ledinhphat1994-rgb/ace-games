// Digital Campus v2: Canonical Learning Room Lobby
// src/features/hub/LearningPage.tsx

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { useDragScroll } from '@/hooks/use-drag-scroll'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { RoomCard } from './RoomCard'
import { ThongKeHocTap } from './ThongKeHocTap'
import { PasswordRoomDialog } from './PasswordRoomDialog'
import { CreateStudyRoomDialog } from './CreateStudyRoomDialog'
import { JoinRoomModal } from './components/learning/JoinRoomModal'
import { buildRoomFriendsMap, sortDiscoveryRooms } from './room-discovery'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  deriveActiveFriendStudy,
  deriveLobbyState,
  deriveQuickJoinRoom,
  filterLobbyRooms,
  LEARNING_OCCUPANCY_METRIC_CONFIG,
} from './learning-semantics'
import {
  ArrowRight,
  BookOpen,
  DoorOpen,
  FileText,
  MonitorPlay,
  PenTool,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AnhNguoiDung } from '@/components/social/AnhNguoiDung'

export { LEARNING_OCCUPANCY_METRIC_CONFIG }

// Danh mục môn học / chủ đề học tập để kéo ngang
const CHU_DE_HOC_TAP = [
  { id: '', label: 'Tất cả môn học' },
  { id: 'toan', label: 'Toán học' },
  { id: 'ly', label: 'Vật lý' },
  { id: 'hoa', label: 'Hóa học' },
  { id: 'van', label: 'Ngữ văn' },
  { id: 'anh', label: 'Tiếng Anh' },
  { id: 'tin', label: 'Tin học' },
  { id: 'sinh', label: 'Sinh học' },
  { id: 'su', label: 'Lịch sử' },
  { id: 'tu_do', label: 'Học tự do' },
]

export function LearningPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const { nguoiDung, moAuthModal } = usePhien()
  const laAdminToanQuyen = Boolean(
    nguoiDung && (nguoiDung.isSchoolAdmin || nguoiDung.role === 'admin' || nguoiDung.username === 'ledinhphat'),
  )
  void laAdminToanQuyen
  const chipsDrag = useDragScroll<HTMLDivElement>({ direction: 'horizontal' })
  const friendsInRoomDrag = useDragScroll<HTMLDivElement>({ direction: 'vertical' })

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

  const lobbyState = useMemo(
    () => deriveLobbyState({ trangThai, campusSnapshotReady, rooms }),
    [trangThai, campusSnapshotReady, rooms],
  )

  const danhSachPhongLoc = useMemo(
    () => sortDiscoveryRooms(filterLobbyRooms(rooms, tuKhoa), roomFriendsMap),
    [rooms, tuKhoa, roomFriendsMap],
  )

  const activeFriendStudy = useMemo(
    () =>
      deriveActiveFriendStudy({
        rooms,
        roomFriendsMap,
        presenceReady,
        trangThai,
      }),
    [rooms, roomFriendsMap, presenceReady, trangThai],
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

  const quickJoinRoom = useMemo(
    () => deriveQuickJoinRoom({ lobbyStatus: lobbyState.status, rooms, roomFriendsMap }),
    [lobbyState.status, rooms, roomFriendsMap],
  )

  const vaoPhongNhanh = () => {
    if (!quickJoinRoom) return
    xuLyVaoPhong(quickJoinRoom)
  }

  return (
    <div className="pb-12 space-y-8">
      {/* 1. Hero Banner Sảnh học tập (Full-width, Doubled Height) */}
      <section
        aria-label="Giới thiệu sảnh học tập"
        className="relative w-full min-h-[440px] lg:min-h-[480px] flex flex-col justify-center overflow-hidden rounded-3xl border border-sky-500/25 bg-[#040e29] shadow-[0_0_40px_rgba(56,189,248,0.15)] group"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/assets/cyber_mockups/learning_hero_bg.webp"
            alt="Không gian học tập Digital Campus"
            className="h-full w-full object-cover object-right opacity-80 dark:opacity-85 crisp-image scale-100 group-hover:scale-102 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020c24] via-[#020c24]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020c24]/90 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-sky-400 mb-4 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
            <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
            <span>PHÒNG HỌC TRỰC TUYẾN • GDTX ĐỊNH QUÁN</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
            Sảnh Học Tập Trực Tuyến
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Tạo hoặc tham gia phòng học nhóm tương tác với bảng vẽ, tài liệu PDF và video bài giảng cùng bạn học.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              size="default"
              onClick={canDangNhap(() => setMoTaoPhong(true))}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer gap-2"
            >
              <Plus className="size-4" />
              <span>Tạo phòng học mới</span>
            </Button>

            <Button
              variant="outline"
              size="default"
              onClick={canDangNhap(() => setMoVaoBangMa(true))}
              className="h-11 px-5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer gap-2"
            >
              <DoorOpen className="size-4 text-sky-400" />
              <span>Vào phòng bằng mã</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Khu vực chính giữa: 8 Cột trên XL ── */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 2. Thống kê học tập thực tế */}
          <ThongKeHocTap rooms={rooms} sanSang={lobbyState.status === 'ready'} />

          {/* 3. Thanh chủ đề môn học (Kéo qua kéo lại mượt mà - Smooth Drag Scroll) */}
          <section aria-label="Lọc theo môn học" className="space-y-2">
            <div
              ref={chipsDrag.ref}
              {...chipsDrag.events}
              className="smooth-carousel flex overflow-x-auto gap-2 pb-2 scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing select-none"
            >
              {CHU_DE_HOC_TAP.map((cd) => {
                const isActive = tuKhoa === cd.id
                return (
                  <button
                    key={cd.id}
                    type="button"
                    onClick={() => datTuKhoa(cd.id)}
                    className={cn(
                      'shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                      isActive
                        ? 'bg-sky-500 text-white border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                        : 'border-border-default/70 bg-[#0f172a] text-slate-300 hover:bg-slate-800 hover:text-white',
                    )}
                  >
                    {cd.label}
                  </button>
                )
              })}
            </div>
          </section>

          {/* 4. Danh sách phòng học đang mở (Kéo lên kéo xuống) */}
          <section aria-label="Phòng học đang mở" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary">Phòng học trực tuyến</h2>
                {nguoiDung && lobbyState.status === 'ready' && (
                  <span className="text-xs text-text-secondary font-mono">({danhSachPhongLoc.length})</span>
                )}
              </div>

              {/* Action Cluster */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search input */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
                  <input
                    data-testid="learning-search-input"
                    type="text"
                    value={tuKhoa}
                    onChange={(e) => datTuKhoa(e.target.value)}
                    placeholder="Tìm phòng học..."
                    className="w-full h-8 pl-8 pr-7 rounded-lg border border-border-default/80 bg-surface text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-hidden"
                  />
                  {tuKhoa && (
                    <button
                      type="button"
                      onClick={() => datTuKhoa('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {quickJoinRoom && (
                  <Button
                    data-testid="quick-join-btn"
                    variant="outline"
                    size="sm"
                    onClick={canDangNhap(vaoPhongNhanh)}
                    className="h-8 px-2.5 rounded-lg border-border-default text-xs font-semibold"
                  >
                    <Sparkles className="size-3 mr-1 text-brand" />
                    <span>Học ngay</span>
                  </Button>
                )}

                <Button
                  data-testid="join-by-code-btn"
                  variant="outline"
                  size="sm"
                  onClick={canDangNhap(() => setMoVaoBangMa(true))}
                  className="h-8 px-2.5 rounded-lg border-border-default text-xs font-semibold"
                >
                  <DoorOpen className="size-3 mr-1 text-brand" />
                  <span>Vào bằng mã</span>
                </Button>

                <Button
                  data-testid="create-room-btn"
                  size="sm"
                  onClick={canDangNhap(() => setMoTaoPhong(true))}
                  className="h-8 px-3 rounded-lg bg-brand hover:bg-brand-hover text-brand-foreground text-xs font-bold shadow-xs"
                >
                  <Plus className="size-3.5 mr-1" />
                  <span>Tạo phòng</span>
                </Button>
              </div>
            </div>

            {/* Smart continuation banner */}
            {activeFriendStudy && (
              <div
                data-testid="friend-study-continuation"
                className="flex items-center justify-between gap-3 rounded-2xl border border-brand/35 bg-brand/10 p-3.5 backdrop-blur-md shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand border border-brand/30">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                      Bạn bè đang học: <span className="text-brand font-black">{activeFriendStudy.friend.displayName}</span>
                    </p>
                    <p className="text-xs text-text-secondary truncate">
                      {activeFriendStudy.room.ten || `Phòng #${activeFriendStudy.room.id}`}
                    </p>
                  </div>
                </div>

                <Button
                  data-testid="join-friend-study-btn"
                  size="sm"
                  onClick={canDangNhap(() => xuLyVaoPhong(activeFriendStudy.room))}
                  className="shrink-0 gap-1.5 bg-brand hover:bg-brand-hover text-brand-foreground font-bold text-xs h-8 px-3 shadow-xs"
                >
                  <DoorOpen className="h-3.5 w-3.5" />
                  <span>Vào cùng</span>
                </Button>
              </div>
            )}

            {/* Room List with Loading / Reconnecting / Ready states */}
            {lobbyState.status === 'loading' && (
              <div data-testid="learning-lobby-loading" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[1, 2].map((n) => (
                  <div key={n} className="h-32 rounded-2xl border border-border-subtle bg-surface/50 animate-pulse p-4" />
                ))}
              </div>
            )}

            {lobbyState.status === 'reconnecting' && (
              <div
                data-testid="learning-lobby-reconnecting"
                className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-center flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="size-4 animate-spin text-warning" />
                  <span className="text-xs font-semibold text-text-primary">Đang kết nối lại sảnh học tập...</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => ketNoiLai?.()} className="h-8 text-xs font-bold">
                  Thử lại ngay
                </Button>
              </div>
            )}

            {!nguoiDung ? (
              <div data-testid="learning-empty-rooms">
                <EmptyState
                  icon={BookOpen}
                  title="Đăng nhập để xem phòng đang mở"
                  action={{
                    label: 'Đăng nhập',
                    onClick: () => moAuthModal('dang_nhap'),
                  }}
                />
              </div>
            ) : lobbyState.status === 'ready' && danhSachPhongLoc.length === 0 ? (
              <div data-testid="learning-empty-rooms">
                <EmptyState
                  icon={BookOpen}
                  title="Chưa có phòng nào đang mở"
                  action={{
                    label: 'Tạo phòng học ngay',
                    onClick: canDangNhap(() => setMoTaoPhong(true)),
                  }}
                />
              </div>
            ) : null}

            {lobbyState.status === 'ready' && danhSachPhongLoc.length > 0 && (
              <div data-testid="learning-rooms-list" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {danhSachPhongLoc.map((room: PhongSanh) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    friends={roomFriendsMap.get(room.id)}
                    onVaoPhong={xuLyVaoPhong}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Cột tiện ích bên phải: 4 Cột trên XL (Kéo lên kéo xuống) ── */}
        <div className="xl:col-span-4 space-y-6">
          {/* Tiện ích 1: Bạn bè đang trong phòng học */}
          <section aria-label="Bạn bè đang học" className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-sky-400" />
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                Bạn bè đang học
              </h2>
            </div>

            <div className="rounded-2xl border border-border-default/80 bg-surface p-3 shadow-sm">
              {friends.filter((f) => presenceMap[f.id]?.activity?.type === 'room').length > 0 ? (
                <div
                  ref={friendsInRoomDrag.ref}
                  {...friendsInRoomDrag.events}
                  className="overflow-y-auto max-h-[240px] scrollbar-thin space-y-2 pr-1 cursor-grab active:cursor-grabbing select-none touch-pan-y"
                >
                  {friends
                    .filter((f) => presenceMap[f.id]?.activity?.type === 'room')
                    .map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AnhNguoiDung avatar={f.avatar} ten={f.displayName} className="size-8" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{f.displayName}</p>
                            <p className="text-[11px] text-sky-400 truncate">
                              Đang trong phòng #{presenceMap[f.id]?.activity?.roomId}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-slate-400">Chưa có bạn bè nào đang trong phòng học</p>
                </div>
              )}
            </div>
          </section>

          {/* Tiện ích 2: Tính năng phòng học trực tuyến */}
          <section aria-label="Tính năng phòng học" className="rounded-2xl border border-border-default/80 bg-surface p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Công cụ tương tác trong phòng
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="size-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                  <PenTool className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Bảng vẽ tương tác</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vẽ hình, ghi chú trực tiếp theo thời gian thực.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="size-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Tài liệu PDF</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Mở đề cương, sách giáo khoa và tài liệu ôn tập.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="size-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                  <MonitorPlay className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Xem video YouTube</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Đồng bộ video bài giảng cho cả nhóm cùng theo dõi.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Tiện ích 3: Bảng xếp hạng học tập */}
          <section aria-label="Thi đua học tập" className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-[#0f172a] to-sky-950/20 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400">
              <Trophy className="size-4.5" />
              <h3 className="text-sm font-bold text-white">Bảng thi đua học tập</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tích lũy thời gian học tập có ý nghĩa và ghi nhận chuỗi ngày chuyên cần cùng cả lớp.
            </p>
            <Link
              to="/leaderboard?category=hoc_tap"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <span>Xem bảng xếp hạng học tập</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </div>
      </div>

      {/* Dialogs */}
      {phongCanMatKhau && (
        <PasswordRoomDialog
          room={phongCanMatKhau}
          onClose={() => setPhongCanMatKhau(null)}
          onSuccess={(roomId) => {
            setPhongCanMatKhau(null)
            navigate(`/room/phong-${roomId}`)
          }}
        />
      )}

      {moTaoPhong && (
        <CreateStudyRoomDialog
          open={moTaoPhong}
          onOpenChange={setMoTaoPhong}
          onSuccess={(roomId) => {
            setMoTaoPhong(false)
            navigate(`/room/phong-${roomId}`)
          }}
        />
      )}

      <JoinRoomModal
        open={moVaoBangMa}
        onOpenChange={setMoVaoBangMa}
        onJoinRoomId={(roomId: number) => {
          setMoVaoBangMa(false)
          navigate(`/room/phong-${roomId}`)
        }}
      />
    </div>
  )
}
