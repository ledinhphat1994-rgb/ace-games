// Sảnh của một trò chơi (/arena/:gameType): mọi bàn đang mở + Chơi ngay · Tạo phòng · Vào phòng · Tìm phòng.
// Dùng mẫu sảnh chung (SanhHoatDong) như trang Học tập. Trò chơi đơn không có bàn: chỉ Chơi ngay + bảng xếp hạng.

import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { LogIn, Play, Plus, Search } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SanhHoatDong } from '@/components/lobby/SanhHoatDong'
import { cn } from '@/lib/utils'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { toast } from 'sonner'
import { GameArenaLeaderboard } from './GameArenaLeaderboard'
import { GameArt } from './GameArt'
import { GameSocialSidebar } from './GameSocialSidebar'
import { GAME_CATALOG_BY_ID } from './game-catalog'
import { laTroChoiDon, phanTichMaBan, taoMaBan } from './game-ids'
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
  const [moVaoPhong, setMoVaoPhong] = useState(false)
  const [maNhap, setMaNhap] = useState('')
  const [loiMa, setLoiMa] = useState('')

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

  const xacNhanVaoPhong = () => {
    const kq = phanTichMaBan(maNhap)
    if (!kq.ok) {
      setLoiMa(kq.loi)
      return
    }
    setMoVaoPhong(false)
    vaoBan(kq.maBan)
  }

  const chiSo = coDanhSach
    ? [
        { nhan: 'Số bàn', giaTri: tatCaBan.length },
        {
          nhan: 'Người chơi',
          giaTri: tatCaBan.reduce((tong, t) => tong + (t.tenChu ? 1 : 0) + (t.tenKhach ? 1 : 0), 0),
          mau: 'text-emerald-400',
        },
        { nhan: 'Người xem', giaTri: tatCaBan.reduce((tong, t) => tong + (t.soNguoiXem ?? 0), 0), mau: 'text-cyan-400' },
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
        vaoPhong={
          laDon
            ? undefined
            : {
                nhan: 'Vào phòng',
                onClick: canDangNhap(() => {
                  setMaNhap('')
                  setLoiMa('')
                  setMoVaoPhong(true)
                }),
                testId: 'game-lobby-join',
              }
        }
        timKiem={coDanhSach ? { giaTri: tuKhoa, onDoi: setTuKhoa, goiY: 'Tìm theo tên người chơi hoặc mã bàn…' } : undefined}
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
                  <KhungTrong
                    testId="game-lobby-login"
                    tieuDe="Đăng nhập để xem bàn đang mở"
                    nut={{ nhan: 'Đăng nhập', icon: <LogIn />, onClick: () => moAuthModal('dang_nhap') }}
                  />
                ) : tuKhoa.trim() ? (
                  <KhungTrong
                    testId="game-lobby-search-empty"
                    icon={<Search className="size-5 text-text-tertiary" />}
                    tieuDe={`Không có bàn nào khớp với “${tuKhoa.trim()}”`}
                    nut={{ nhan: 'Xóa tìm kiếm', onClick: () => setTuKhoa(''), phu: true }}
                  />
                ) : (
                  <KhungTrong
                    testId="game-lobby-empty"
                    tieuDe="Chưa có bàn nào đang mở"
                    nut={{ nhan: 'Tạo bàn đầu tiên', icon: <Plus />, onClick: () => setMoTaoPhong(true) }}
                  />
                ),
                children: (
                  <div data-testid="game-lobby-tables" className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-[1800px]:grid-cols-3">
                    {banLoc.map((t) => (
                      <TheBanGame key={t.id} ban={t} onVao={() => vaoBan(t.id)} />
                    ))}
                  </div>
                ),
              }
        }
        noiDungGiua={
          laDon ? (
            <div
              className="overflow-hidden rounded-2xl border border-border-subtle bg-surface"
              data-testid="game-lobby-solo"
            >
              <div className="aspect-[16/7] w-full overflow-hidden border-b border-white/5 bg-black/40">
                <GameArt gameType={gameType} className="size-full object-cover" />
              </div>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-relaxed text-text-secondary">{game.description}</p>
                <Button onClick={choiNgay} className="h-10 shrink-0 px-6 font-bold">
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

      {/* Vào phòng: dán mã bàn hoặc link bàn bạn gửi */}
      <Dialog open={moVaoPhong} onOpenChange={setMoVaoPhong}>
        <DialogContent className="max-w-sm" data-testid="game-lobby-join-dialog">
          <DialogTitle>Vào phòng</DialogTitle>
          <DialogDescription className="sr-only">Nhập mã bàn hoặc link bàn</DialogDescription>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              xacNhanVaoPhong()
            }}
            className="space-y-2"
          >
            <Input
              value={maNhap}
              onChange={(e) => {
                setMaNhap(e.target.value)
                setLoiMa('')
              }}
              placeholder="Mã bàn hoặc link bàn"
              aria-label="Mã bàn hoặc link bàn"
              autoComplete="off"
              className="h-10"
              data-testid="game-lobby-join-input"
            />
            {loiMa && (
              <p role="alert" className="text-xs text-destructive">
                {loiMa}
              </p>
            )}
            <Button type="submit" className="h-10 w-full font-bold" disabled={!maNhap.trim()}>
              Vào phòng
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

function KhungTrong({
  testId,
  icon,
  tieuDe,
  nut,
}: {
  testId: string
  icon?: React.ReactNode
  tieuDe: string
  nut: { nhan: string; icon?: React.ReactNode; onClick: () => void; phu?: boolean }
}) {
  return (
    <div
      data-testid={testId}
      className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface px-6 py-10 text-center"
    >
      {icon}
      <h3 className={cn('text-base font-semibold tracking-tight text-text-primary', icon && 'mt-3')}>{tieuDe}</h3>
      <Button variant={nut.phu ? 'outline' : 'default'} size={nut.phu ? 'sm' : 'default'} onClick={nut.onClick} className="mt-5">
        {nut.icon}
        {nut.nhan}
      </Button>
    </div>
  )
}
