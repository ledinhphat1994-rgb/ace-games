// Thống kê nhanh của sảnh Học tập cho Quản trị trường — đổ số liệu vào mẫu chung ThongKeNhanh.
// Đang diễn ra: phòng trên sảnh thời gian thực. Hôm nay / 7 ngày: lịch sử D1 (/api/admin/thong-ke-sanh).

import { BookOpenCheck, Clock, DoorOpen, GraduationCap, Users } from 'lucide-react'
import type { PhongSanh } from '@shared/protocol/campus'
import { MON_HOC } from '@shared/rooms/constants'
import { ThongKeNhanh, type BangThongKe, type NhomThongKe } from '@/components/lobby/ThongKeNhanh'
import { nhanNgay } from '@/components/lobby/ngay-thong-ke'
import { useThongKeHocTap } from '@/hooks/use-thong-ke-sanh'

interface ThongKeHocTapProps {
  rooms: PhongSanh[]
  /** Sảnh đã có ảnh chụp đầu tiên (chưa có thì không hiện số 0 giả). */
  sanSang: boolean
}

const TEN_MON = new Map<string, string>(MON_HOC.map((m) => [m.id, m.ten]))

export function ThongKeHocTap({ rooms, sanSang }: ThongKeHocTapProps) {
  const { laQuanTri, data, isPending, isError, refetch } = useThongKeHocTap()
  if (!laQuanTri) return null

  const lichSu = data && !isError ? data : null
  const dangHoc = rooms.reduce((t, r) => t + r.soNguoi, 0)

  const nhom: NhomThongKe[] = [
    {
      tieuDe: 'Đang diễn ra',
      trucTiep: true,
      chiSo: [
        { icon: DoorOpen, nhan: 'Phòng mở', giaTri: sanSang ? rooms.length : null, mau: 'text-brand' },
        { icon: Users, nhan: 'Đang học', giaTri: sanSang ? dangHoc : null, mau: 'text-success' },
      ],
    },
    {
      tieuDe: 'Hôm nay',
      chiSo: [
        { icon: GraduationCap, nhan: 'Người học', giaTri: lichSu?.tongHomNay.nguoiHoc ?? null, mau: 'text-sky-400' },
        { icon: BookOpenCheck, nhan: 'Buổi học', giaTri: lichSu?.tongHomNay.buoiHoc ?? null, mau: 'text-social' },
        { icon: Clock, nhan: 'Phút học', giaTri: lichSu?.tongHomNay.phutHoc ?? null, mau: 'text-warning' },
      ],
    },
    {
      tieuDe: '7 ngày',
      chiSo: [
        { icon: GraduationCap, nhan: 'Người học', giaTri: lichSu?.tong7Ngay.nguoiHoc ?? null, mau: 'text-sky-400' },
        { icon: Clock, nhan: 'Phút học', giaTri: lichSu?.tong7Ngay.phutHoc ?? null, mau: 'text-warning' },
      ],
    },
  ]

  // Phòng đang mở gom theo môn, môn đông người lên trước.
  const theoMon = new Map<string, { phong: number; nguoi: number }>()
  for (const r of rooms) {
    const mon = r.monHoc ?? 'khac'
    const dong = theoMon.get(mon) ?? { phong: 0, nguoi: 0 }
    dong.phong += 1
    dong.nguoi += r.soNguoi
    theoMon.set(mon, dong)
  }

  const bang: BangThongKe[] = [
    {
      tieuDe: 'Phòng đang mở theo môn',
      cot: ['Môn', 'Phòng', 'Đang học'],
      dong: [...theoMon.entries()]
        .sort((a, b) => b[1].nguoi - a[1].nguoi || b[1].phong - a[1].phong)
        .map(([mon, d]) => ({ khoa: mon, nhan: TEN_MON.get(mon) ?? 'Khác', giaTri: [d.phong, d.nguoi] })),
      rong: 'Chưa có phòng nào đang mở',
    },
  ]
  if (lichSu) {
    bang.push(
      {
        tieuDe: 'Theo lớp',
        cot: ['Lớp', 'Sĩ số', 'Học hôm nay', 'Học 7 ngày', 'Tỉ lệ 7 ngày'],
        dong: lichSu.theoLop.map((l) => ({
          khoa: l.lopId,
          nhan: l.ten,
          giaTri: [l.siSo, l.hocHomNay, l.hoc7Ngay, l.siSo > 0 ? `${Math.round((l.hoc7Ngay / l.siSo) * 100)}%` : '–'],
        })),
        rong: 'Chưa có lớp',
      },
      {
        tieuDe: 'Theo ngày',
        cot: ['Ngày', 'Phòng tạo', 'Người học', 'Buổi học', 'Phút học'],
        dong: [...lichSu.theoNgay].reverse().map((d) => ({
          khoa: d.ngay,
          nhan: nhanNgay(d.ngay, lichSu.homNay),
          giaTri: [d.phongTao, d.nguoiHoc, d.buoiHoc, d.phutHoc],
        })),
        rong: 'Chưa có số liệu',
      },
    )
  }

  return (
    <ThongKeNhanh
      testId="thong-ke-hoc-tap"
      tieuDe="Học tập"
      nhom={nhom}
      homNay={lichSu?.homNay}
      bieuDo={
        lichSu
          ? [
              { tieuDe: 'Người học mỗi ngày', mau: 'bg-sky-400/80', diem: lichSu.theoNgay.map((d) => ({ ngay: d.ngay, giaTri: d.nguoiHoc })) },
              { tieuDe: 'Phút học mỗi ngày', mau: 'bg-amber-400/80', diem: lichSu.theoNgay.map((d) => ({ ngay: d.ngay, giaTri: d.phutHoc })) },
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
