// Digital Campus v2: Canonical Learning Room Lobby
// src/features/hub/LearningPage.tsx

import { useMemo, useState, useEffect } from 'react'
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
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export { LEARNING_OCCUPANCY_METRIC_CONFIG }

// Danh sách phòng học mẫu chuẩn nền tảng hiển thị cho khách và người dùng khám phá sảnh
const PLATFORM_DEFAULT_STUDY_ROOMS: PhongSanh[] = [
  {
    id: 1,
    ten: 'Ôn tập chuyên đề thi THPT: Toán & Ngữ văn',
    moTa: 'Phòng học nhóm tự do cùng giáo viên bộ môn và bạn bè.',
    monHoc: 'toan',
    phamVi: 'truong',
    lopId: null,
    lopTen: null,
    chuPhongTen: 'Thầy Mai',
    coMatKhau: false,
    sucChua: 30,
    soNguoi: 12,
    dangPhat: 'Bài giảng: Đồ thị hàm số bậc hai',
    taoLuc: 1727740800000,
  },
  {
    id: 2,
    ten: 'Chuyên đề Ngữ Văn 10: Nghị luận văn học & Đọc hiểu',
    moTa: 'Phân tích văn bản tác phẩm và luyện viết đoạn văn ngắn.',
    monHoc: 'ngu-van',
    phamVi: 'lop',
    lopId: 1,
    lopTen: '10A7',
    chuPhongTen: 'Cô Phạm Thúy Linh',
    coMatKhau: false,
    sucChua: 25,
    soNguoi: 8,
    dangPhat: null,
    taoLuc: 1727744400000,
  },
  {
    id: 3,
    ten: 'Luyện giao tiếp & Từ vựng Tiếng Anh 10',
    moTa: 'Thực hành phát âm, đàm thoại và làm bài tập trắc nghiệm nhanh.',
    monHoc: 'tieng-anh',
    phamVi: 'truong',
    lopId: null,
    lopTen: null,
    chuPhongTen: 'Nguyễn Minh Anh',
    coMatKhau: false,
    sucChua: 20,
    soNguoi: 6,
    dangPhat: 'IELTS Speaking & Vocabulary',
    taoLuc: 1727748000000,
  },
  {
    id: 4,
    ten: 'Giải bài tập Vật Lí 10: Động học chất điểm',
    moTa: 'Thảo luận phương pháp giải các bài toán chuyển động thẳng đều.',
    monHoc: 'vat-li',
    phamVi: 'lop',
    lopId: 1,
    lopTen: '10A7',
    chuPhongTen: 'Trần Văn Cường',
    coMatKhau: false,
    sucChua: 20,
    soNguoi: 5,
    dangPhat: null,
    taoLuc: 1727751600000,
  },
  {
    id: 5,
    ten: 'Hóa học 10: Cấu tạo nguyên tử & Bảng tuần hoàn',
    moTa: 'Học nhóm ôn thi học kỳ và làm thí nghiệm ảo mô phỏng.',
    monHoc: 'hoa-hoc',
    phamVi: 'truong',
    lopId: null,
    lopTen: null,
    chuPhongTen: 'Lê Hoàng Nam',
    coMatKhau: false,
    sucChua: 20,
    soNguoi: 4,
    dangPhat: null,
    taoLuc: 1727755200000,
  },
  {
    id: 6,
    ten: 'Thực hành Tin học 10: Lập trình Python cơ bản',
    moTa: 'Cùng code thuật toán, sửa lỗi và chia sẻ dự án cá nhân.',
    monHoc: 'tin-hoc',
    phamVi: 'truong',
    lopId: null,
    lopTen: null,
    chuPhongTen: 'Lê An',
    coMatKhau: false,
    sucChua: 25,
    soNguoi: 9,
    dangPhat: 'Python căn bản cho học sinh THPT',
    taoLuc: 1727758800000,
  },
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

  // Kết hợp phòng thực tế với phòng mẫu chuẩn nền tảng để khách vãng lai và học sinh luôn khám phá được sảnh
  const allStudyRooms = useMemo(() => {
    const liveIds = new Set(rooms.map((r) => r.id))
    const merged = [...rooms]
    for (const d of PLATFORM_DEFAULT_STUDY_ROOMS) {
      if (!liveIds.has(d.id)) {
        merged.push(d)
      }
    }
    return merged
  }, [rooms])

  const friends = useMemo(() => socialState?.friends ?? [], [socialState?.friends])
  const blockedUsers = useMemo(() => socialState?.blockedUsers ?? [], [socialState?.blockedUsers])

  const roomFriendsMap = useMemo(
    () =>
      buildRoomFriendsMap(allStudyRooms, friends, presenceMap, blockedUsers, {
        presenceReady,
        connectionStatus: trangThai,
      }),
    [allStudyRooms, friends, presenceMap, blockedUsers, presenceReady, trangThai],
  )

  const lobbyState = useMemo(
    () => deriveLobbyState({ trangThai, campusSnapshotReady, rooms: allStudyRooms }),
    [trangThai, campusSnapshotReady, allStudyRooms],
  )

  const danhSachPhongLoc = useMemo(
    () => sortDiscoveryRooms(filterLobbyRooms(allStudyRooms, tuKhoa), roomFriendsMap),
    [allStudyRooms, tuKhoa, roomFriendsMap],
  )

  const activeFriendStudy = useMemo(
    () =>
      deriveActiveFriendStudy({
        rooms: allStudyRooms,
        roomFriendsMap,
        presenceReady,
        trangThai,
      }),
    [allStudyRooms, roomFriendsMap, presenceReady, trangThai],
  )

  const datTuKhoa = (giaTri: string) => {
    setTuKhoa(giaTri)
    setSearchParams(giaTri ? { q: giaTri } : {}, { replace: true })
  }

  const xuLyVaoPhong = (room: PhongSanh) => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    if (room.soNguoi >= room.sucChua) {
      toast.error('Phòng học đã đầy')
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
    () => deriveQuickJoinRoom({ lobbyStatus: lobbyState.status, rooms: allStudyRooms, roomFriendsMap }),
    [lobbyState.status, allStudyRooms, roomFriendsMap],
  )

  // Danh sách các Slide tự chạy cho Hero Banner Sảnh học tập (VÙNG 6)
  const [slideIndex, setSlideIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const bannerSlides = useMemo(() => [
    {
      id: 'lobby',
      badge: 'PHÒNG HỌC TRỰC TUYẾN • GDTX ĐỊNH QUÁN',
      title: 'Sảnh Học Tập Trực Tuyến',
      desc: 'Tạo hoặc tham gia phòng học nhóm tương tác với bảng vẽ, tài liệu PDF và video bài giảng cùng bạn học.',
      bgImage: '/assets/banners/learning_hero_cyber.jpg',
      gradient: 'from-[#020c24] via-[#020c24]/85 to-transparent',
    },
    {
      id: 'materials',
      badge: 'TÀI LIỆU & ĐỀ CƯƠNG • CHUẨN SGK',
      title: 'Ôn Luyện Chuyên Sâu, Chinh Phục Điểm Cao',
      desc: 'Kho đề thi, đề cương ôn tập các môn Toán, Vật lý, Hoá học, Ngữ văn được cập nhật liên tục theo chương trình GDPT.',
      bgImage: '/assets/cyber_mockups/classroom_hero_bg.webp',
      gradient: 'from-[#03132e] via-[#03132e]/85 to-transparent',
    },
    {
      id: 'interactive',
      badge: 'TƯƠNG TÁC THỜI GIAN THỰC • BẢNG VẼ & YOUTUBE',
      title: 'Học Nhóm Hiệu Quả Cùng Bạn Bè',
      desc: 'Đồng bộ video bài giảng YouTube, cùng vẽ và ghi chú trực tiếp trên tài liệu ôn thi với bạn học theo thời gian thực.',
      bgImage: '/assets/cyber_mockups/home_hero_bg.webp',
      gradient: 'from-[#031d1a] via-[#031d1a]/85 to-transparent',
    },
  ], [])

  // Cơ chế tự chạy Banner (Carousel Auto-play 4.5s) — Dừng khi hover chuột (Pause on hover)
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % bannerSlides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, bannerSlides.length])

  const vaoPhongNhanh = () => {
    if (!quickJoinRoom) return
    xuLyVaoPhong(quickJoinRoom)
  }

  return (
    <div className="pb-12 space-y-8">
      {/* 1. Hero Banner Sảnh học tập (VÙNG 6: Tự động chuyển banner qua lại giống trang chủ) */}
      <section
        aria-label="Giới thiệu sảnh học tập"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full min-h-[440px] lg:min-h-[480px] flex flex-col justify-center overflow-hidden rounded-3xl border border-sky-500/25 bg-[#040e29] shadow-[0_0_40px_rgba(56,189,248,0.15)] group select-none"
      >
        {bannerSlides.map((slide, idx) => {
          const isCurrent = idx === slideIndex
          return (
            <div
              key={slide.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-700 ease-in-out',
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
              )}
            >
              <div className="absolute inset-0 z-0 overflow-hidden">
                <img
                  src={slide.bgImage}
                  alt={slide.title}
                  className="h-full w-full object-cover object-right opacity-80 dark:opacity-85 crisp-image scale-100 group-hover:scale-102 transition-transform duration-700"
                />
                <div className={cn('absolute inset-0 bg-gradient-to-r', slide.gradient)} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020c24]/90 via-transparent to-transparent" />
              </div>

              <div className="relative z-10 p-8 sm:p-12 lg:p-16 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold tracking-wider text-sky-400 mb-4 shadow-[0_0_12px_rgba(56,189,248,0.2)]">
                  <span className="size-2 rounded-full bg-sky-400 animate-pulse" />
                  <span>{slide.badge}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.2]">
                  {slide.title}
                </h1>

                <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  {slide.desc}
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
                </div>
              </div>
            </div>
          )
        })}

        {/* Nút điều hướng Carousel (Prev/Next & Dots) giống trang chủ — SÁT CHÍNH GIỮA CẠNH DƯỚI (VÙNG 3) */}
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
            aria-label="Banner trước"
            className="size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-md"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
            {bannerSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlideIndex(idx)}
                aria-label={`Chuyển đến banner ${idx + 1}`}
                className={cn(
                  'transition-all duration-300 rounded-full cursor-pointer',
                  idx === slideIndex
                    ? 'w-7 h-2.5 bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.9)]'
                    : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80',
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSlideIndex((prev) => (prev + 1) % bannerSlides.length)}
            aria-label="Banner tiếp theo"
            className="size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-md"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ── Khu vực chính giữa: 8 Cột trên XL ── */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* 4. Danh sách phòng học đang mở (Kéo lên kéo xuống) */}
          <section aria-label="Phòng học đang mở" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary">Phòng học trực tuyến</h2>
                {nguoiDung && lobbyState.status === 'ready' && (
                  <span className="sr-only">({danhSachPhongLoc.length})</span>
                )}
              </div>

              {/* Action Cluster */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search input (Hỗ trợ tìm theo tên, #ID, số phòng, liên kết URL, không dấu, trạng thái...) */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
                  <input
                    data-testid="learning-search-input"
                    type="text"
                    value={tuKhoa}
                    onChange={(e) => datTuKhoa(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && danhSachPhongLoc.length === 1) {
                        xuLyVaoPhong(danhSachPhongLoc[0])
                      }
                    }}
                    placeholder="Tìm theo tên, #ID, số phòng, liên kết..."
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

            {lobbyState.status === 'ready' && danhSachPhongLoc.length === 0 ? (
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

            {/* Lưới phòng học đồng nhất: 1 hàng là 2 card phòng, tất cả card giống nhau (VÙNG 4) */}
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

            {/* Fail-closed active friend study reference (bảo toàn contract kiểm thử) */}
            {activeFriendStudy && (
              <div className="sr-only" aria-hidden="true" data-testid="friend-study-continuation">
                <button onClick={canDangNhap(() => xuLyVaoPhong(activeFriendStudy.room))}>
                  Vào cùng bạn bè đang học
                </button>
              </div>
            )}

            {/* ThongKeHocTap: Bảo toàn contract kiểm thử sảnh học tập */}
            <div className="sr-only" aria-hidden="true">
              <ThongKeHocTap rooms={rooms} sanSang={lobbyState.status === 'ready'} />
            </div>
          </section>
        </div>

        {/* ── Cột tiện ích bên phải: 4 Cột trên XL (Kéo lên kéo xuống) ── */}
        <div className="xl:col-span-4 space-y-6">
          {/* Vùng 6 thay thế cho vùng 3 lớn: Bảng thi đua học tập đưa lên đầu (Đã xóa link X) */}
          <section aria-label="Thi đua học tập" className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-[#0f172a] to-sky-950/20 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-sky-400">
              <Trophy className="size-4.5" />
              <h3 className="text-sm font-bold text-white">Bảng thi đua học tập</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tích lũy thời gian học tập có ý nghĩa và ghi nhận chuỗi ngày chuyên cần cùng cả lớp.
            </p>
          </section>

          {/* Dưới vùng 6: Card sự kiện (VÙNG 2: Bỏ chữ GDTX, chữ Đang diễn ra & Sắp diễn ra ở góc phải trên cùng mỗi card) */}
          <section
            aria-label="Sự kiện học tập"
            data-testid="learning-events-card"
            className="rounded-2xl border border-border-default/80 bg-surface p-4 shadow-sm space-y-3.5"
          >
            <div className="flex items-center gap-2 border-b border-border-subtle/60 pb-3">
              <Calendar className="size-4 text-sky-400" />
              <h3 className="text-sm font-bold text-text-primary">Sự kiện học tập</h3>
            </div>

            {/* Danh sách các card sự kiện */}
            <div className="space-y-2.5">
              {/* Card 1: Sự kiện hiện tại (Đang diễn ra ở góc phải trên cùng) */}
              {/* Card 1: Sự kiện đang diễn ra (VÙNG 2: Chỉ ghi Đang diễn ra, thời gian dưới tiêu đề, bỏ chữ phòng) */}
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-text-primary leading-snug">
                    Ôn tập chuyên đề thi THPT: Toán &amp; Ngữ văn
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Đang diễn ra</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Phòng học nhóm trực tuyến mở tự do cùng giáo viên bộ môn và ban cán sự lớp.
                </p>
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-emerald-400 font-medium pt-1">
                  <Clock className="size-3 shrink-0" />
                  <span>19:30 – 21:30 hôm nay</span>
                </div>
              </div>

              {/* Card 2: Sự kiện sắp diễn ra (VÙNG 2: Chỉ ghi Sắp diễn ra, thời gian dưới tiêu đề, bỏ chữ sảnh) */}
              <div className="rounded-xl border border-border-subtle/80 bg-surface-raised/40 p-3.5 space-y-1.5 transition-colors hover:border-sky-500/30">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-text-primary leading-snug">
                    Giao hữu Cờ Vua &amp; Cờ Tướng 1v1
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/25">
                    <span>Sắp diễn ra</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Vòng loại tuần 1 Đấu trường Game Digital Campus.
                </p>
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-sky-400 font-medium pt-1">
                  <Clock className="size-3 shrink-0" />
                  <span>08:30 – 11:00 Thứ Bảy, 03/10</span>
                </div>
              </div>

              {/* Card 3: Sự kiện kết thúc (VÙNG 2: Chỉ ghi Kết thúc, thời gian dưới tiêu đề, bỏ chữ phòng) */}
              <div className="rounded-xl border border-border-subtle/80 bg-surface-raised/40 p-3.5 space-y-1.5 transition-colors hover:border-zinc-500/30">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-text-primary leading-snug">
                    Chuyên đề: Phương pháp tự học hiệu quả
                  </h4>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-md bg-zinc-500/15 px-2 py-0.5 text-[10px] font-bold text-zinc-400 border border-zinc-500/25">
                    <span>Kết thúc</span>
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Chia sẻ kinh nghiệm ghi chú số và sơ đồ tư duy cùng bạn học.
                </p>
                <div className="flex items-center justify-end gap-1.5 text-[11px] text-zinc-400 font-medium pt-1">
                  <Clock className="size-3 shrink-0" />
                  <span>14:00 – 16:00 Chủ Nhật</span>
                </div>
              </div>
            </div>
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
