// Sảnh của một trò chơi (/arena/:gameType): mọi bàn đang mở + Chơi ngay · Tạo phòng · Tìm phòng.
// Dùng mẫu sảnh chung (SanhHoatDong) như trang Học tập. Vào bàn của bạn: bấm link bàn được chia sẻ.
// Trò chơi đơn không có bàn: chỉ Chơi ngay + bảng xếp hạng.

import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Eye, LayoutGrid, LogIn, Play, Plus, Search, Users } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { KhungTrongSanh, SanhHoatDong } from '@/components/lobby/SanhHoatDong'
import { cn } from '@/lib/utils'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { toast } from 'sonner'
import { GameArenaLeaderboard } from './GameArenaLeaderboard'
import { GameArt } from './GameArt'
import { GameSocialSidebar } from './GameSocialSidebar'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { laTroChoiDon, taoMaBan } from './game-ids'
import { TheBanGame } from './TheBanGame'

const THOI_GIAN_LUOT = [15, 30, 60] as const

/** Bàn đang chờ lên trước, rồi bàn đông người xem, rồi bàn mới cập nhật. */
function xepBan(a: BanSanh, b: BanSanh) {
  const uuTien = (t: BanSanh) => (t.trangThai === 'waiting' ? 0 : 1)
  return uuTien(a) - uuTien(b) || b.soNguoiXem - a.soNguoiXem || b.capNhatLuc - a.capNhatLuc
}

/** Tìm không phân biệt hoa thường / dấu: "tuan" khớp "Tuấn". */
const chuanHoa = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()

export function GameLobbyPage() {
  const { gameType } = useParams<{ gameType: string }>()
  const game = gameType ? GAME_CATALOG_BY_ID[gameType as GameType] : undefined
  if (!game) return <Navigate to="/arena" replace />
  return <SanhTroChoi key={game.id} gameType={game.id} />
}

function SanhTroChoi({ gameType }: { gameType: GameType }) {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const game = GAME_CATALOG_BY_ID[gameType]
  const laDon = laTroChoiDon(gameType)

  // Danh sách bàn chỉ dành cho người đã đăng nhập (máy chủ trả 401 cho khách); trò chơi đơn không có bàn.
  const coDanhSach = Boolean(nguoiDung) && !laDon
  const { data, isPending, isError, refetch } = useGameRooms(gameType, coDanhSach)
  const tatCaBan = useMemo(
    () => ((data ?? []) as BanSanh[]).filter((t) => t.gameType === gameType && t.trangThai !== 'ended').sort(xepBan),
    [data, gameType],
  )

  const [tuKhoa, setTuKhoa] = useState('')
  const banLoc = useMemo(() => {
    const k = chuanHoa(tuKhoa.trim())
    if (!k) return tatCaBan
    return tatCaBan.filter((t) => chuanHoa(`${t.tenChu ?? ''} ${t.tenKhach ?? ''} ${t.id}`).includes(k))
  }, [tatCaBan, tuKhoa])

  const [moTaoPhong, setMoTaoPhong] = useState(false)
  const [turnSeconds, setTurnSeconds] = useState<number>(30)

  // Vào bàn từ sảnh: kèm ?sanh= để rời bàn thì quay về đúng sảnh này.
  const vaoBan = (id: string) => navigate(`/game/${encodeURIComponent(id)}?sanh=${gameType}`)
  const taoBan = (luot: number) => navigate(`/game/${encodeURIComponent(taoMaBan(gameType))}?gameType=${gameType}&turn=${luot}`)

  // Chơi ngay: trò đơn mở phiên riêng; trò đối kháng vào bàn đang chờ đông người xem nhất, không có thì mở bàn mới.
  const choiNgay = () => {
    if (laDon) {
      taoBan(0)
      return
    }
    if (!nguoiDung) {
      taoBan(30)
      toast.info('Bạn đang chơi với máy — đăng nhập để đấu online với bạn bè.', {
        id: 'khach-choi-voi-may',
        action: { label: 'Đăng nhập', onClick: () => moAuthModal('dang_nhap') },
      })
      return
    }
    const banCho = tatCaBan.filter((t) => t.trangThai === 'waiting').sort((a, b) => b.soNguoiXem - a.soNguoiXem)[0]
    if (banCho) vaoBan(banCho.id)
    else taoBan(30)
  }

  const canDangNhap = (viec: () => void) => () => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    viec()
  }

  const laAdminToanQuyen = Boolean(
    nguoiDung && (nguoiDung.isSchoolAdmin || nguoiDung.role === 'admin' || nguoiDung.username === 'ledinhphat'),
  )

  const chiSo = coDanhSach && laAdminToanQuyen
    ? [
        { icon: LayoutGrid, nhan: 'Số bàn', giaTri: tatCaBan.length, mau: 'text-brand' },
        {
          icon: Users,
          nhan: 'Người chơi',
          giaTri: tatCaBan.reduce((tong, t) => tong + (t.tenChu ? 1 : 0) + (t.tenKhach ? 1 : 0), 0),
          mau: 'text-emerald-400',
        },
        { icon: Eye, nhan: 'Người xem', giaTri: tatCaBan.reduce((tong, t) => tong + (t.soNguoiXem ?? 0), 0), mau: 'text-cyan-400' },
      ]
    : undefined

  return (
    <>
      <SanhHoatDong
        testId="game-lobby"
        tieuDe={game.shortTitle}
        bieuTuong={<GameArt gameType={gameType} variant="icon" className="size-full" />}
        quayLai={{ nhan: 'Tất cả trò chơi', toi: '/arena' }}
        chiSo={chiSo}
        choiNgay={{ nhan: 'Chơi ngay', onClick: choiNgay, testId: 'game-lobby-play-now' }}
        taoPhong={
          laDon ? undefined : { nhan: 'Tạo phòng', onClick: canDangNhap(() => setMoTaoPhong(true)), testId: 'game-lobby-create' }
        }
        timKiem={coDanhSach ? { giaTri: tuKhoa, onDoi: setTuKhoa, goiY: 'Tìm bàn…' } : undefined}
        danhSach={
          laDon
            ? undefined
            : {
                tieuDe: 'Bàn đang mở',
                soLuong: coDanhSach ? banLoc.length : undefined,
                trangThai: coDanhSach && isPending ? 'dang_tai' : coDanhSach && isError ? 'dang_ket_noi_lai' : 'san_sang',
                onKetNoiLai: () => void refetch(),
                rong: banLoc.length === 0,
                noiDungRong: !nguoiDung ? (
                  <KhungTrongSanh
                    testId="game-lobby-login"
                    hinh={<AnhTroChoi gameType={gameType} />}
                    tieuDe="Đăng nhập để xem bàn đang mở"
                    nut={{ nhan: 'Đăng nhập', icon: <LogIn />, onClick: () => moAuthModal('dang_nhap') }}
                  />
                ) : tuKhoa.trim() ? (
                  <KhungTrongSanh
                    testId="game-lobby-search-empty"
                    hinh={<Search className="size-6 text-text-tertiary" />}
                    tieuDe="Không tìm thấy bàn"
                    nut={{ nhan: 'Xóa tìm kiếm', onClick: () => setTuKhoa(''), phu: true }}
                  />
                ) : (
                  <KhungTrongSanh testId="game-lobby-empty" hinh={<AnhTroChoi gameType={gameType} />} tieuDe="Chưa có bàn nào đang mở" />
                ),
                children: banLoc.map((t) => <TheBanGame key={t.id} ban={t} onVao={() => vaoBan(t.id)} />),
              }
        }
        noiDungGiua={
          laDon ? (
            <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03]" data-testid="game-lobby-solo">
              <div className="min-h-0 flex-1 overflow-hidden bg-black/40">
                <GameArt gameType={gameType} className="size-full object-cover" />
              </div>
              <div className="flex shrink-0 justify-center p-4">
                <Button onClick={choiNgay} className="h-11 rounded-xl px-8 font-bold shadow-lg shadow-brand/25">
                  <Play className="fill-current" />
                  Chơi ngay
                </Button>
              </div>
            </div>
          ) : undefined
        }
        cotTrai={<GameArenaLeaderboard defaultGame={gameType} />}
        cotPhai={<GameSocialSidebar coChatPhong={false} />}
      />

      {/* Tạo phòng: chọn thời gian mỗi lượt rồi mở bàn mới */}
      <Dialog open={moTaoPhong} onOpenChange={setMoTaoPhong}>
        <DialogContent className="max-w-sm" data-testid="game-lobby-create-dialog">
          <DialogTitle className="flex items-center gap-2">
            <span className="size-6 overflow-hidden rounded-md">
              <GameArt gameType={gameType} variant="icon" className="size-full" />
            </span>
            Tạo bàn {game.shortTitle}
          </DialogTitle>
          <DialogDescription className="sr-only">Chọn thời gian mỗi lượt rồi mở bàn mới</DialogDescription>
          <div className="space-y-2">
            <p className="text-xs font-medium text-text-secondary">Thời gian mỗi lượt</p>
            <div className="grid grid-cols-3 gap-2">
              {THOI_GIAN_LUOT.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={turnSeconds === s}
                  onClick={() => setTurnSeconds(s)}
                  className={cn(
                    'h-10 rounded-xl border text-sm font-semibold transition-colors',
                    turnSeconds === s
                      ? 'border-brand/60 bg-brand/15 text-brand'
                      : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                  )}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>
          <Button
            className="mt-2 h-10 w-full font-bold"
            onClick={() => {
              setMoTaoPhong(false)
              taoBan(turnSeconds)
            }}
            data-testid="game-lobby-create-confirm"
          >
            <Plus />
            Mở bàn
          </Button>
        </DialogContent>
      </Dialog>

    </>
  )
}

/** Ảnh trò chơi nhỏ cho khung trống của sảnh. */
function AnhTroChoi({ gameType }: { gameType: GameType }) {
  return (
    <div className="size-20 overflow-hidden rounded-2xl opacity-80 ring-1 ring-white/10">
      <GameArt gameType={gameType} variant="icon" className="size-full" />
    </div>
  )
}
