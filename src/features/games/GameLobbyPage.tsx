// Sảnh của một trò chơi (/arena/:gameType): sảnh chơi chuyên biệt cho từng trò.
// Trò 1v1: Chơi ngay · Tạo phòng · Tìm bàn · Danh sách bàn online đang mở.
// Trò chơi đơn: Chỉ duy nhất Chơi ngay, không tạo phòng giả, không danh sách bàn rỗng.

import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { LogIn, Plus, Search } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { KhungTrongSanh, SanhHoatDong } from '@/components/lobby/SanhHoatDong'
import { cn } from '@/lib/utils'
import { useGameRooms } from '../../hooks/use-game-rooms'
import { toast } from 'sonner'
import { GameArt } from './GameArt'
import { mauNhanTroChoi } from './mau-tro-choi'
import { GAME_CATALOG_BY_ID, type GameDefinition } from './game-catalog'
import { laTroChoiDon, taoMaBan } from './game-ids'
import { TheBanGame } from './TheBanGame'
import { ThongKeGame } from './ThongKeGame'

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
  // Sảnh cũ đã được gỡ bỏ hoàn toàn, chuyển hướng toàn bộ sang sảnh chung duy nhất /arena
  void SanhTroChoi
  return <Navigate to="/arena" replace />
}

function SanhTroChoi({ gameType }: { gameType: GameType }) {
  const navigate = useNavigate()
  const { nguoiDung, moAuthModal } = usePhien()
  const game = GAME_CATALOG_BY_ID[gameType]
  const laDon = laTroChoiDon(gameType)

  // Danh sách bàn chỉ dành cho người đã đăng nhập (máy chủ trả 401 cho khách).
  const coDanhSach = Boolean(nguoiDung)
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
  void laAdminToanQuyen

  return (
    <>
      <SanhHoatDong
        testId="game-lobby"
        tieuDe={game.shortTitle}
        bieuTuong={<GameArt gameType={gameType} variant="icon" className="size-full" />}
        quayLai={{ nhan: 'Tất cả trò chơi', toi: '/arena' }}
        hero={<SanhGameHero game={game} gameType={gameType} />}
        thongKe={<ThongKeGame gameType={gameType} ban={tatCaBan} sanSang={coDanhSach && !isPending && !isError} />}
        choiNgay={{ nhan: 'Chơi ngay', onClick: choiNgay, testId: 'game-lobby-play-now' }}
        taoPhong={
          laDon
            ? undefined
            : {
                nhan: 'Tạo phòng',
                onClick: canDangNhap(() => setMoTaoPhong(true)),
                testId: 'game-lobby-create',
              }
        }
        timKiem={!laDon && coDanhSach ? { giaTri: tuKhoa, onDoi: setTuKhoa, goiY: 'Tìm bàn…' } : undefined}
        noiDungGiua={laDon ? <NoiDungSolo game={game} /> : undefined}
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
                    hoatHinh
                    mauHaoQuang={mauNhanTroChoi(gameType)}
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
                  <KhungTrongSanh
                    testId="game-lobby-empty"
                    hinh={<AnhTroChoi gameType={gameType} />}
                    hoatHinh
                    mauHaoQuang={mauNhanTroChoi(gameType)}
                    tieuDe="Chưa có bàn nào đang mở"
                  />
                ),
                children: banLoc.map((t) => <TheBanGame key={t.id} ban={t} onVao={() => vaoBan(t.id)} />),
              }
        }
      />

      {/* Tạo phòng đối kháng: chọn thời gian mỗi lượt rồi mở bàn mới */}
      {!laDon && (
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
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setTurnSeconds(s)}
                    className={cn(
                      'h-10 min-h-10 max-h-10 rounded-xl border-2 text-sm font-semibold transition-colors duration-150 cursor-pointer select-none',
                      turnSeconds === s
                        ? 'border-brand bg-brand/15 text-brand'
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
      )}
    </>
  )
}

/** Hero riêng cho từng trò chơi — nhận diện đậm nét theo hình ảnh & thể loại trò chơi. */
function SanhGameHero({ game, gameType }: { game: GameDefinition; gameType: GameType }) {
  const laDon = laTroChoiDon(gameType)
  const nhanLoai = laDon ? 'Chơi đơn' : 'Đối kháng 1v1'
  const nhanKichThuoc = game.boardLabel ? `${nhanLoai} · Bàn ${game.boardLabel}` : nhanLoai

  return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border-default bg-surface p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-6 -top-6 -bottom-6 w-1/2 opacity-20 dark:opacity-25 overflow-hidden select-none">
        <img src={game.cover} alt="" className="size-full object-cover object-center" />
      </div>
      <div className="relative max-w-xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-raised px-2.5 py-1 text-xs font-semibold text-brand">
            <span className="size-5 overflow-hidden rounded-sm inline-block">
              <GameArt gameType={gameType} variant="icon" className="size-full" />
            </span>
            {game.shortTitle}
          </span>
          <span className="rounded-md border border-border-subtle bg-surface-raised px-2 py-1 text-xs font-medium text-text-secondary">
            {nhanKichThuoc}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {game.title}
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
          {game.description}
        </p>
      </div>
    </div>
  )
}

/** Giao diện trung tâm cho trò chơi đơn: không bàn, không danh sách rỗng, sử dụng thông tin danh mục thật. */
function NoiDungSolo({ game }: { game: GameDefinition }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-sm space-y-4">
        <div className="mx-auto size-32 overflow-hidden rounded-2xl border border-border-default bg-surface-raised shadow-sm">
          <img src={game.cover} alt="" className="size-full object-cover" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-text-primary">{game.shortTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{game.description}</p>
        </div>

        {game.boardLabel && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-3 py-1 text-xs font-medium text-text-secondary">
            Bàn {game.boardLabel}
          </div>
        )}
      </div>
    </div>
  )
}

/** Biểu tượng trò chơi cho khung trống của sảnh: riêng hình quân, không ô nền, không viền (khung trống lo phần hoạt hình). */
function AnhTroChoi({ gameType }: { gameType: GameType }) {
  return (
    <div className="size-24 drop-shadow-[0_8px_18px_rgb(0_0_0/0.45)]">
      <GameArt gameType={gameType} variant="glyph" className="size-full" />
    </div>
  )
}
