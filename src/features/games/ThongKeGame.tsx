// Thống kê nhanh của sảnh Game cho Quản trị trường — đổ số liệu vào mẫu chung ThongKeNhanh.
// Đang diễn ra: bàn trên sảnh thời gian thực. Hôm nay / 7 ngày: lịch sử D1 (/api/admin/thong-ke-sanh).
// Không có gameType: mọi trò chơi (trang Game); có gameType: riêng sảnh trò đó.

import { Eye, LayoutGrid, Swords, Users } from 'lucide-react'
import type { BanSanh, GameType } from '@shared/protocol/game'
import { ThongKeNhanh, type BangThongKe, type NhomThongKe } from '@/components/lobby/ThongKeNhanh'
import { nhanNgay } from '@/components/lobby/ngay-thong-ke'
import { useThongKeGame } from '@/hooks/use-thong-ke-sanh'
import { GAME_CATALOG, GAME_CATALOG_BY_ID } from './game-catalog'
import { laTroChoiDon } from './game-ids'

interface ThongKeGameProps {
  gameType?: GameType
  /** Bàn chưa kết thúc trên sảnh. */
  ban: BanSanh[]
  /** Danh sách bàn đã tải xong (chưa xong thì không hiện số 0 giả). */
  sanSang: boolean
}

const soNguoiNgoi = (t: BanSanh) => (t.tenChu ? 1 : 0) + (t.tenKhach ? 1 : 0)

export function ThongKeGame({ gameType, ban, sanSang }: ThongKeGameProps) {
  const { laQuanTri, data, isPending, isError, refetch } = useThongKeGame(gameType)
  if (!laQuanTri) return null

  const coBan = !gameType || !laTroChoiDon(gameType)
  const lichSu = data && !isError ? data : null
  const tieuDe = gameType ? GAME_CATALOG_BY_ID[gameType].shortTitle : 'Game'

  const nhom: NhomThongKe[] = [
    ...(coBan
      ? [
          {
            tieuDe: 'Đang diễn ra',
            trucTiep: true,
            chiSo: [
              { icon: LayoutGrid, nhan: 'Bàn mở', giaTri: sanSang ? ban.length : null, mau: 'text-brand' },
              { icon: Users, nhan: 'Đang chơi', giaTri: sanSang ? ban.reduce((t, b) => t + soNguoiNgoi(b), 0) : null, mau: 'text-emerald-400' },
              { icon: Eye, nhan: 'Đang xem', giaTri: sanSang ? ban.reduce((t, b) => t + (b.soNguoiXem ?? 0), 0) : null, mau: 'text-cyan-400' },
            ],
          },
        ]
      : []),
    {
      tieuDe: 'Hôm nay',
      chiSo: [
        { icon: Swords, nhan: 'Ván', giaTri: lichSu?.tongHomNay.van ?? null, mau: 'text-amber-400' },
        { icon: Users, nhan: 'Người chơi', giaTri: lichSu?.tongHomNay.nguoiChoi ?? null, mau: 'text-violet-400' },
      ],
    },
    {
      tieuDe: '7 ngày',
      chiSo: [
        { icon: Swords, nhan: 'Ván', giaTri: lichSu?.tong7Ngay.van ?? null, mau: 'text-amber-400' },
        { icon: Users, nhan: 'Người chơi', giaTri: lichSu?.tong7Ngay.nguoiChoi ?? null, mau: 'text-violet-400' },
      ],
    },
  ]

  const bang: BangThongKe[] = []
  if (!gameType) {
    const moiTro = new Map(lichSu?.theoTroChoi.map((t) => [t.gameType, t]))
    const cho = (v: number | undefined) => (lichSu ? (v ?? 0) : '…')
    bang.push({
      tieuDe: 'Theo trò chơi',
      cot: ['Trò chơi', 'Bàn mở', 'Đang chơi', 'Đang xem', 'Ván hôm nay', 'Ván 7 ngày', 'Người chơi 7 ngày'],
      dong: GAME_CATALOG.map((g) => {
        const banTro = ban.filter((b) => b.gameType === g.id)
        const don = laTroChoiDon(g.id)
        const t = moiTro.get(g.id)
        return {
          khoa: g.id,
          nhan: g.shortTitle,
          giaTri: [
            don ? '–' : banTro.length,
            don ? '–' : banTro.reduce((s, b) => s + soNguoiNgoi(b), 0),
            don ? '–' : banTro.reduce((s, b) => s + (b.soNguoiXem ?? 0), 0),
            cho(t?.homNay.van),
            cho(t?.bayNgay.van),
            cho(t?.bayNgay.nguoiChoi),
          ],
        }
      }),
      rong: 'Chưa có trò chơi',
    })
  } else if (coBan) {
    bang.push({
      tieuDe: 'Bàn đang mở',
      cot: ['Chủ bàn', 'Khách', 'Trạng thái', 'Người xem', 'Mỗi lượt'],
      dong: ban.map((b) => ({
        khoa: b.id,
        nhan: b.tenChu ?? 'Ẩn danh',
        giaTri: [b.tenKhach ?? '–', b.trangThai === 'waiting' ? 'Chờ đối thủ' : 'Đang đấu', b.soNguoiXem ?? 0, `${b.turnTimerSeconds}s`],
      })),
      rong: 'Chưa có bàn nào đang mở',
    })
  }
  if (lichSu) {
    bang.push({
      tieuDe: 'Theo ngày',
      cot: ['Ngày', 'Ván', 'Người chơi'],
      dong: [...lichSu.theoNgay].reverse().map((d) => ({
        khoa: d.ngay,
        nhan: nhanNgay(d.ngay, lichSu.homNay),
        giaTri: [d.van, d.nguoiChoi],
      })),
      rong: 'Chưa có số liệu',
    })
  }

  return (
    <ThongKeNhanh
      testId="thong-ke-game"
      tieuDe={tieuDe}
      nhom={nhom}
      homNay={lichSu?.homNay}
      bieuDo={
        lichSu
          ? [
              { tieuDe: 'Ván mỗi ngày', mau: 'bg-amber-400/80', diem: lichSu.theoNgay.map((d) => ({ ngay: d.ngay, giaTri: d.van })) },
              {
                tieuDe: 'Người chơi mỗi ngày',
                mau: 'bg-violet-400/80',
                diem: lichSu.theoNgay.map((d) => ({ ngay: d.ngay, giaTri: d.nguoiChoi })),
              },
            ]
          : undefined
      }
      bang={bang}
      dangTai={isPending}
      loi={isError}
      onThuLai={() => void refetch()}
    />
  )
}
