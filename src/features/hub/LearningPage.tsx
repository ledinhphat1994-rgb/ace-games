// Digital Campus v2: Canonical Learning Room Lobby matching E:\phát\hình thiết kế web
// src/features/hub/LearningPage.tsx

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
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
  Calendar,
  Clock,
  Download,
  DoorOpen,
  FileCode,
  FileSpreadsheet,
  FileText,
  Folder,
  GraduationCap,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export { LEARNING_OCCUPANCY_METRIC_CONFIG }

export function LearningPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const { nguoiDung, moAuthModal } = usePhien()

  const laAdminToanQuyen = Boolean(
    nguoiDung && (nguoiDung.isSchoolAdmin || nguoiDung.role === 'admin' || nguoiDung.username === 'ledinhphat'),
  )
  void laAdminToanQuyen

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
  const [activeScheduleDay, setActiveScheduleDay] = useState<'t2' | 't3' | 't4' | 't5' | 't6'>('t3')

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

  const handleOpenCampusChat = () => {
    if (!nguoiDung) {
      moAuthModal?.('dang_nhap')
      return
    }
    window.dispatchEvent(new CustomEvent('campus:open-chat'))
  }

  // 4 Shortcut action cards matching E:\phát\hình thiết kế web
  const shortcutCards = [
    {
      title: 'Khóa học của tôi',
      desc: 'Tiếp tục học, xem tiến độ',
      icon: GraduationCap,
      color: 'bg-sky-500/15 border-sky-500/30 text-sky-400 group-hover:border-sky-500/60',
      action: () => setTuKhoa(''),
    },
    {
      title: 'Bài tập',
      desc: 'Xem và nộp bài tập',
      icon: FileText,
      color: 'bg-purple-500/15 border-purple-500/30 text-purple-400 group-hover:border-purple-500/60',
      action: () => toast.info('Chức năng danh sách bài tập đang cập nhật'),
    },
    {
      title: 'Lịch học',
      desc: 'Xem thời khóa biểu',
      icon: Calendar,
      color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/60',
      action: () => {
        const el = document.getElementById('schedule-widget')
        el?.scrollIntoView({ behavior: 'smooth' })
      },
    },
    {
      title: 'Tài liệu',
      desc: 'Ghi chú, đề thi, tài liệu',
      icon: Folder,
      color: 'bg-amber-500/15 border-amber-500/30 text-amber-400 group-hover:border-amber-500/60',
      action: () => {
        const el = document.getElementById('docs-widget')
        el?.scrollIntoView({ behavior: 'smooth' })
      },
    },
  ]

  // 4 Featured Courses matching E:\phát\hình thiết kế web
  const featuredCourses = [
    {
      id: 'math10',
      tag: 'Toán học',
      tagBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      title: 'Toán 10 - Đại số và Hàm số',
      teacher: 'ThS. Nguyễn Minh Châu',
      teacherAvatar: '/assets/avatars/user-1.webp',
      progress: 75,
      coverImg: '/assets/learning/room_math.webp',
    },
    {
      id: 'python_basic',
      tag: 'Lập trình',
      tagBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      title: 'Lập trình Python cơ bản',
      teacher: 'ThS. Trần Hoài Nam',
      teacherAvatar: '/assets/avatars/user-2.webp',
      progress: 40,
      coverImg: '/assets/learning/room_tech.webp',
    },
    {
      id: 'english_comm',
      tag: 'Tiếng Anh',
      tagBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      title: 'Tiếng Anh giao tiếp cho sinh viên',
      teacher: 'Cô Phạm Thùy Linh',
      teacherAvatar: '/assets/avatars/user-3.webp',
      progress: 60,
      coverImg: '/assets/learning/room_youtube.webp',
    },
    {
      id: 'soft_skills',
      tag: 'Kỹ năng',
      tagBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      title: 'Kỹ năng học tập hiệu quả',
      teacher: 'ThS. Lê Minh Đức',
      teacherAvatar: '/assets/avatars/user-4.webp',
      progress: 20,
      coverImg: '/assets/learning/room_study.webp',
    },
  ]

  // Upcoming homework items
  const upcomingHomework = [
    {
      title: 'Bài tập chương 3: Hàm số bậc hai',
      subject: 'Toán 10 • Nộp online',
      due: 'Còn 1 ngày',
      dueColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      icon: FileText,
    },
    {
      title: 'Viết đoạn văn ngắn về môi trường',
      subject: 'Tiếng Anh • Nộp online',
      due: 'Còn 3 ngày',
      dueColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      icon: FileText,
    },
    {
      title: 'Bài tập lập trình: Quản lý sinh viên',
      subject: 'Lập trình Python • Nộp online',
      due: 'Còn 5 ngày',
      dueColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: FileCode,
    },
    {
      title: 'Chuẩn bị thuyết trình nhóm',
      subject: 'Kỹ năng • Nộp tài liệu',
      due: 'Còn 6 ngày',
      dueColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: FileSpreadsheet,
    },
  ]

  // Weekly timetable
  const timetableSchedule = [
    { time: '08:00 - 09:30', subject: 'Toán 10', room: 'Phòng A1.02 - Cô Nguyễn Thị Lan', color: 'bg-sky-500' },
    { time: '10:00 - 11:30', subject: 'Tiếng Anh', room: 'Phòng B2.01 - Thầy Trần Minh', color: 'bg-purple-500' },
    { time: '13:30 - 15:00', subject: 'Lập trình Python', room: 'Phòng Lab 3 - ThS. Lê Minh Đức', color: 'bg-emerald-500' },
    { time: '15:30 - 17:00', subject: 'Sinh học', room: 'Phòng C1.05 - Cô Phạm Thu Hà', color: 'bg-amber-500' },
  ]

  // Study documents suggested
  const studyDocs = [
    { title: 'Tóm tắt công thức Toán 10', type: 'PDF', size: '2.4 MB', date: '12/10/2024', color: 'bg-rose-500/20 text-rose-400' },
    { title: 'Bài tập mẫu Python cơ bản', type: 'DOCX', size: '1.8 MB', date: '10/10/2024', color: 'bg-sky-500/20 text-sky-400' },
    { title: '150 câu giao tiếp Tiếng Anh thường gặp', type: 'PDF', size: '3.1 MB', date: '08/10/2024', color: 'bg-rose-500/20 text-rose-400' },
    { title: 'Kỹ thuật ghi chép hiệu quả', type: 'PPTX', size: '5.2 MB', date: '05/10/2024', color: 'bg-amber-500/20 text-amber-400' },
  ]

  return (
    <div className="pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Main Left Area: 8 Columns on XL ── */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 1. Learning Hero Banner */}
          <section
            aria-label="Giới thiệu sảnh học tập"
            className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-[#0b1220] shadow-[0_0_40px_rgba(56,189,248,0.08)] group"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src="/assets/cyber_mockups/learning_hero_bg.webp"
                alt="Không gian học tập Digital Campus"
                className="h-full w-full object-cover object-right opacity-40 dark:opacity-45 scale-100 group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-[#090d16]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
            </div>

            <div className="relative z-10 p-6 sm:p-9 lg:p-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-400 mb-4 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
                <span>HỌC TẬP • KIẾN THỨC • TƯƠNG LAI</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.25]">
                Khám phá tri thức,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-400">
                  kiến tạo tương lai
                </span>
              </h1>

              <p className="mt-3.5 text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
                Học mọi lúc, mọi nơi với các khóa học chất lượng, được thiết kế dành riêng cho học sinh, sinh viên.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3.5">
                <Button
                  size="lg"
                  onClick={canDangNhap(() => setMoTaoPhong(true))}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer"
                >
                  <span>Bắt đầu học ngay</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => toast.info('Video giới thiệu Digital Campus Learning đang được cập nhật')}
                  className="h-11 px-5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold text-sm backdrop-blur-md transition-all cursor-pointer gap-2"
                >
                  <Play className="h-4 w-4 fill-white text-white" />
                  <span>Xem video giới thiệu</span>
                </Button>
              </div>
            </div>
          </section>

          {/* 2. Four Shortcut Action Cards */}
          <section aria-label="Thao tác nhanh" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            {shortcutCards.map((sc, idx) => {
              const Icon = sc.icon
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={sc.action}
                  className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border-default/70 bg-[#0f172a] hover:bg-[#152037] transition-all duration-200 cursor-pointer shadow-sm text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl border shadow-xs transition-transform duration-200 group-hover:scale-105',
                        sc.color,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-slate-300 group-hover:text-white group-hover:bg-brand transition-all">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                      {sc.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-400 truncate">{sc.desc}</p>
                  </div>
                </button>
              )
            })}
          </section>

          {/* 3. Section "Khóa học nổi bật" */}
          <section aria-label="Khóa học nổi bật" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-400" />
                <h2 className="text-lg font-bold text-text-primary tracking-tight">Khóa học nổi bật</h2>
              </div>
              <button
                type="button"
                onClick={() => setTuKhoa('')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredCourses.map((c) => (
                <div
                  key={c.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border-default/70 bg-[#0f172a] hover:border-sky-500/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.18)] transition-all duration-200 cursor-pointer"
                  onClick={canDangNhap(() => setMoTaoPhong(true))}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <img
                      src={c.coverImg}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
                    <span
                      className={cn(
                        'absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border backdrop-blur-md',
                        c.tagBg,
                      )}
                    >
                      {c.tag}
                    </span>
                    <div className="absolute right-3 bottom-3 size-8 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="size-3.5 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                        {c.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2">
                        <img
                          src={c.teacherAvatar}
                          alt={c.teacher}
                          className="size-5 rounded-full border border-sky-400/40"
                        />
                        <span className="text-[11px] text-slate-400 truncate">{c.teacher}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-end text-[10px] text-slate-400 font-mono">
                        {c.progress}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Active Live Study Rooms (CampusDO Discovery) */}
          <section aria-label="Phòng học đang mở" className="space-y-4">
            <ThongKeHocTap rooms={rooms} sanSang={lobbyState.status === 'ready'} />
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

          {/* 5. Bottom 2-Column: Bài tập cần làm & Tiến độ học tập */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Cột 1: Bài tập cần làm */}
            <section aria-label="Bài tập cần làm" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-sky-400" />
                  <h2 className="text-base font-bold text-text-primary">Bài tập cần làm</h2>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info('Chức năng danh sách bài tập đang cập nhật')}
                  className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-2.5">
                {upcomingHomework.map((hw, idx) => {
                  const Icon = hw.icon
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group cursor-pointer"
                      onClick={() => toast.info(`Mở bài nộp: ${hw.title}`)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                            {hw.title}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{hw.subject}</p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0',
                          hw.dueColor,
                        )}
                      >
                        {hw.due}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Cột 2: Tiến độ học tập */}
            <section aria-label="Tiến độ học tập" className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-emerald-400" />
                  <h2 className="text-base font-bold text-text-primary">Tiến độ học tập</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
                >
                  Xem chi tiết
                </button>
              </div>

              <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-4 shadow-sm flex flex-col justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Gauge 68% */}
                  <div className="relative size-20 shrink-0 flex items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-sky-400"
                        strokeDasharray="68, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="absolute text-sm font-black text-white">68%</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">Hoàn thành 8/12 khóa học</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Bạn đang học rất tốt! Hãy tiếp tục duy trì nhé.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Thời gian học tuần</span>
                    <span className="text-xs font-bold text-sky-400 mt-0.5 block">32 giờ</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block">Điểm trung bình</span>
                    <span className="text-xs font-bold text-emerald-400 mt-0.5 block">4.8 / 5.0</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ── Right Area: 4 Columns on XL (Sidebar Widgets) ── */}
        <div className="xl:col-span-4 space-y-6">
          {/* Widget 1: Tin nhắn gần đây */}
          <section aria-label="Tin nhắn gần đây" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-sky-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Tin nhắn gần đây</h2>
              </div>
              <button
                type="button"
                onClick={handleOpenCampusChat}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-2">
              {[
                { name: 'Trần Mai', msg: 'Bạn: Mai nhớ nộp bài nha!', time: '09:18', badge: 2 },
                { name: 'Lê Hoàng', msg: 'Ừ, tối mình học nhóm nhé!', time: '08:42', badge: 1 },
                { name: 'Nhóm Lớp 10A7', msg: 'Nguyễn Minh: Mai học online nhé...', time: 'Hôm qua', badge: 5 },
              ].map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={handleOpenCampusChat}
                  className="w-full flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                        {m.name}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 truncate mt-0.5">{m.msg}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
                    <span className="size-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {m.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Widget 2: Thời khóa biểu */}
          <section id="schedule-widget" aria-label="Thời khóa biểu" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Thời khóa biểu</h2>
              </div>
              <button
                type="button"
                onClick={() => toast.info('Thời khóa biểu tuần đầy đủ đang được cập nhật')}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-3">
              {/* Day selector tabs */}
              <div className="grid grid-cols-5 gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-white/5">
                {[
                  { id: 't2', label: 'Th 2', date: '14/10' },
                  { id: 't3', label: 'Th 3', date: '15/10' },
                  { id: 't4', label: 'Th 4', date: '16/10' },
                  { id: 't5', label: 'Th 5', date: '17/10' },
                  { id: 't6', label: 'Th 6', date: '18/10' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveScheduleDay(d.id as any)}
                    className={cn(
                      'py-1.5 rounded-lg text-center transition-all cursor-pointer',
                      activeScheduleDay === d.id
                        ? 'bg-sky-500 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-white',
                    )}
                  >
                    <span className="block text-[11px] leading-tight">{d.label}</span>
                    <span className="block text-[9px] opacity-80">{d.date}</span>
                  </button>
                ))}
              </div>

              {/* Timeline list */}
              <div className="space-y-2.5 pt-1">
                {timetableSchedule.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/50 border border-white/5">
                    <div className="text-[10px] text-slate-400 font-mono w-20 shrink-0 pt-0.5">
                      {s.time}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('size-2 rounded-full shrink-0', s.color)} />
                        <p className="text-xs font-bold text-white truncate">{s.subject}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{s.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Widget 3: Tài liệu học tập gợi ý */}
          <section id="docs-widget" aria-label="Tài liệu gợi ý" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm sm:text-base font-bold text-text-primary">Tài liệu gợi ý</h2>
              </div>
              <button
                type="button"
                onClick={() => toast.info('Kho tài liệu môn học')}
                className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="rounded-2xl border border-border-default/70 bg-[#0f172a] p-3.5 shadow-sm space-y-2">
              {studyDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  onClick={() => toast.success(`Đang tải xuống: ${doc.title}`)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'size-8 rounded-lg font-black text-[10px] flex items-center justify-center shrink-0 border border-white/5',
                        doc.color,
                      )}
                    >
                      {doc.type}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                        {doc.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {doc.type} • {doc.size}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Tải xuống ${doc.title}`}
                    className="size-7 rounded-lg bg-white/5 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 flex items-center justify-center transition-colors"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
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

      <JoinRoomModal
        open={moVaoBangMa}
        onOpenChange={setMoVaoBangMa}
        onJoinRoomId={(roomId) => navigate(`/room/phong-${roomId}`)}
      />
    </div>
  )
}
