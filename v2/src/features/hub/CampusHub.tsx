import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCampus } from '@/hooks/use-campus'
import type { NguoiDung } from '@/lib/api'
import type { PhongSanh } from '@shared/protocol/campus'
import {
  AlertTriangle,
  BookOpen,
  Gamepad2,
  GraduationCap,
  Landmark,
  LogOut,
  Radio,
  RefreshCw,
  Search,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CampusChatDrawer } from './CampusChatDrawer'
import { RoomCard } from './RoomCard'

const TEN_VAI_TRO: Record<string, string> = {
  teacher: 'Giáo viên',
  student: 'Học sinh',
  admin: 'Quản trị',
  school_admin: 'Quản trị trường',
}

function nhanVaiTro(nd: NguoiDung): string {
  if (nd.isSchoolAdmin) return 'Quản trị trường'
  if (nd.role === 'teacher' && nd.teacherPending) return 'Giáo viên (chờ duyệt)'
  return TEN_VAI_TRO[nd.role ?? ''] ?? 'Thành viên'
}

type TabPhamVi = 'tat_ca' | 'truong' | 'lop'
type NodeHub = 'tat_ca' | 'hoc_tap' | 'game' | 'sinh_hoat'

interface CampusHubProps {
  nguoiDung: NguoiDung
  onDangXuat: () => void
}

export function CampusHub({ nguoiDung, onDangXuat }: CampusHubProps) {
  const {
    trangThai,
    onlineCount,
    rooms,
    messages,
    myPermissions,
    latencyMs,
    doDoTre,
    guiChat,
    xoaChat,
    ketNoiLai,
  } = useCampus()

  const [tabPhamVi, setTabPhamVi] = useState<TabPhamVi>('tat_ca')
  const [nodeDangChon, setNodeDangChon] = useState<NodeHub>('tat_ca')
  const [tuKhoa, setTuKhoa] = useState('')

  // Thống kê động cho 3 Interactive Canvas Orbs / Hub Nodes
  const soPhongHocTap = useMemo(() => rooms.length, [rooms.length])
  const soPhongGame = 0 // Sẽ tích hợp tại Phase 4 (Đấu trường Game)
  const soPhongSinhHoat = useMemo(
    () => rooms.filter((r) => r.phamVi === 'truong').length,
    [rooms],
  )
  const tongNguoiTrongPhong = useMemo(
    () => rooms.reduce((tong, r) => tong + r.soNguoi, 0),
    [rooms],
  )

  // Lọc danh sách phòng theo tab phạm vi, node được chọn và từ khoá tìm kiếm
  const danhSachPhongLoc = useMemo(() => {
    let ketQua = rooms

    // Lọc theo phạm vi
    if (tabPhamVi === 'truong') {
      ketQua = ketQua.filter((r) => r.phamVi === 'truong')
    } else if (tabPhamVi === 'lop') {
      ketQua = ketQua.filter((r) => {
        if (nguoiDung.lopId) return r.lopId === nguoiDung.lopId
        return r.phamVi === 'lop'
      })
    }

    // Lọc theo Hub Node
    if (nodeDangChon === 'sinh_hoat') {
      ketQua = ketQua.filter((r) => r.phamVi === 'truong')
    }

    // Lọc theo từ khoá
    const q = tuKhoa.trim().toLowerCase()
    if (q) {
      ketQua = ketQua.filter((r) =>
        r.ten.toLowerCase().includes(q) ||
        (r.chuPhongTen && r.chuPhongTen.toLowerCase().includes(q)) ||
        (r.lopTen && r.lopTen.toLowerCase().includes(q)),
      )
    }

    return ketQua
  }, [rooms, tabPhamVi, nodeDangChon, tuKhoa, nguoiDung.lopId])

  const xuLyVaoPhong = (room: PhongSanh) => {
    if (room.soNguoi >= room.sucChua) {
      toast.error('Phòng học đã đầy số lượng người tham gia!')
      return
    }
    toast.info(`Phòng "${room.ten}" sẽ kích hoạt không gian âm thanh & bảng học tại Phase 2.2 / Phase 3.`)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* Header thanh điều hướng & trạng thái */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
          {/* Logo & Tiêu đề */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-bold tracking-tight">Digital Campus</span>
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary">
                  v2.1
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">GDTX Định Quán · Trung tâm kết nối thời gian thực</p>
            </div>
          </div>

          {/* Live presence indicator & User controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Trạng thái kết nối WebSocket */}
            {trangThai === 'da_ket_noi' ? (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>{onlineCount} trực tuyến</span>
              </div>
            ) : trangThai === 'dang_ket_noi' ? (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Đang kết nối…</span>
              </div>
            ) : trangThai === 'phien_bi_thay' ? (
              <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Phiên bị thay thế</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                <WifiOff className="h-3.5 w-3.5" />
                <span>Mất kết nối</span>
                <button
                  type="button"
                  onClick={ketNoiLai}
                  className="ml-1 underline hover:text-destructive-foreground"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Độ trễ RTT */}
            {trangThai === 'da_ket_noi' ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={doDoTre}
                title="Bấm để đo độ trễ RTT tới máy chủ"
              >
                <Wifi className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                {latencyMs !== null ? `${latencyMs} ms` : 'Đo ping'}
              </Button>
            ) : null}

            {/* Thông tin người dùng & Đăng xuất */}
            <div className="flex items-center gap-2 pl-1 border-l border-border/60">
              <div className="hidden sm:block text-right min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">{nguoiDung.ten || nguoiDung.username}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {nhanVaiTro(nguoiDung)}
                  {nguoiDung.lop ? ` · ${nguoiDung.lop.ten}` : ''}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs border-border/80"
                onClick={onDangXuat}
              >
                <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden xs:inline">Đăng xuất</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Zero CLS layout */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">
        {/* Banner cảnh báo nghiêm ngặt khi phiên bị thay thế (Single-device policy) */}
        {trangThai === 'phien_bi_thay' ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold">Phiên kết nối này đã bị ngắt tự động (Mã 4001)</p>
                <p className="text-xs text-muted-foreground">
                  Tài khoản của bạn vừa đăng nhập ở một thiết bị hoặc trình duyệt khác. Để bảo vệ an toàn và bảo mật, hệ thống chỉ duy trì 01 phiên hoạt động duy nhất.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs font-semibold"
              onClick={() => window.location.reload()}
            >
              Tải lại trang & Kết nối lại
            </Button>
          </div>
        ) : null}

        {/* 3 Interactive Canvas Orbs / Hub Nodes */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Khu vực chức năng sảnh">
          {/* Node 1: Học Tập */}
          <Card
            onClick={() => setNodeDangChon((prev) => (prev === 'hoc_tap' ? 'tat_ca' : 'hoc_tap'))}
            className={`cursor-pointer border transition-all hover:scale-[1.01] hover:shadow-lg ${
              nodeDangChon === 'hoc_tap'
                ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                : 'border-border/70 bg-card hover:border-primary/50'
            }`}
          >
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-inner">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">Học Tập 📚</h3>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {soPhongHocTap} phòng
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  Học nhóm, video bài giảng & trao đổi bài
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Node 2: Game */}
          <Card
            onClick={() => {
              toast.info('Đấu Trường Game (Caro, Connect 4, Reversi, 2048) sẽ ra mắt ở Phase 4!')
            }}
            className="cursor-pointer border border-border/70 bg-card transition-all hover:scale-[1.01] hover:border-emerald-500/50 hover:shadow-lg"
          >
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
                <Gamepad2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">Đấu Trường Game 🎮</h3>
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
                    {soPhongGame} phòng
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  Giao lưu trí tuệ: Caro, Cờ lật, 2048
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Node 3: Sinh Hoạt */}
          <Card
            onClick={() => setNodeDangChon((prev) => (prev === 'sinh_hoat' ? 'tat_ca' : 'sinh_hoat'))}
            className={`cursor-pointer border transition-all hover:scale-[1.01] hover:shadow-lg ${
              nodeDangChon === 'sinh_hoat'
                ? 'border-purple-500 bg-purple-500/10 shadow-md ring-1 ring-purple-500/40'
                : 'border-border/70 bg-card hover:border-purple-500/50'
            }`}
          >
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-inner">
                <Landmark className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">Sinh Hoạt 🏛️</h3>
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {soPhongSinhHoat} phòng
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                  Sảnh giao lưu chung toàn trường
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2 Cột Độc Lập (Zero CLS, items-start, self-start) */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          {/* Cột trái: Danh sách phòng học trực tuyến */}
          <div className="min-w-0 space-y-4">
            {/* Thanh điều khiển & Lọc phòng */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-3">
              {/* Tab phân loại phạm vi */}
              <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTabPhamVi('tat_ca')}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${
                    tabPhamVi === 'tat_ca' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả ({rooms.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTabPhamVi('truong')}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${
                    tabPhamVi === 'truong' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Toàn trường ({soPhongSinhHoat})
                </button>
                <button
                  type="button"
                  onClick={() => setTabPhamVi('lop')}
                  className={`rounded-md px-3 py-1 font-medium transition-colors ${
                    tabPhamVi === 'lop' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Lớp tôi
                </button>
              </div>

              {/* Tìm kiếm phòng */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={tuKhoa}
                  onChange={(e) => setTuKhoa(e.target.value)}
                  placeholder="Tìm phòng theo tên, chủ phòng…"
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {/* Chỉ số người đang trong các phòng */}
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>{tongNguoiTrongPhong} đang học nhóm</span>
              </div>
            </div>

            {/* Lưới danh sách phòng học */}
            {danhSachPhongLoc.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
                  <Radio className="h-7 w-7 opacity-60" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">Chưa có phòng học nào đang mở</h4>
                <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                  {tuKhoa
                    ? `Không tìm thấy phòng học khớp với từ khoá "${tuKhoa}". Thử xoá bộ lọc xem sao!`
                    : 'Hãy tạo phòng học đầu tiên để cùng các bạn giải đề, trao đổi bài và học tập hiệu quả.'}
                </p>
                <Button
                  size="sm"
                  className="mt-4 h-9 gap-1.5 text-xs font-semibold"
                  onClick={() => {
                    toast.info('Tính năng Tạo phòng học sẽ mở ở Phase 2.2!')
                  }}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Tạo phòng học mới
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2">
                {danhSachPhongLoc.map((room) => (
                  <RoomCard key={room.id} room={room} onVaoPhong={xuLyVaoPhong} />
                ))}
              </div>
            )}
          </div>

          {/* Cột phải: Chat toàn trường (CampusChatDrawer độc lập, Zero CLS) */}
          <aside className="w-full self-start">
            <CampusChatDrawer
              messages={messages}
              myPermissions={myPermissions}
              onSendMessage={guiChat}
              onDeleteMessage={xoaChat}
              className="h-[560px] max-h-[calc(100vh-10rem)] shadow-sm"
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
