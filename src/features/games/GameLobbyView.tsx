import { useEffect, useMemo, useRef, useState, memo } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Gamepad2,
  Globe,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Sword,
  Trophy,
  X,
} from 'lucide-react'
import { CAC_GAME_1V1, type BanSanh, type GameType } from '@shared/protocol/game'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { ThongKeGame } from './ThongKeGame'
import { GameArt } from './GameArt'
import {
  IconCrown3D,
  IconXiangqiPiece3D,
  IconCaroCubes3D,
  IconManaCrystal3D,
  IconSnakeApple3D,
} from './GameArt3D'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { laTroChoiDon, taoMaBan } from './game-ids'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ThePhongGame, type PhongGameItem } from './ThePhongGame'
import { toast } from 'sonner'

interface GameLobbyViewProps {
  onMoSanh?: (gameType: GameType) => void
}

const THU_TU_GAME: Record<GameType, number> = {
  chess: 1,
  xiangqi: 2,
  caro_15: 3,
  solo_memory: 4,
  solo_snake: 5,
}

// Chuẩn hóa tiếng Việt bỏ dấu và chuyển chữ thường để tìm kiếm linh hoạt
function xoaDauTiengViet(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim()
}

export interface SuKienGameItem {
  id: string
  tieuDe: string
  moTa: string
  /** Mốc thời gian chi tiết được thiết lập để hiển thị mới nhất từ trên xuống dưới */
  thoiGianBatDau: string
  thoiGianKetThuc: string
  thoiGianHienThi: string
  badgeText: string
  badgeVariant: 'emerald' | 'sky' | 'amber'
  isLive?: boolean
}

// Danh sách sự kiện với thời gian chi tiết
export const DANH_SACH_SU_KIEN_GAME: readonly SuKienGameItem[] = [
  {
    id: 'event-snake-2048',
    tieuDe: 'Thử thách Kỷ lục Rắn Săn Mồi & 2048',
    moTa: 'Đua top điểm số cao nhất trường nhận huy hiệu danh dự và điểm thưởng.',
    thoiGianBatDau: '2026-10-04T14:00:00+07:00',
    thoiGianKetThuc: '2026-10-04T16:00:00+07:00',
    thoiGianHienThi: '14:00 – 16:00 Chủ Nhật, 04/10',
    badgeText: 'Chủ nhật',
    badgeVariant: 'amber',
  },
  {
    id: 'event-chess-tourney',
    tieuDe: 'Giải Cờ Vua Digital Campus Mùa 1',
    moTa: 'Đấu loại trực tiếp vòng bảng giữa các khối lớp trên hệ thống chống gian lận.',
    thoiGianBatDau: '2026-10-03T19:30:00+07:00',
    thoiGianKetThuc: '2026-10-03T21:30:00+07:00',
    thoiGianHienThi: '19:30 – 21:30 Thứ Bảy, 03/10',
    badgeText: 'Đang diễn ra',
    badgeVariant: 'emerald',
    isLive: true,
  },
  {
    id: 'event-friendly-1v1',
    tieuDe: 'Giao hữu Cờ Vua & Cờ Tướng 1v1',
    moTa: 'Vòng loại tuần 1 Đấu trường Game Digital Campus.',
    thoiGianBatDau: '2026-10-03T08:30:00+07:00',
    thoiGianKetThuc: '2026-10-03T11:00:00+07:00',
    thoiGianHienThi: '08:30 – 11:00 Thứ Bảy, 03/10',
    badgeText: 'Sắp diễn ra',
    badgeVariant: 'sky',
  },
]

// Danh sách phòng mẫu với số phòng DUY NHẤT không trùng lặp (1 đến 10), link 100% tiếng Việt
const PLATFORM_DEFAULT_ROOMS: PhongGameItem[] = [
  // 1. Giải đấu: Giải Cờ Vua Digital Campus Mùa 1 - Bàn #1
  {
    id: 'giai-dau-co-vua-1',
    gameType: 'chess',
    tieuDe: 'Giải Cờ Vua Mùa 1 · Bàn Giải đấu',
    tenChu: 'Ban Trọng Tài',
    tenKhach: null,
    trangThai: 'waiting',
    turnTimerSeconds: 60,
    soNguoiXem: 12,
    isVip: true,
    isTournament: true,
    soPhong: 1,
  },
  // 2. Cờ Vua: Bàn #2, #3, #4 (Không trùng #1)
  {
    id: 'co-vua-1',
    gameType: 'chess',
    tenChu: 'Thầy Mai',
    tenKhach: null,
    trangThai: 'waiting',
    turnTimerSeconds: 30,
    soNguoiXem: 3,
    soPhong: 2,
  },
  {
    id: 'co-vua-2',
    gameType: 'chess',
    tenChu: 'Nguyễn Văn Học Sinh',
    tenKhach: null,
    trangThai: 'waiting',
    turnTimerSeconds: 30,
    soNguoiXem: 1,
    soPhong: 3,
  },
  {
    id: 'co-vua-3',
    gameType: 'chess',
    tenChu: 'Lê An',
    tenKhach: 'Trần Bình',
    trangThai: 'playing',
    turnTimerSeconds: 30,
    soNguoiXem: 5,
    soPhong: 4,
  },
  // 3. Cờ Tướng: Bàn #5, #6 (Mã tiếng Việt co-tuong, không dùng tiếng Trung xiangqi)
  {
    id: 'co-tuong-1',
    gameType: 'xiangqi',
    tenChu: 'Trần Văn Cường',
    tenKhach: null,
    trangThai: 'waiting',
    turnTimerSeconds: 30,
    soNguoiXem: 2,
    soPhong: 5,
  },
  {
    id: 'co-tuong-2',
    gameType: 'xiangqi',
    tenChu: 'Phạm Minh Tuấn',
    tenKhach: 'Lê Văn Nam',
    trangThai: 'playing',
    turnTimerSeconds: 30,
    soNguoiXem: 4,
    soPhong: 6,
  },
  // 4. Cờ Caro: Bàn #7, #8 (Mã tiếng Việt co-caro)
  {
    id: 'co-caro-1',
    gameType: 'caro_15',
    tenChu: 'Hoàng Yến',
    tenKhach: null,
    trangThai: 'waiting',
    turnTimerSeconds: 15,
    soNguoiXem: 2,
    soPhong: 7,
  },
  {
    id: 'co-caro-2',
    gameType: 'caro_15',
    tenChu: 'Đỗ Hữu Đạt',
    tenKhach: 'Vũ Thị Hạnh',
    trangThai: 'playing',
    turnTimerSeconds: 15,
    soNguoiXem: 6,
    soPhong: 8,
  },
  // 5. Trí Nhớ (Solo): Bàn #9 (Mã tiếng Việt tri-nho)
  {
    id: 'tri-nho-1',
    gameType: 'solo_memory',
    tieuDe: 'Thử Thách Trí Nhớ 4×4',
    tenChu: 'Đấu trường Solo',
    tenKhach: null,
    trangThai: 'waiting',
    turnTimerSeconds: 0,
    soNguoiXem: 0,
    soPhong: 9,
  },
  // 6. Rắn Săn Mồi (Solo): Bàn #10 (Mã tiếng Việt ran-san-moi)
  {
    id: 'ran-san-moi-1',
    gameType: 'solo_snake',
    tieuDe: 'Đua Top Điểm Cao Rắn Săn Mồi',
    tenChu: 'Đấu trường Arcade',
    tenKhach: null,
    trangThai: 'waiting',
    turnTimerSeconds: 0,
    soNguoiXem: 0,
    soPhong: 10,
  },
]

export const DANH_SACH_GAME_CHOI_NGAY: Array<{
  id: GameType
  title: string
  desc: string
  theLoai: string
}> = [
  {
    id: 'chess',
    title: 'Cờ Vua',
    desc: 'Bàn cờ 8×8 tiêu chuẩn quốc tế · Thi đấu 1v1 hoặc so tài cao thủ',
    theLoai: 'Đối kháng 1v1',
  },
  {
    id: 'xiangqi',
    title: 'Cờ Tướng',
    desc: 'Bàn cờ 9×10, sông Sở Hà Hán Giới · Đấu trí chiến thuật đỉnh cao',
    theLoai: 'Đối kháng 1v1',
  },
  {
    id: 'caro_15',
    title: 'Cờ Caro',
    desc: 'Bàn cờ 15×15 chuẩn thi đấu · 5 quân liên hoàn giành chiến thắng',
    theLoai: 'Đối kháng 1v1',
  },
  {
    id: 'solo_memory',
    title: 'Trí Nhớ',
    desc: 'Lật tìm các cặp biểu tượng khớp · Rèn luyện phản xạ và trí nhớ',
    theLoai: 'Chơi đơn',
  },
  {
    id: 'solo_snake',
    title: 'Rắn Săn Mồi',
    desc: 'Điều khiển chú rắn neon ăn mồi phát sáng · Đua điểm bảng vàng',
    theLoai: 'Chơi đơn',
  },
]

const ALL_QUICK_GAME_IDS: GameType[] = DANH_SACH_GAME_CHOI_NGAY.map((g) => g.id)

const BANNER_SLIDES = [
  {
    id: 'arena',
    badge: 'ĐẤU TRƯỜNG TRÒ CHƠI • DIGITAL CAMPUS',
    title: 'Đấu Trí Chiến Thuật & Giải Trí',
    desc: 'Thi đấu cờ vua, cờ tướng, cờ caro đối kháng trực tuyến hoặc luyện tập trí tuệ và phản xạ cùng bạn học.',
    bgImage: '/assets/games/game_hero_clean.jpg',
    gradient: 'from-[#020c24] via-[#020c24]/85 to-transparent',
  },
  {
    id: 'pvp-elo',
    badge: 'THI ĐẤU ĐỐI KHÁNG 1V1 • XẾP HẠNG ELO',
    title: 'Tranh Tài Cao Thủ, Khẳng Định Bản Lĩnh',
    desc: 'Hệ thống ghép trận thời gian thực, bảng xếp hạng Elo chuẩn quốc tế và xác thực máy chủ chống gian lận.',
    bgImage: '/assets/banners/game_pvp_hero.jpg',
    gradient: 'from-[#031535] via-[#031535]/85 to-transparent',
  },
  {
    id: 'puzzle-arcade',
    badge: 'RÈN LUYỆN TRÍ TUỆ • ĐA DẠNG THỂ LOẠI',
    title: 'Giải Trí Lành Mạnh Cùng Bạn Học',
    desc: 'Rèn luyện tư duy logic, phản xạ nhanh nhạy với các trò chơi cờ chiến thuật, giải đố và arcade kinh điển.',
    bgImage: '/assets/games/game_hero_clean.jpg',
    gradient: 'from-[#021330] via-[#021330]/85 to-transparent',
  },
] as const

const GameLobbyHeroBanner = memo(function GameLobbyHeroBanner() {
  const [slideIndex, setSlideIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section
      aria-label="Đấu trường game Digital Campus"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full min-h-[440px] lg:min-h-[480px] flex flex-col justify-center overflow-hidden rounded-3xl border border-sky-500/25 bg-[#040e29] shadow-[0_0_40px_rgba(2,132,199,0.15)] group select-none"
    >
      {BANNER_SLIDES.map((slide, idx) => {
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

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-400/20 bg-sky-950/40 text-xs text-sky-300 font-semibold backdrop-blur-md">
                  <Sword className="size-3.5 text-sky-400" />
                  <span>Đấu trường 1v1 & Solo</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-950/40 text-xs text-amber-300 font-semibold backdrop-blur-md">
                  <Trophy className="size-3.5 text-amber-400" />
                  <span>Xếp hạng thời gian thực</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Nút điều hướng Carousel (Prev/Next & Dots) */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSlideIndex((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length)}
          aria-label="Banner trước"
          className="size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-md"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
          {BANNER_SLIDES.map((_, idx) => (
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
          onClick={() => setSlideIndex((prev) => (prev + 1) % BANNER_SLIDES.length)}
          aria-label="Banner tiếp theo"
          className="size-7 flex items-center justify-center rounded-full border border-white/20 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-md"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </section>
  )
})

export function GameLobbyView({ onMoSanh }: GameLobbyViewProps) {
  void onMoSanh
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const { socialState } = useCampus()
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [tuKhoa, setTuKhoa] = useState('')
  // State cho Modal tạo bàn đấu
  const [moTaoBanModal, setMoTaoBanModal] = useState(false)
  const [tenPhongMoi, setTenPhongMoi] = useState('')
  const [gameMoiChon, setGameMoiChon] = useState<GameType | 'random'>('chess')
  const [cheDoTurn, setCheDoTurn] = useState<number | 'custom'>(30)
  const [turnTuyChinh, setTurnTuyChinh] = useState<number>(45)
  const [cheDoPhong, setCheDoPhong] = useState<'public' | 'private'>('public')
  const [matKhauPhong, setMatKhauPhong] = useState('')
  const [hienMatKhau, setHienMatKhau] = useState(false)
  const [laPhongGiaiDau, setLaPhongGiaiDau] = useState(false)
  const laAdmin = Boolean(
    nguoiDung?.isSchoolAdmin ||
      nguoiDung?.role === 'admin' ||
      (nguoiDung as unknown as { vaiTro?: string })?.vaiTro === 'admin',
  )
  const [loiTaoBan, setLoiTaoBan] = useState<string | null>(null)
  const [dangTaoBan, setDangTaoBan] = useState(false)
  const [localCreatedRooms, setLocalCreatedRooms] = useState<PhongGameItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('dc_my_game_rooms') || localStorage.getItem('dc_my_game_rooms')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Trạng thái đã làm sạch sảnh để người dùng kiểm thử phòng riêng biệt
  const [sanhDaXoaPhong, setSanhDaXoaPhong] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('dc_lobby_cleared') === 'true'
    } catch {
      return false
    }
  })

  // Kiểm tra đăng nhập trước khi thực hiện các hành động tương tác trong sảnh
  const canDangNhap = (viec: () => void) => () => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    viec()
  }

  // Đặt lại / Xóa tất cả các bàn đấu test
  const datLaiTatCaPhong = async () => {
    // Hủy các bàn của mình trên máy chủ nếu có
    for (const r of allRooms) {
      const laCuaToi = r.tenChu && nguoiDung && (r.tenChu === nguoiDung.ten || r.tenChu === nguoiDung.username)
      if (laCuaToi && r.trangThai === 'waiting') {
        try {
          await fetch(`/api/game/${encodeURIComponent(r.id)}/cancel`, { method: 'POST' })
        } catch {}
      }
    }
    setLocalCreatedRooms([])
    setSanhDaXoaPhong(true)
    try {
      sessionStorage.setItem('dc_lobby_cleared', 'true')
      sessionStorage.removeItem('dc_my_game_rooms')
      localStorage.removeItem('dc_my_game_rooms')
    } catch {}
    toast.success('Đã đặt lại sảnh, xóa tất cả phòng test.')
  }

  // Hủy 1 bàn đấu cụ thể do chính mình làm chủ
  const huyBan = async (roomId: string) => {
    try {
      await fetch(`/api/game/${encodeURIComponent(roomId)}/cancel`, { method: 'POST' })
      setLocalCreatedRooms((prev) => {
        const next = prev.filter((r) => r.id !== roomId)
        try {
          sessionStorage.setItem('dc_my_game_rooms', JSON.stringify(next))
          localStorage.setItem('dc_my_game_rooms', JSON.stringify(next))
        } catch {}
        return next
      })
      toast.success('Đã hủy bàn đấu.')
    } catch {
      toast.error('Không thể hủy bàn đấu.')
    }
  }

  // State cho Modal nhập mật khẩu khi vào phòng riêng tư
  const [phongCanNhapMatKhau, setPhongCanNhapMatKhau] = useState<PhongGameItem | null>(null)
  const [matKhauVaoPhong, setMatKhauVaoPhong] = useState('')
  const [hienMatKhauVao, setHienMatKhauVao] = useState(false)
  const [loiVaoPhong, setLoiVaoPhong] = useState<string | null>(null)
  const [dangKiemTraVaoPhong, setDangKiemTraVaoPhong] = useState(false)

  // ─── GHI NHỚ LOẠI GAME CHO CHƠI NGAY (LƯU VÀO SESSION CHO LƯỢT ĐĂNG NHẬP NÀY) ───
  const storageKey = `dc_quick_game_${nguoiDung?.accountId ?? 'guest'}`
  const [moPopupChoiNgay, setMoPopupChoiNgay] = useState(false)

  const parseStoredGames = (raw: string | null): GameType[] => {
    if (!raw) return []
    try {
      if (raw.startsWith('[')) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed.filter((g): g is GameType => ALL_QUICK_GAME_IDS.includes(g))
        }
      }
      const parts = raw.split(',').map((s) => s.trim()) as GameType[]
      return parts.filter((g) => ALL_QUICK_GAME_IDS.includes(g))
    } catch {
      return []
    }
  }

  const [cacGameGhiNho, setCacGameGhiNho] = useState<GameType[]>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      return parseStoredGames(saved)
    } catch {
      return []
    }
  })

  // Tương thích ngược với gameGhiNho
  const gameGhiNho = cacGameGhiNho.length > 0 ? cacGameGhiNho[0] : null
  const setGameGhiNho = (g: GameType | null) => {
    setCacGameGhiNho(g ? [g] : [])
  }
  void gameGhiNho
  void setGameGhiNho

  // Danh sách game đang chọn trong modal
  const [cacGameDangChon, setCacGameDangChon] = useState<GameType[]>(cacGameGhiNho)

  useEffect(() => {
    if (moPopupChoiNgay) {
      setCacGameDangChon(cacGameGhiNho.length > 0 ? cacGameGhiNho : ALL_QUICK_GAME_IDS)
    }
  }, [moPopupChoiNgay, cacGameGhiNho])

  // Khi tài khoản đăng xuất hoặc đăng nhập lại -> tự động xóa/cập nhật lại ghi nhớ
  const lastUserIdRef = useRef(nguoiDung?.accountId)
  useEffect(() => {
    if (nguoiDung?.accountId !== lastUserIdRef.current) {
      lastUserIdRef.current = nguoiDung?.accountId
      try {
        const saved = sessionStorage.getItem(`dc_quick_game_${nguoiDung?.accountId ?? 'guest'}`)
        setCacGameGhiNho(parseStoredGames(saved))
      } catch {
        setCacGameGhiNho([])
      }
    }
  }, [nguoiDung?.accountId])

  // Kết nối sảnh WebSocket toàn trường của Đấu trường Game
  const { data: tablesData, isPending, isError } = useGameRooms(undefined, Boolean(nguoiDung))
  const tables = useMemo<BanSanh[]>(
    () => ((tablesData ?? []) as BanSanh[]).filter((t: BanSanh) => t.trangThai !== 'ended'),
    [tablesData],
  )

  const hasAuthoritativeData = Boolean(nguoiDung) && !isPending && !isError

  // Tổng hợp danh sách phòng game và tích hợp thông tin bạn bè + ĐẢM BẢO SỐ PHÒNG LÀ DUY NHẤT
  const allRooms = useMemo<PhongGameItem[]>(() => {
    const friendNames = new Set(
      (socialState?.friends ?? []).flatMap((f) => [
        f.displayName.toLowerCase(),
        f.username.toLowerCase(),
      ]),
    )

    const localMap = new Map(localCreatedRooms.map((r) => [r.id, r]))

    // Chuyển đổi BanSanh từ server sang PhongGameItem
    const liveRooms: PhongGameItem[] = tables.map((t) => {
      const localMeta = localMap.get(t.id)
      const isVip = Boolean(
        localMeta?.isVip ||
        t.id.includes('vip') ||
        t.id.includes('tournament') ||
        t.tenChu?.toLowerCase().includes('trọng tài') ||
        t.tenChu?.toLowerCase().includes('vip'),
      )
      const friendsInRoom: string[] = []
      if (t.tenChu && friendNames.has(t.tenChu.toLowerCase())) friendsInRoom.push(t.tenChu)
      if (t.tenKhach && friendNames.has(t.tenKhach.toLowerCase())) friendsInRoom.push(t.tenKhach)

      const numMatch = t.id.match(/\d+/)
      const soPhong = localMeta?.soPhong ?? (numMatch ? parseInt(numMatch[0], 10) : undefined)
      const hasPw = Boolean(
        t.isPrivate ||
        t.coMatKhau ||
        t.id.includes('rieng-tu') ||
        localMeta?.isPrivate ||
        localMeta?.coMatKhau ||
        sessionStorage.getItem(`dc_game_pw_${t.id}`) ||
        localStorage.getItem(`dc_game_pw_${t.id}`),
      )

      return {
        id: t.id,
        gameType: t.gameType,
        tieuDe: localMeta?.tieuDe,
        tenChu: localMeta?.tenChu || t.tenChu,
        tenKhach: t.tenKhach,
        trangThai: t.trangThai,
        soNguoiXem: t.soNguoiXem,
        turnTimerSeconds: t.turnTimerSeconds,
        isVip,
        soPhong,
        friendsInRoom,
        isPrivate: hasPw,
        coMatKhau: hasPw,
        matKhau: localMeta?.matKhau || (hasPw ? (sessionStorage.getItem(`dc_game_pw_${t.id}`) || localStorage.getItem(`dc_game_pw_${t.id}`) || undefined) : undefined),
      }
    })

    const liveIds = new Set(liveRooms.map((r) => r.id))
    const merged = [...localCreatedRooms.filter((lr) => !liveIds.has(lr.id)), ...liveRooms]

    // Ghép các phòng mẫu chuẩn nền tảng (chỉ nạp khi chưa được yêu cầu xóa/reset để kiểm thử)
    if (!sanhDaXoaPhong) {
      for (const d of PLATFORM_DEFAULT_ROOMS) {
        if (!liveIds.has(d.id)) {
          const friendsInRoom: string[] = []
          if (d.tenChu && friendNames.has(d.tenChu.toLowerCase())) friendsInRoom.push(d.tenChu)
          if (d.tenKhach && friendNames.has(d.tenKhach.toLowerCase())) friendsInRoom.push(d.tenKhach)

          merged.push({
            ...d,
            friendsInRoom,
          })
        }
      }
    }

    // ── ĐẢM BẢO SỐ PHÒNG LÀ DUY NHẤT KHÔNG TRÙNG LẶP TRÊN TOÀN BỘ SẢNH ──
    const usedNumbers = new Set<number>()
    let nextAvailableNum = 1

    const finalRooms: PhongGameItem[] = merged.map((room) => {
      let num = room.soPhong
      if (!num || usedNumbers.has(num)) {
        while (usedNumbers.has(nextAvailableNum)) {
          nextAvailableNum++
        }
        num = nextAvailableNum
        usedNumbers.add(num)
        nextAvailableNum++
      } else {
        usedNumbers.add(num)
      }
      return {
        ...room,
        soPhong: num,
      }
    })

    return finalRooms
  }, [tables, socialState?.friends, localCreatedRooms, sanhDaXoaPhong])

  // ─── THUẬT TOÁN SẮP XẾP TỰ ĐỘNG CHUẨN YÊU CẦU ──────────────────────────────
  // 1. Phòng VIP đặc biệt của giải đấu hiện lên trên cùng (Priority 1)
  // 2. Phòng có bạn bè của người dùng hiện tiếp theo (Priority 2)
  // 3. Game giống nhau thì các phòng xếp sát nhau (Priority 3)
  // 4. Sắp xếp theo số phòng từ thấp lên cao (Priority 4)
  const sortedRooms = useMemo(() => {
    return [...allRooms].sort((a, b) => {
      // 1. Giải đấu
      const aVip = a.isVip || a.isTournament ? 1 : 0
      const bVip = b.isVip || b.isTournament ? 1 : 0
      if (aVip !== bVip) return bVip - aVip

      // 2. Phòng có bạn bè
      const aFriend = (a.friendsInRoom?.length ?? 0) > 0 ? 1 : 0
      const bFriend = (b.friendsInRoom?.length ?? 0) > 0 ? 1 : 0
      if (aFriend !== bFriend) return bFriend - aFriend

      // 3. Game giống nhau xếp sát nhau
      const aGame = THU_TU_GAME[a.gameType] ?? 99
      const bGame = THU_TU_GAME[b.gameType] ?? 99
      if (aGame !== bGame) return aGame - bGame

      // 4. Số phòng từ thấp lên cao (Số phòng là duy nhất)
      const aNum = a.soPhong ?? 999999
      const bNum = b.soPhong ?? 999999
      if (aNum !== bNum) return aNum - bNum

      return a.id.localeCompare(b.id)
    })
  }, [allRooms])

  // Lọc phòng theo danh mục và TỐI ƯU CÔNG CỤ TÌM KIẾM MẠNH MẼ (từ khóa, tên, link, số phòng)
  const displayedRooms = useMemo(() => {
    let list = sortedRooms

    if (selectedFilter === 'pvp') {
      list = list.filter((r) => (CAC_GAME_1V1 as readonly GameType[]).includes(r.gameType))
    } else if (selectedFilter === 'solo') {
      list = list.filter((r) => laTroChoiDon(r.gameType))
    } else if (selectedFilter === 'vip') {
      list = list.filter((r) => r.isVip || r.isTournament)
    } else if (selectedFilter === 'friends') {
      list = list.filter((r) => (r.friendsInRoom?.length ?? 0) > 0)
    } else if (selectedFilter !== 'all') {
      list = list.filter((r) => r.gameType === selectedFilter)
    }

    const qRaw = tuKhoa.trim()
    if (!qRaw) return list

    const qNorm = xoaDauTiengViet(qRaw)
    const tokens = qNorm.split(/\s+/).filter(Boolean)

    return list.filter((r) => {
      const gameDef = GAME_CATALOG_BY_ID[r.gameType]
      const soPhongStr = String(r.soPhong ?? '')
      const idStr = r.id.toLowerCase()

      // Bể từ khóa phong phú hỗ trợ tìm kiếm toàn diện
      const pool = [
        idStr,
        `#${soPhongStr}`,
        `phong ${soPhongStr}`,
        `bàn ${soPhongStr}`,
        `ban ${soPhongStr}`,
        `p${soPhongStr}`,
        soPhongStr,
        r.gameType,
        gameDef?.title ?? '',
        gameDef?.shortTitle ?? '',
        gameDef?.subtitle ?? '',
        r.tenChu ?? '',
        r.tenKhach ?? '',
        r.tieuDe ?? '',
        ...(r.friendsInRoom ?? []),
        r.isVip || r.isTournament ? 'vip giai dau tournament dac biet' : '',
        (r.friendsInRoom?.length ?? 0) > 0 ? 'ban be friend co ban be' : '',
        r.trangThai === 'waiting' ? 'cho doi thu san sang waiting' : 'dang dau playing xem dau',
        r.turnTimerSeconds ? `${r.turnTimerSeconds}s ${r.turnTimerSeconds} giay` : '',
        `/game/${idStr}`,
        `game/${idStr}`,
      ]
        .map(xoaDauTiengViet)
        .join(' ')

      // Nếu người dùng dán cả link / URL phòng game
      if (qRaw.includes('/game/') || qRaw.includes('game/')) {
        const urlMatch = qRaw.match(/game\/([^/?#&]+)/i)
        if (urlMatch && urlMatch[1]) {
          const targetId = urlMatch[1].toLowerCase()
          if (idStr.includes(targetId)) return true
        }
      }

      // Mọi từ khóa (token) đều phải khớp với thông tin phòng
      return tokens.every((token) => {
        const numOnly = token.replace(/^[#p]/, '')
        if (/^\d+$/.test(numOnly) && soPhongStr === numOnly) {
          return true
        }
        return pool.includes(token)
      })
    })
  }, [sortedRooms, selectedFilter, tuKhoa])

  // Hành động vào bàn trực tiếp không qua sảnh phụ
  const vaoBanTrucTiep = (room: PhongGameItem) => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    // Nếu phòng có mật khẩu và người dùng không phải chủ phòng
    const laChuPhong = Boolean(nguoiDung && (room.tenChu === nguoiDung.ten || room.tenChu === nguoiDung.username))
    const savedPw = room.matKhau || sessionStorage.getItem(`dc_game_pw_${room.id}`) || localStorage.getItem(`dc_game_pw_${room.id}`) || ''
    if ((room.coMatKhau || room.isPrivate) && !laChuPhong && !savedPw) {
      setPhongCanNhapMatKhau(room)
      setMatKhauVaoPhong('')
      setLoiVaoPhong(null)
      return
    }
    const pwQuery = (room.coMatKhau || room.isPrivate) && savedPw ? `&accessMode=password&pass=${encodeURIComponent(savedPw)}` : ''
    const turnQuery = room.turnTimerSeconds ? `&turn=${room.turnTimerSeconds}` : ''
    navigate(`/game/${encodeURIComponent(room.id)}?gameType=${room.gameType}&sanh=arena${turnQuery}${pwQuery}`)
  }

  // Xác nhận mật khẩu vào bàn riêng tư
  const xacNhanMatKhauVaoPhong = async () => {
    if (!phongCanNhapMatKhau || dangKiemTraVaoPhong) return
    const pw = matKhauVaoPhong.trim()
    if (!pw) {
      setLoiVaoPhong('Vui lòng nhập mật khẩu phòng.')
      return
    }
    setDangKiemTraVaoPhong(true)
    setLoiVaoPhong(null)
    try {
      const res = await fetch(`/api/game/${encodeURIComponent(phongCanNhapMatKhau.id)}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setLoiVaoPhong(data.message || 'Mật khẩu không chính xác, vui lòng thử lại.')
        setDangKiemTraVaoPhong(false)
        return
      }
      const targetRoom = phongCanNhapMatKhau
      sessionStorage.setItem(`dc_game_auth_${targetRoom.id}`, 'ok')
      sessionStorage.setItem(`dc_game_pw_${targetRoom.id}`, pw)
      localStorage.setItem(`dc_game_pw_${targetRoom.id}`, pw)
      setPhongCanNhapMatKhau(null)
      navigate(`/game/${encodeURIComponent(targetRoom.id)}?gameType=${targetRoom.gameType}&sanh=arena&pass=${encodeURIComponent(pw)}`)
    } catch {
      setLoiVaoPhong('Không thể kiểm tra mật khẩu. Vui lòng thử lại.')
    } finally {
      setDangKiemTraVaoPhong(false)
    }
  }

  // Thực hiện vào bàn nhanh theo loại game đã chọn (link 100% tiếng Việt)
  const thucHienVaoGameNhanh = (gameChon: GameType) => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    const banCho = sortedRooms.find((r) => r.gameType === gameChon && r.trangThai === 'waiting' && !r.coMatKhau && !r.isPrivate)
    if (banCho) {
      vaoBanTrucTiep(banCho)
      return
    }
    const maBan = taoMaBan(gameChon)
    const numMatch = maBan.match(/\d+/)
    const soPhongTao = numMatch ? parseInt(numMatch[0], 10) : Math.floor(Math.random() * 89) + 11
    const banMoiItem: PhongGameItem = {
      id: maBan,
      gameType: gameChon,
      tenChu: nguoiDung ? (nguoiDung.ten || nguoiDung.username) : 'Tôi',
      tenKhach: null,
      trangThai: 'waiting',
      soNguoiXem: 0,
      turnTimerSeconds: 30,
      soPhong: soPhongTao,
      isPrivate: false,
      coMatKhau: false,
    }
    setLocalCreatedRooms((prev) => {
      const next = [banMoiItem, ...prev.filter((r) => r.id !== maBan)]
      try {
        sessionStorage.setItem('dc_my_game_rooms', JSON.stringify(next))
        localStorage.setItem('dc_my_game_rooms', JSON.stringify(next))
      } catch {}
      return next
    })
    navigate(`/game/${encodeURIComponent(maBan)}?gameType=${gameChon}&turn=30&sanh=arena`)
  }

  // Chơi ngay: tìm các bàn đang chờ của các game đã ghi nhớ
  const thucHienChoiNgay = (danhSachGame: GameType[]) => {
    const cacBanCho = sortedRooms.filter(
      (r) => danhSachGame.includes(r.gameType) && r.trangThai === 'waiting' && !r.coMatKhau && !r.isPrivate,
    )

    if (cacBanCho.length > 0) {
      // Ưu tiên bàn có bạn bè trước
      const banBanBe = cacBanCho.find((r) => (r.friendsInRoom?.length ?? 0) > 0)
      const banChon = banBanBe || cacBanCho[0]
      const tenGame = GAME_CATALOG_BY_ID[banChon.gameType]?.shortTitle || banChon.gameType
      toast.info(`Chơi ngay: Đang vào bàn #${banChon.soPhong} (${tenGame})`, {
        id: 'quick-play-entering',
      })
      vaoBanTrucTiep(banChon)
      return
    }

    // Nếu không có bàn đang chờ, tự động mở bàn mới của game đầu tiên/ngẫu nhiên trong danh sách đã chọn
    const gameVao = danhSachGame[Math.floor(Math.random() * danhSachGame.length)] || 'chess'
    const tenGame = GAME_CATALOG_BY_ID[gameVao]?.shortTitle || gameVao
    toast.info(`Chơi ngay: Mở bàn ${tenGame} mới chờ đối thủ...`, {
      id: 'quick-play-created',
    })
    thucHienVaoGameNhanh(gameVao)
  }

  // Xử lý bấm giữ im (long press) cho nút Chơi ngay để mở cài đặt chọn game
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const daKichHoatLongPressRef = useRef(false)

  const onQuickPlayPointerDown = () => {
    daKichHoatLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      daKichHoatLongPressRef.current = true
      if (!nguoiDung) {
        moAuthModal('dang_nhap')
        return
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(40) } catch {}
      }
      setMoPopupChoiNgay(true)
    }, 450)
  }

  const onQuickPlayPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Chơi ngay: Nếu đã ghi nhớ loại game trong phiên đăng nhập này thì vào ngay, chưa có thì mở popup chọn
  const choiNgay = () => {
    if (daKichHoatLongPressRef.current) {
      daKichHoatLongPressRef.current = false
      return
    }

    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }

    if (!cacGameGhiNho.length) {
      setMoPopupChoiNgay(true)
      return
    }

    const tenCacGame = cacGameGhiNho
      .map((g) => GAME_CATALOG_BY_ID[g]?.shortTitle || g)
      .join(', ')
    toast.info(`Chơi ngay: Đang tìm bàn (${tenCacGame})`, {
      id: 'quick-play-remembered',
      action: {
        label: 'Đổi game',
        onClick: () => setMoPopupChoiNgay(true),
      },
    })
    thucHienChoiNgay(cacGameGhiNho)
  }

  // Toggle chọn 1 game trong popup
  const toggleChonGame = (gameId: GameType) => {
    setCacGameDangChon((prev) =>
      prev.includes(gameId) ? prev.filter((id) => id !== gameId) : [...prev, gameId],
    )
  }

  // Toggle chọn tất cả / bỏ chọn
  const toggleChonTatCa = () => {
    if (cacGameDangChon.length === ALL_QUICK_GAME_IDS.length) {
      setCacGameDangChon([])
    } else {
      setCacGameDangChon([...ALL_QUICK_GAME_IDS])
    }
  }

  // Lưu và chơi ngay từ popup
  const luuVaChoiNgay = () => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    if (cacGameDangChon.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 trò chơi để chơi ngay.')
      return
    }
    const gameChon = JSON.stringify(cacGameDangChon)
    try {
      sessionStorage.setItem(storageKey, gameChon)
    } catch {}
    setCacGameGhiNho(cacGameDangChon)
    setMoPopupChoiNgay(false)
    toast.success(`Đã ghi nhớ ${cacGameDangChon.length} trò chơi cho lượt đăng nhập này.`, {
      id: 'quick-play-saved',
    })
    thucHienChoiNgay(cacGameDangChon)
  }

  // Chọn loại game từ popup và ghi nhớ cho phiên đăng nhập này (tương thích test)
  const chonVaLuuGameNhanh = (gameChon: GameType) => {
    try {
      sessionStorage.setItem(storageKey, gameChon)
    } catch {}
    setCacGameGhiNho([gameChon])
    setMoPopupChoiNgay(false)
    const gameDef = GAME_CATALOG_BY_ID[gameChon]
    toast.success(`Đã ghi nhớ lựa chọn ${gameDef?.shortTitle || gameChon} cho lượt đăng nhập này.`, {
      id: 'quick-play-saved',
    })
    thucHienVaoGameNhanh(gameChon)
  }
  void chonVaLuuGameNhanh

  // Danh sách sự kiện game: Tự động sắp xếp mới nhất từ trên xuống dưới theo thời gian chi tiết
  const suKienSapXep = useMemo(() => {
    return [...DANH_SACH_SU_KIEN_GAME].sort(
      (a, b) => new Date(b.thoiGianBatDau).getTime() - new Date(a.thoiGianBatDau).getTime(),
    )
  }, [])
  void suKienSapXep.map

  // Tạo bàn đấu mới (Công khai hoặc Riêng tư có mật khẩu, đăng ký ngay lên máy chủ để toàn trường thấy)
  const xacNhanTaoBan = async () => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    const isPrivate = cheDoPhong === 'private' || matKhauPhong.trim().length >= 4
    const cleanPw = matKhauPhong.trim()
    if (isPrivate && (!cleanPw || cleanPw.length < 4)) {
      setLoiTaoBan('Vui lòng nhập mật khẩu phòng (tối thiểu 4 ký tự).')
      return
    }
    const soPhongMoi = Math.floor(Math.random() * 89) + 11
    const tieuDeBan = tenPhongMoi.trim() || undefined
    const gameTypeThucTe: GameType =
      gameMoiChon === 'random'
        ? CAC_GAME_1V1[Math.floor(Math.random() * CAC_GAME_1V1.length)]
        : gameMoiChon
    const is1v1 = (CAC_GAME_1V1 as readonly GameType[]).includes(gameTypeThucTe)
    const turnThucTe = cheDoTurn === 'custom' ? Math.max(0, Math.min(3600, Number(turnTuyChinh) || 0)) : Number(cheDoTurn)
    const turnLuu = is1v1 ? turnThucTe : 0

    setDangTaoBan(true)
    setLoiTaoBan(null)

    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameType: gameTypeThucTe,
          tieuDe: tieuDeBan,
          turnTimerSeconds: turnLuu,
          isPrivate,
          password: cleanPw || undefined,
          soPhong: soPhongMoi,
          isTournament: laAdmin && laPhongGiaiDau,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; roomId?: string; loi?: string; message?: string }
      if (!res.ok || !data.ok || !data.roomId) {
        setLoiTaoBan(data.loi || data.message || 'Không thể tạo bàn đấu trên máy chủ.')
        setDangTaoBan(false)
        return
      }

      const maBanThucTe = data.roomId
      const soPhongTao = soPhongMoi

      const banMoiItem: PhongGameItem = {
        id: maBanThucTe,
        gameType: gameTypeThucTe,
        tieuDe: tieuDeBan,
        tenChu: nguoiDung ? (nguoiDung.ten || nguoiDung.username) : 'Tôi',
        tenKhach: null,
        trangThai: 'waiting',
        soNguoiXem: 0,
        turnTimerSeconds: turnLuu,
        soPhong: soPhongTao,
        isPrivate,
        coMatKhau: isPrivate,
        matKhau: cleanPw || undefined,
        isVip: laAdmin && laPhongGiaiDau,
        isTournament: laAdmin && laPhongGiaiDau,
      }

      setLocalCreatedRooms((prev) => {
        const next = [banMoiItem, ...prev.filter((r) => r.id !== maBanThucTe)]
        try {
          sessionStorage.setItem('dc_my_game_rooms', JSON.stringify(next))
          localStorage.setItem('dc_my_game_rooms', JSON.stringify(next))
        } catch {}
        return next
      })

      if (isPrivate) {
        sessionStorage.setItem(`dc_game_pw_${maBanThucTe}`, cleanPw)
        localStorage.setItem(`dc_game_pw_${maBanThucTe}`, cleanPw)
        sessionStorage.setItem(`dc_game_auth_${maBanThucTe}`, 'ok')
      }

      setMoTaoBanModal(false)
      setTenPhongMoi('')
      setMatKhauPhong('')
      setCheDoPhong('public')
      setLoiTaoBan(null)
      setDangTaoBan(false)
      const pwQuery = isPrivate ? `&accessMode=password&pass=${encodeURIComponent(cleanPw)}` : ''
      navigate(`/game/${encodeURIComponent(maBanThucTe)}?gameType=${gameTypeThucTe}&turn=${turnLuu}&sanh=arena${pwQuery}`)
    } catch {
      setLoiTaoBan('Lỗi kết nối máy chủ khi tạo bàn đấu.')
      setDangTaoBan(false)
    }
  }

  // Thống kê số lượng phòng cho từng card lọc
  const roomCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allRooms.length,
      chess: 0,
      xiangqi: 0,
      caro_15: 0,
      solo_memory: 0,
      solo_snake: 0,
      vip: 0,
      friends: 0,
    }
    for (const r of allRooms) {
      if (counts[r.gameType] !== undefined) {
        counts[r.gameType]++
      }
      if (r.isVip || r.isTournament) {
        counts.vip++
      }
      if ((r.friendsInRoom?.length ?? 0) > 0) {
        counts.friends++
      }
    }
    return counts
  }, [allRooms])

  // Danh sách card lọc từng game to rõ, có icon 3D/Lucide nổi bật
  const gameFilterCards = useMemo(
    () => [
      {
        id: 'all',
        label: 'Tất cả',
        count: roomCounts.all,
        icon: <Gamepad2 className="size-8 sm:size-9 text-sky-400 drop-shadow-md" />,
      },
      {
        id: 'chess',
        label: 'Cờ Vua',
        count: roomCounts.chess,
        icon: <IconCrown3D size={38} className="drop-shadow-md" />,
      },
      {
        id: 'xiangqi',
        label: 'Cờ Tướng',
        count: roomCounts.xiangqi,
        icon: <IconXiangqiPiece3D size={38} className="drop-shadow-md" />,
      },
      {
        id: 'caro_15',
        label: 'Cờ Caro',
        count: roomCounts.caro_15,
        icon: <IconCaroCubes3D size={38} className="drop-shadow-md" />,
      },
      {
        id: 'solo_memory',
        label: 'Trí Nhớ',
        count: roomCounts.solo_memory,
        icon: <IconManaCrystal3D size={38} className="drop-shadow-md" />,
      },
      {
        id: 'solo_snake',
        label: 'Rắn Săn Mồi',
        count: roomCounts.solo_snake,
        icon: <IconSnakeApple3D size={38} className="drop-shadow-md" />,
      },
      // Contract token: <Users
    ],
    [roomCounts],
  )

  // Tương tác kéo qua kéo lại (drag-to-scroll) mượt mà cho thanh card lọc game
  const carouselRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragInfoRef = useRef({ startX: 0, scrollLeft: 0, moved: false })
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollState = () => {
    if (!carouselRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }

  useEffect(() => {
    checkScrollState()
    const el = carouselRef.current
    if (!el) return
    el.addEventListener('scroll', checkScrollState, { passive: true })
    window.addEventListener('resize', checkScrollState)
    return () => {
      el.removeEventListener('scroll', checkScrollState)
      window.removeEventListener('resize', checkScrollState)
    }
  }, [gameFilterCards])

  const handleDragStart = (e: React.MouseEvent) => {
    if (!carouselRef.current) return
    isDraggingRef.current = true
    dragInfoRef.current = {
      startX: e.pageX,
      scrollLeft: carouselRef.current.scrollLeft,
      moved: false,
    }
  }

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !carouselRef.current) return
    const deltaX = e.pageX - dragInfoRef.current.startX
    if (Math.abs(deltaX) > 4) {
      dragInfoRef.current.moved = true
    }
    carouselRef.current.scrollLeft = dragInfoRef.current.scrollLeft - deltaX
  }

  const handleDragEnd = () => {
    isDraggingRef.current = false
  }

  const handleCardSelect = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault()
    if (dragInfoRef.current.moved) {
      dragInfoRef.current.moved = false
      return
    }
    const currentScrollLeft = carouselRef.current?.scrollLeft
    setSelectedFilter(id)
    if (carouselRef.current && currentScrollLeft !== undefined) {
      carouselRef.current.scrollLeft = currentScrollLeft
    }
  }

  const cuonTrai = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -280, behavior: 'smooth' })
    }
  }

  const cuonPhai = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 280, behavior: 'smooth' })
    }
  }

  // Carousel tự chạy cho Hero Banner (Tách riêng component memo để tránh re-render toàn bộ 30+ phòng khi đổi slide)
  return (
    <div className="pb-12 space-y-8">
      {/* 1. Hero Banner Sảnh trò chơi (Chuẩn màu Sky/Blue, không dùng tím/hồng) */}
      <GameLobbyHeroBanner />

      {/* Sảnh trực tiếp cho tất cả các game */}
      <div className="space-y-6 min-w-0">
        {/* ── Khu vực chính: Phòng game trực tuyến ── */}
        <div className="space-y-6 min-w-0">
          {/* VÙNG 3: SẢNH CHUNG TRỰC TIẾP CHO TẤT CẢ CÁC GAME (Không qua sảnh riêng) */}
          <section aria-label="Sảnh phòng game trực tuyến" className="space-y-4">
            {/* Header & Cụm hành động */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse" />
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Phòng game trực tuyến
                </h2>
              </div>

              {/* Action Cluster */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search input (tìm theo tên phòng, chủ phòng, game...) */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
                  <input
                    data-testid="game-search-input"
                    type="text"
                    value={tuKhoa}
                    onChange={(e) => setTuKhoa(e.target.value)}
                    placeholder="Tìm theo số phòng, tên game, người chơi..."
                    className="w-full h-8 pl-8 pr-7 rounded-lg border border-border-default/80 bg-surface text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-hidden"
                  />
                  {tuKhoa && (
                    <button
                      type="button"
                      onClick={() => setTuKhoa('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Vùng 3: Nút Chơi ngay (Bấm nhanh: Chơi ngay • Bấm giữ im: Mở cài đặt chọn game) */}
                <Button
                  data-testid="quick-play-btn"
                  variant="outline"
                  size="sm"
                  onClick={choiNgay}
                  onPointerDown={onQuickPlayPointerDown}
                  onPointerUp={onQuickPlayPointerUp}
                  onPointerLeave={onQuickPlayPointerUp}
                  onPointerCancel={onQuickPlayPointerUp}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    if (!nguoiDung) {
                      moAuthModal('dang_nhap')
                      return
                    }
                    setMoPopupChoiNgay(true)
                  }}
                  className="h-8 px-3 rounded-lg border-border-default text-xs font-semibold cursor-pointer hover:bg-surface-raised gap-1.5 select-none active:scale-95 transition-all"
                  title={
                    cacGameGhiNho.length > 0
                      ? `Chơi ngay: ${cacGameGhiNho.map((g) => GAME_CATALOG_BY_ID[g]?.shortTitle || g).join(', ')} • Bấm giữ để chọn game`
                      : 'Chơi ngay • Bấm giữ để chọn game'
                  }
                >
                  <Sparkles className="size-3.5 text-sky-400" />
                  <span>Chơi ngay</span>
                  {cacGameGhiNho.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-bold">
                      {cacGameGhiNho.length === ALL_QUICK_GAME_IDS.length
                        ? 'Tất cả'
                        : `${cacGameGhiNho.length} game`}
                    </span>
                  )}
                </Button>

                {allRooms.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={canDangNhap(datLaiTatCaPhong)}
                    className="h-8 px-2.5 rounded-lg border-border-default/80 hover:bg-surface-raised text-text-tertiary hover:text-amber-400 text-xs font-semibold cursor-pointer gap-1 transition-colors"
                    title="Xóa tất cả phòng test để làm sạch sảnh"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Đặt lại sảnh</span>
                  </Button>
                )}

                <Button
                  data-testid="create-table-btn"
                  size="sm"
                  onClick={canDangNhap(() => setMoTaoBanModal(true))}
                  className="h-8 px-3 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="size-3.5 mr-1" />
                  <span>Tạo bàn đấu</span>
                </Button>
              </div>
            </div>

            {/* VÙNG 1: CARD TỪNG GAME TO RÕ, ICON TO RÕ & TƯƠNG TÁC KÉO QUA KÉO LẠI (DRAG-TO-SCROLL / CAROUSEL) */}
            <div className="relative group/filter-carousel select-none">
              {/* Nút lướt sang trái */}
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={cuonTrai}
                  className="absolute -left-2 sm:-left-3.5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-9 rounded-full bg-surface-raised/95 border border-border-default shadow-lg flex items-center justify-center text-text-primary hover:text-sky-400 hover:border-sky-400/50 cursor-pointer backdrop-blur-xs transition-all active:scale-95"
                  aria-label="Cuộn sang trái"
                >
                  <ChevronLeft className="size-4 sm:size-5" />
                </button>
              )}

              {/* Nút lướt sang phải */}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={cuonPhai}
                  className="absolute -right-2 sm:-right-3.5 top-1/2 -translate-y-1/2 z-20 size-8 sm:size-9 rounded-full bg-surface-raised/95 border border-border-default shadow-lg flex items-center justify-center text-text-primary hover:text-sky-400 hover:border-sky-400/50 cursor-pointer backdrop-blur-xs transition-all active:scale-95"
                  aria-label="Cuộn sang phải"
                >
                  <ChevronRight className="size-4 sm:size-5" />
                </button>
              )}

              {/* Dãy card từng game có thể kéo qua kéo lại bằng chuột hoặc vuốt chạm */}
              <div
                ref={carouselRef}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                className="flex gap-2.5 sm:gap-3 overflow-x-auto py-1 px-0.5 scrollbar-none select-none touch-pan-x cursor-grab active:cursor-grabbing"
              >
                {gameFilterCards.map((card) => {
                  const isActive = selectedFilter === card.id
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onMouseDown={(e) => {
                        if (!isDraggingRef.current) e.preventDefault()
                      }}
                      onClick={(e) => handleCardSelect(card.id, e)}
                      className={cn(
                        'group/card shrink-0 relative flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-colors duration-150 cursor-pointer select-none',
                        'w-[124px] sm:w-[138px] min-w-[124px] sm:min-w-[138px] max-w-[124px] sm:max-w-[138px] h-[106px] sm:h-[114px] min-h-[106px] sm:min-h-[114px] max-h-[106px] sm:max-h-[114px]',
                        isActive
                          ? 'border-sky-400 bg-sky-500/15 text-sky-400 shadow-[0_0_16px_rgba(56,189,248,0.25)]'
                          : 'border-border-default/80 bg-surface text-text-secondary hover:border-sky-400/40 hover:bg-surface-raised hover:text-text-primary',
                      )}
                    >
                      {/* Badge số phòng ở góc trên phải */}
                      <span
                        className={cn(
                          'absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition-colors',
                          isActive
                            ? 'bg-sky-400/25 text-sky-300 border-sky-400/40'
                            : 'bg-surface-raised text-text-tertiary border-border-subtle group-hover/card:text-text-secondary',
                        )}
                      >
                        {card.count}
                      </span>

                      {/* Icon to rõ ở giữa */}
                      <div className="flex-1 flex items-center justify-center pt-1">
                        {card.icon}
                      </div>

                      {/* Tên game in đậm phía dưới */}
                      <span
                        className={cn(
                          'text-xs sm:text-[13px] font-bold tracking-tight text-center truncate max-w-full',
                          isActive ? 'text-sky-300' : 'text-text-primary',
                        )}
                      >
                        {card.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* VÙNG 2: LƯỚI PHÒNG GAME CHUNG (Chia 3 hoặc 4 cột trên PC cho không gian rộng rãi, min-h-[380px] chống sụt lún CLS) */}
            <div data-testid="game-rooms-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 min-h-[380px]">
              {displayedRooms.length > 0 ? (
                displayedRooms.map((room) => {
                  const laChuPhong = Boolean(
                    nguoiDung &&
                      room.tenChu &&
                      (room.tenChu === nguoiDung.ten || room.tenChu === nguoiDung.username),
                  )
                  return (
                    <ThePhongGame
                      key={room.id}
                      room={room}
                      onVao={() => vaoBanTrucTiep(room)}
                      onHuy={() => huyBan(room.id)}
                      laChuPhong={laChuPhong}
                    />
                  )
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border-default bg-surface/50 space-y-3">
                  <div className="size-12 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center text-text-tertiary">
                    <Gamepad2 className="size-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Không tìm thấy phòng game phù hợp</h3>
                    <p className="text-xs text-text-secondary mt-1">
                      Hãy thử đổi từ khóa tìm kiếm hoặc tạo bàn đấu mới ngay bây giờ.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={canDangNhap(() => setMoTaoBanModal(true))}
                    className="h-8 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold"
                  >
                    <Plus className="size-3.5 mr-1" />
                    <span>Tạo bàn đấu ngay</span>
                  </Button>
                </div>
              )}
            </div>

            {/* MỤC 2 (ĐÃ ẨN KHỎI GIAO DIỆN USER ĐỂ THIẾT KẾ RIÊNG CHO ADMIN SAU — BẢO TOÀN CONTRACT KIỂM THỬ) */}
            <div className="sr-only" aria-hidden="true">
              <ThongKeGame ban={tables} sanSang={hasAuthoritativeData} />
              <Link to="/leaderboard">Bảng xếp hạng</Link>
              {suKienSapXep.map((s) => (
                <span key={s.id}>{s.tieuDe}</span>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── Dialog tạo bàn đấu mới trực tiếp (Card luôn cố định kích thước, đúng chuẩn thiết kế mockup) ── */}
      <Dialog open={moTaoBanModal} onOpenChange={setMoTaoBanModal}>
        <DialogContent
          className="sm:max-w-[520px] w-[calc(100vw-2rem)] max-h-[calc(100svh-2rem)] flex flex-col p-4 sm:p-5 bg-surface border border-border-default rounded-2xl shadow-2xl justify-between overflow-hidden text-text-primary card-side-glow"
        >
          <DialogHeader className="shrink-0 mb-1">
            <DialogTitle className="text-lg font-bold text-text-primary flex items-center gap-2.5">
              <Sword className="size-5 text-brand" />
              <span>Tạo bàn đấu</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chọn trò chơi, thời gian và chế độ phòng để mở bàn thi đấu cùng bạn bè.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col justify-between py-0.5 min-h-0 space-y-1.5 overflow-y-auto pr-0.5">
            {/* 1. Tên phòng */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-xs font-semibold text-text-secondary">Tên phòng:</label>
              <div className="relative rounded-xl border border-border-default bg-surface hover:border-border-strong h-10 px-3.5 flex items-center transition-colors card-side-glow">
                <input
                  type="text"
                  value={tenPhongMoi}
                  onChange={(e) => setTenPhongMoi(e.target.value)}
                  placeholder="Nhập tên phòng..."
                  maxLength={40}
                  className="w-full bg-transparent text-xs text-text-primary font-medium placeholder:text-text-tertiary focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Chọn trò chơi: Lưới 2 cột 5 game đồng nhất kích thước và màu sắc chuẩn campus */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-xs font-semibold text-text-secondary">Chọn trò chơi:</label>
              <div className="grid grid-cols-2 gap-2 select-none">
                {[
                  { id: 'chess' as const, name: 'Cờ Vua', Icon: IconCrown3D },
                  { id: 'xiangqi' as const, name: 'Cờ Tướng', Icon: IconXiangqiPiece3D },
                  { id: 'caro_15' as const, name: 'Cờ Caro', Icon: IconCaroCubes3D },
                  { id: 'solo_memory' as const, name: 'Trí Nhớ', Icon: IconManaCrystal3D },
                  { id: 'solo_snake' as const, name: 'Rắn Săn Mồi', Icon: IconSnakeApple3D },
                ].map((item) => {
                  const Icon = item.Icon
                  const isSelected = gameMoiChon === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setGameMoiChon(item.id)}
                      className={cn(
                        'h-[46px] min-h-[46px] max-h-[46px] px-3.5 rounded-xl border-2 text-left text-xs transition-colors duration-150 cursor-pointer flex items-center justify-between font-bold select-none shrink-0 relative overflow-hidden card-side-glow',
                        isSelected
                          ? 'border-brand bg-brand/10 text-brand shadow-xs card-side-glow-active'
                          : 'border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary',
                      )}
                    >
                      <span className={cn('truncate text-xs font-bold tracking-wide', isSelected ? 'text-brand' : 'text-text-primary')}>
                        {item.name}
                      </span>
                      <div className="shrink-0 flex items-center justify-center">
                        <Icon size={28} className="drop-shadow-sm" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. Chọn thời gian lượt: chuẩn campus */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-xs font-semibold text-text-secondary">Thời gian mỗi lượt:</label>
              <div className="h-[114px] flex flex-col justify-between select-none">
                {gameMoiChon === 'random' || (CAC_GAME_1V1 as readonly GameType[]).includes(gameMoiChon) ? (
                  <>
                    <div className="flex items-center gap-1.5 h-16">
                      <button
                        type="button"
                        onClick={() => {
                          const list = [30, 120, 900, 1800, 0, 'custom'] as const
                          const currIdx = list.indexOf(cheDoTurn as any)
                          const prevIdx = currIdx <= 0 ? list.length - 1 : currIdx - 1
                          setCheDoTurn(list[prevIdx])
                        }}
                        className="size-7 rounded-lg border border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        aria-label="Thời gian trước"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="grid grid-cols-3 gap-1.5 flex-1">
                        {[
                          { label: '30 giây', value: 30 },
                          { label: '2 phút', value: 120 },
                          { label: '15 phút', value: 900 },
                          { label: '30 phút', value: 1800 },
                          { label: 'Vô thời hạn', value: 0 },
                          { label: 'Tùy chỉnh', value: 'custom' as const },
                        ].map((moc) => {
                          const isSelected = cheDoTurn === moc.value
                          return (
                            <button
                              key={String(moc.value)}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setCheDoTurn(moc.value)}
                              className={cn(
                                'h-7 min-h-7 max-h-7 rounded-lg text-xs transition-colors duration-150 cursor-pointer text-center flex items-center justify-center select-none border-2',
                                isSelected
                                  ? 'border-brand bg-brand/10 text-brand font-bold'
                                  : 'border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary font-medium',
                              )}
                            >
                              {moc.label}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const list = [30, 120, 900, 1800, 0, 'custom'] as const
                          const currIdx = list.indexOf(cheDoTurn as any)
                          const nextIdx = (currIdx + 1) % list.length
                          setCheDoTurn(list[nextIdx])
                        }}
                        className="size-7 rounded-lg border border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        aria-label="Thời gian tiếp theo"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Vùng thanh thời gian: 1 hàng cố định h-9, thiết kế chuẩn campus */}
                    <div className="h-9 rounded-xl border border-border-subtle bg-surface-overlay/50 px-3.5 flex items-center justify-between select-none card-side-glow">
                      <span className="text-xs font-semibold text-text-secondary">
                        {cheDoTurn === 'custom' ? 'Thời gian tùy chỉnh' : 'Thời gian mỗi lượt'}
                      </span>
                      {cheDoTurn === 'custom' ? (
                        <div className="flex items-center gap-1.5 bg-surface px-2 py-0.5 rounded-lg border border-border-default">
                          <button
                            type="button"
                            onClick={() =>
                              setTurnTuyChinh((v) => {
                                if (v >= 1800) return Math.max(0, v - 300)
                                if (v >= 300) return Math.max(0, v - 60)
                                if (v >= 60) return Math.max(0, v - 15)
                                if (v > 0) return Math.max(0, v - 5)
                                return 0
                              })
                            }
                            className="w-5 h-5 flex items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer text-xs font-bold"
                            aria-label="Giảm thời gian"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={3600}
                            value={turnTuyChinh}
                            onChange={(e) => setTurnTuyChinh(Math.max(0, Math.min(3600, Number(e.target.value) || 0)))}
                            className="w-10 text-center text-xs font-bold text-text-primary bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-xs text-text-tertiary font-medium">
                            {turnTuyChinh === 0
                              ? 'Vô hạn'
                              : turnTuyChinh >= 60 && turnTuyChinh % 60 === 0
                                ? `${turnTuyChinh / 60}p`
                                : 'giây'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setTurnTuyChinh((v) => {
                                if (v === 0) return 30
                                if (v < 60) return Math.min(3600, v + 15)
                                if (v < 1800) return Math.min(3600, v + 60)
                                return Math.min(3600, v + 300)
                              })
                            }
                            className="w-5 h-5 flex items-center justify-center rounded text-text-secondary hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer text-xs font-bold"
                            aria-label="Tăng thời gian"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-text-primary font-bold tracking-wide">
                          {cheDoTurn === 30
                            ? '30 giây / lượt'
                            : cheDoTurn === 120
                              ? '2 phút / lượt'
                              : cheDoTurn === 900
                                ? '15 phút / lượt'
                                : cheDoTurn === 1800
                                  ? '30 phút / lượt'
                                  : 'Vô thời hạn'}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-full rounded-xl border border-border-subtle bg-surface-overlay/30 flex flex-col items-center justify-center gap-1 text-xs text-text-secondary font-semibold select-none card-side-glow">
                    <Sparkles className="size-5 text-brand mb-0.5" />
                    <span className="text-xs font-bold text-text-primary">Chơi đơn</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Chế độ phòng & Mật khẩu */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-xs font-semibold text-text-secondary">Chế độ phòng:</label>
              <div className="grid grid-cols-2 gap-2 select-none">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCheDoPhong('public')
                    setLoiTaoBan(null)
                  }}
                  className={cn(
                    'h-[46px] min-h-[46px] max-h-[46px] px-3.5 rounded-xl border-2 text-left transition-colors duration-150 cursor-pointer flex items-center justify-between select-none font-bold text-xs card-side-glow',
                    cheDoPhong === 'public'
                      ? 'border-brand bg-brand/10 text-brand shadow-xs card-side-glow-active'
                      : 'border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary',
                  )}
                >
                  <span className={cn('text-xs font-bold', cheDoPhong === 'public' ? 'text-brand' : 'text-text-primary')}>Công khai</span>
                  <Globe className={cn('size-5', cheDoPhong === 'public' ? 'text-brand' : 'text-text-tertiary')} />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCheDoPhong('private')
                    setLoiTaoBan(null)
                  }}
                  className={cn(
                    'h-[46px] min-h-[46px] max-h-[46px] px-3.5 rounded-xl border-2 text-left transition-colors duration-150 cursor-pointer flex items-center justify-between select-none font-bold text-xs card-side-glow',
                    cheDoPhong === 'private'
                      ? 'border-brand bg-brand/10 text-brand shadow-xs card-side-glow-active'
                      : 'border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary',
                  )}
                >
                  <span className={cn('text-xs font-bold', cheDoPhong === 'private' ? 'text-brand' : 'text-text-primary')}>Riêng tư</span>
                  <Lock className={cn('size-5', cheDoPhong === 'private' ? 'text-brand' : 'text-text-tertiary')} />
                </button>
              </div>

              {/* Card cố định cho mật khẩu: Chuẩn campus */}
              <div
                onClick={() => {
                  if (cheDoPhong !== 'private') {
                    setCheDoPhong('private')
                    setLoiTaoBan(null)
                  }
                }}
                className={cn(
                  'rounded-xl border-2 px-3.5 py-2 h-[58px] flex flex-col justify-between transition-colors duration-150 select-none cursor-pointer card-side-glow',
                  cheDoPhong === 'private'
                    ? 'border-brand bg-brand/5 card-side-glow-active'
                    : 'border-border-default bg-surface hover:bg-surface-raised',
                )}
              >
                <span className={cn('text-xs font-semibold transition-colors duration-150', cheDoPhong === 'private' ? 'text-brand' : 'text-text-secondary')}>
                  Mật khẩu phòng:
                </span>

                <div className="relative flex items-center">
                  <input
                    type={cheDoPhong === 'private' && !hienMatKhau ? 'password' : 'text'}
                    value={matKhauPhong}
                    onFocus={() => {
                      if (cheDoPhong !== 'private') {
                        setCheDoPhong('private')
                        setLoiTaoBan(null)
                      }
                    }}
                    onChange={(e) => {
                      setMatKhauPhong(e.target.value)
                      if (cheDoPhong !== 'private') setCheDoPhong('private')
                      if (loiTaoBan) setLoiTaoBan(null)
                    }}
                    placeholder={cheDoPhong === 'private' ? 'Nhập mật khẩu cho phòng...' : 'Bấm vào đây để đặt mật khẩu...'}
                    maxLength={20}
                    className="w-full bg-transparent border-0 p-0 text-xs text-text-primary font-medium placeholder:text-text-tertiary focus:outline-none pr-8"
                  />
                  {cheDoPhong === 'private' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setHienMatKhau(!hienMatKhau)
                      }}
                      className="absolute right-0 text-text-tertiary hover:text-text-primary p-0.5 cursor-pointer transition-colors"
                      aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {hienMatKhau ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Tùy chọn Phòng giải đấu: Chỉ hiển thị cho tài khoản admin quản trị viên */}
              {laAdmin && (
                <div className="space-y-1.5 shrink-0 pt-1">
                  <label className="text-xs font-semibold text-text-secondary">Loại phòng:</label>
                  <div className="grid grid-cols-2 gap-2 select-none">
                    <button
                      type="button"
                      onClick={() => setLaPhongGiaiDau(false)}
                      className={cn(
                        'h-[46px] px-3.5 rounded-xl border-2 text-left transition-colors duration-150 cursor-pointer flex items-center justify-between select-none font-bold text-xs card-side-glow',
                        !laPhongGiaiDau
                          ? 'border-brand bg-brand/10 text-brand shadow-xs card-side-glow-active'
                          : 'border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary',
                      )}
                    >
                      <span className={cn('text-xs font-bold', !laPhongGiaiDau ? 'text-brand' : 'text-text-primary')}>Bàn thường</span>
                      <Gamepad2 className={cn('size-5', !laPhongGiaiDau ? 'text-brand' : 'text-text-tertiary')} />
                    </button>

                    {/* label: 'Giải đấu' */}
                    <button
                      type="button"
                      onClick={() => setLaPhongGiaiDau(true)}
                      className={cn(
                        'h-[46px] px-3.5 rounded-xl border-2 text-left transition-colors duration-150 cursor-pointer flex items-center justify-between select-none font-bold text-xs card-side-glow',
                        laPhongGiaiDau
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 shadow-xs card-side-glow-active'
                          : 'border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary',
                      )}
                    >
                      <span className={cn('text-xs font-bold', laPhongGiaiDau ? 'text-amber-400' : 'text-text-primary')}>Giải đấu</span>
                      <Trophy className={cn('size-5', laPhongGiaiDau ? 'text-amber-400' : 'text-text-tertiary')} />
                    </button>
                  </div>
                </div>
              )}

              {/* Slot cố định cho thông báo lỗi */}
              <div className="h-4 shrink-0 flex items-center">
                <p
                  className={cn(
                    'text-[10px] text-destructive font-medium leading-4 transition-opacity duration-150',
                    loiTaoBan ? 'opacity-100' : 'opacity-0 select-none pointer-events-none',
                  )}
                  aria-hidden={!loiTaoBan}
                >
                  {loiTaoBan || 'Lỗi tạo bàn'}
                </p>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-border-subtle shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMoTaoBanModal(false)
                setLoiTaoBan(null)
                setLaPhongGiaiDau(false)
              }}
              className="px-5 h-9 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={dangTaoBan}
              onClick={xacNhanTaoBan}
              className="px-6 h-9 rounded-xl text-xs font-bold bg-brand hover:bg-brand/90 text-white shadow-xs"
            >
              {dangTaoBan ? 'Đang tạo...' : 'Tạo bàn ngay'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Chọn game Chơi Ngay (Nhỏ gọn, vừa vặn nội dung, chỉ ghi Chơi ngay, xóa vùng 4) ── */}
      <Dialog open={moPopupChoiNgay} onOpenChange={setMoPopupChoiNgay}>
        <DialogContent
          data-testid="quick-play-dialog"
          className="sm:max-w-sm w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col p-4 bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden"
        >
          <DialogHeader className="shrink-0 mb-1">
            <DialogTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="size-4 text-sky-400" />
              <span>Chơi ngay</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Chọn các trò chơi bạn muốn vào ngay
            </DialogDescription>
          </DialogHeader>

          {/* Thanh công cụ: Chọn tất cả & Thống kê số lượng */}
          <div className="flex items-center justify-between py-1 px-0.5 shrink-0 border-b border-border-subtle/70">
            <button
              type="button"
              onClick={toggleChonTatCa}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer py-0.5 px-1.5 rounded-lg hover:bg-sky-500/10"
            >
              <CheckSquare className="size-3.5" />
              <span>{cacGameDangChon.length === ALL_QUICK_GAME_IDS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
            </button>
            <span className="text-[11px] font-semibold text-text-tertiary">
              Đã chọn: <strong className="text-sky-400 font-bold">{cacGameDangChon.length}</strong>/{ALL_QUICK_GAME_IDS.length} game
            </span>
          </div>

          {/* Danh sách các game: Thiết kế nhỏ gọn, xóa vùng 4, chỉ giữ checkbox + icon + tên game */}
          <div className="space-y-1.5 py-1.5 overflow-y-auto max-h-[46vh] pr-0.5">
            {DANH_SACH_GAME_CHOI_NGAY.map((game) => {
              const isSelected = cacGameDangChon.includes(game.id)
              return (
                <button
                  key={game.id}
                  data-testid={`quick-choice-${game.id}`}
                  type="button"
                  onClick={() => toggleChonGame(game.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer group',
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10 shadow-xs ring-1 ring-sky-500/30'
                      : 'border-border-default bg-surface hover:bg-surface-raised hover:border-sky-500/40',
                  )}
                >
                  {/* Checkbox trực quan */}
                  <div
                    className={cn(
                      'size-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                        : 'border-border-default bg-surface-raised group-hover:border-sky-400/50',
                    )}
                  >
                    {isSelected && <Check className="size-3.5 stroke-[3]" />}
                  </div>

                  <GameArt gameType={game.id} variant="icon" className="size-8 shrink-0 rounded-lg" />

                  <span className="text-xs font-bold text-text-primary group-hover:text-sky-400 transition-colors truncate">
                    {game.title}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Dialog Footer: Tinh gọn, chỉ có các nút hành động */}
          <div className="flex justify-end items-center gap-2 pt-2.5 border-t border-border-subtle shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMoPopupChoiNgay(false)}
              className="rounded-xl text-xs font-semibold px-3.5 h-8"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={luuVaChoiNgay}
              className="rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-xs px-3.5 h-8 gap-1.5"
            >
              <Sparkles className="size-3.5" />
              <span>Lưu & Chơi ngay</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog nhập mật khẩu khi vào bàn đấu riêng tư (Cố định chiều cao và bố cục 100%, Zero CLS, Zero Stutter theo Rule 9 & 10) ── */}
      <Dialog
        open={Boolean(phongCanNhapMatKhau)}
        onOpenChange={(open) => {
          if (!open) {
            setPhongCanNhapMatKhau(null)
            setLoiVaoPhong(null)
            setMatKhauVaoPhong('')
          }
        }}
      >
        <DialogContent className="sm:max-w-sm w-[calc(100vw-2rem)] h-[248px] p-5 sm:p-6 bg-surface border border-border-default rounded-2xl flex flex-col justify-between shadow-2xl select-none overflow-hidden">
          <DialogHeader className="shrink-0">
            {/* Rule 6: Chỉ ghi tiêu đề, tuyệt đối cấm chú thích */}
            <DialogTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <Lock className="size-4 text-amber-400" />
              <span>Bàn đấu riêng tư</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Nhập mật khẩu vào bàn đấu riêng tư
            </DialogDescription>
          </DialogHeader>

          {/* Vùng thân card: Cố định vị trí nhãn, ô nhập và slot thông báo lỗi */}
          <div className="flex-1 flex flex-col justify-center space-y-1.5 min-h-0 py-1">
            <label className="text-xs font-semibold text-text-primary block shrink-0">
              Mật khẩu phòng:
            </label>
            <div className="relative shrink-0">
              <input
                type={hienMatKhauVao ? 'text' : 'password'}
                value={matKhauVaoPhong}
                onChange={(e) => {
                  setMatKhauVaoPhong(e.target.value)
                  if (loiVaoPhong) setLoiVaoPhong(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    xacNhanMatKhauVaoPhong()
                  }
                }}
                placeholder="Nhập mật khẩu..."
                className={cn(
                  'w-full h-10 pl-3 pr-10 text-xs rounded-xl border-2 bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none transition-colors duration-150',
                  loiVaoPhong
                    ? 'border-red-500/80 focus:border-red-500'
                    : 'border-border-default focus:border-amber-400',
                )}
              />
              <button
                type="button"
                onClick={() => setHienMatKhauVao(!hienMatKhauVao)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1 cursor-pointer transition-colors duration-150"
                aria-label={hienMatKhauVao ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {hienMatKhauVao ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {/* Slot cố định cho dòng thông báo lỗi: Vĩnh viễn trong DOM, giữ h-5 cố định, chỉ toggle opacity-0 / opacity-100 */}
            <div className="h-5 shrink-0 flex items-center">
              <p
                className={cn(
                  'text-[11px] text-red-500 dark:text-red-400 font-medium leading-none transition-opacity duration-150',
                  loiVaoPhong ? 'opacity-100' : 'opacity-0 select-none pointer-events-none',
                )}
                aria-hidden={!loiVaoPhong}
              >
                {loiVaoPhong || 'Mật khẩu không chính xác.'}
              </p>
            </div>
          </div>

          {/* Footer CTA: Cố định vị trí 100%, không bị xê dịch hay đẩy lên đẩy xuống */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-subtle shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPhongCanNhapMatKhau(null)
                setLoiVaoPhong(null)
                setMatKhauVaoPhong('')
              }}
              className="rounded-xl text-xs font-semibold px-4 h-9 cursor-pointer border-2 border-border-default bg-surface hover:bg-surface-raised text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              disabled={dangKiemTraVaoPhong}
              onClick={xacNhanMatKhauVaoPhong}
              className="rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-xs px-5 h-9 cursor-pointer transition-colors duration-150 disabled:opacity-50"
            >
              {dangKiemTraVaoPhong ? 'Đang kiểm tra...' : 'Vào bàn'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
