// Công cụ vẽ dùng chung cho mọi lớp trên sân khấu (bảng, tài liệu, bảng phủ lên video).
// Chọn một lần trên thanh dock, vẽ lên đúng lớp nằm dưới con trỏ.

/** khung: công cụ Hình (chữ nhật, tròn, tam giác, đường thẳng, mũi tên — chọn kiểu trong khay). */
export type CongCu = 'chuot' | 'di_chuyen' | 'but' | 'to_sang' | 'tay' | 'laser' | 'chu' | 'khung'

/** Công cụ tạo nét (chặn thao tác bấm xuyên xuống lớp bên dưới khi đang chọn). */
export const CONG_CU_VE: ReadonlySet<CongCu> = new Set(['but', 'to_sang', 'tay', 'chu', 'khung'])

/** Công cụ có màu / cỡ: chỉ khi chọn một trong số này mới hiện bảng màu và cỡ nét. */
export const CONG_CU_CO_MAU: ReadonlySet<CongCu> = new Set(['but', 'to_sang', 'chu', 'khung'])

export type LoaiHinh = 'chu_nhat' | 'tron' | 'tam_giac' | 'thang' | 'mui_ten'
export const CAC_HINH: readonly { id: LoaiHinh; ten: string }[] = [
  { id: 'chu_nhat', ten: 'Chữ nhật' },
  { id: 'tron', ten: 'Tròn' },
  { id: 'tam_giac', ten: 'Tam giác' },
  { id: 'thang', ten: 'Đường thẳng' },
  { id: 'mui_ten', ten: 'Mũi tên' },
]


export const MAU_VE = [
  { ten: 'Trắng', gia: '#ffffff' },
  { ten: 'Đen', gia: '#111827' },
  { ten: 'Đỏ', gia: '#ef4444' },
  { ten: 'Cam', gia: '#f97316' },
  { ten: 'Vàng', gia: '#facc15' },
  { ten: 'Xanh lá', gia: '#22c55e' },
  { ten: 'Xanh dương', gia: '#3b82f6' },
  { ten: 'Hồng', gia: '#ec4899' },
] as const

/** 4 mức cỡ: 0 nhỏ → 3 rất to. */
export type CoVe = 0 | 1 | 2 | 3
export const CAC_CO_VE: readonly CoVe[] = [0, 1, 2, 3]

/**
 * Kích thước theo hệ toạ độ của từng mặt vẽ:
 * - 'bang': bảng vẽ logic 1600×900.
 * - 'trang': trang tài liệu, đơn vị 1/1000 chiều cao trang (giới hạn máy chủ: size ≤ 50).
 */
const DO_DAY = {
  bang: { but: [4, 7, 12, 20], to_sang: [16, 26, 40, 60], chu: [28, 40, 56, 80] },
  trang: { but: [3, 6, 10, 16], to_sang: [14, 22, 32, 44], chu: [18, 26, 36, 48] },
} as const

export type MatVe = keyof typeof DO_DAY

export function doDayNet(mat: MatVe, congCu: CongCu, co: CoVe): number {
  if (congCu === 'to_sang') return DO_DAY[mat].to_sang[co]
  if (congCu === 'chu') return DO_DAY[mat].chu[co]
  return DO_DAY[mat].but[co]
}

export const DO_MO_TO_SANG = 0.35

/** Khung chữ nhật khép kín (5 điểm) từ hai góc kéo chuột. */
export function diemKhungChuNhat(a: [number, number], b: [number, number]): [number, number][] {
  return [
    [a[0], a[1]],
    [b[0], a[1]],
    [b[0], b[1]],
    [a[0], b[1]],
    [a[0], a[1]],
  ]
}

/**
 * Điểm của hình kéo từ góc `a` tới góc `b`. `tiLeNgang` = độ rộng hiển thị của 1 đơn vị x so với 1 đơn vị y
 * (trang tài liệu không vuông) — để đầu mũi tên không bị méo; `dauToiDa` = độ dài tối đa của đầu mũi tên.
 */
export function diemHinh(
  loai: LoaiHinh,
  a: [number, number],
  b: [number, number],
  tiLeNgang = 1,
  dauToiDa = Number.POSITIVE_INFINITY,
): [number, number][] {
  switch (loai) {
    case 'tron':
      return diemVongTron(a, b)
    case 'tam_giac': {
      const dinh: [number, number] = [(a[0] + b[0]) / 2, a[1]]
      return [dinh, [b[0], b[1]], [a[0], b[1]], dinh]
    }
    case 'thang':
      return [a, b]
    case 'mui_ten': {
      const dx = (b[0] - a[0]) * tiLeNgang
      const dy = b[1] - a[1]
      const dai = Math.hypot(dx, dy) || 1
      const dauMui = Math.min(dai * 0.25, dauToiDa)
      const canh = (goc: number): [number, number] => {
        const ux = -dx / dai
        const uy = -dy / dai
        const x = ux * Math.cos(goc) - uy * Math.sin(goc)
        const y = ux * Math.sin(goc) + uy * Math.cos(goc)
        return [b[0] + (x * dauMui) / tiLeNgang, b[1] + y * dauMui]
      }
      return [a, b, canh(Math.PI / 7), b, canh(-Math.PI / 7)]
    }
    default:
      return diemKhungChuNhat(a, b)
  }
}

/** Vòng elip khép kín nội tiếp khung kéo chuột. */
export function diemVongTron(a: [number, number], b: [number, number], soDiem = 48): [number, number][] {
  const cx = (a[0] + b[0]) / 2
  const cy = (a[1] + b[1]) / 2
  const rx = Math.abs(b[0] - a[0]) / 2
  const ry = Math.abs(b[1] - a[1]) / 2
  const diem: [number, number][] = []
  for (let i = 0; i <= soDiem; i++) {
    const goc = (i / soDiem) * Math.PI * 2
    diem.push([cx + rx * Math.cos(goc), cy + ry * Math.sin(goc)])
  }
  return diem
}

/** Rút gọn nét về tối đa `toiDa` điểm (giữ điểm đầu, điểm cuối) — máy chủ từ chối nét quá số điểm. */
export function rutGonDiem(diem: [number, number][], toiDa: number): [number, number][] {
  if (diem.length <= toiDa) return diem
  const ketQua: [number, number][] = [diem[0]]
  const buoc = (diem.length - 1) / (toiDa - 1)
  for (let i = 1; i < toiDa - 1; i++) ketQua.push(diem[Math.round(i * buoc)])
  ketQua.push(diem[diem.length - 1])
  return ketQua
}

function khoangCachDenDoan2(p: [number, number], v: [number, number], w: [number, number]): number {
  const l2 = (v[0] - w[0]) ** 2 + (v[1] - w[1]) ** 2
  if (l2 === 0) return (p[0] - v[0]) ** 2 + (p[1] - v[1]) ** 2
  const t = Math.max(0, Math.min(1, ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2))
  return (p[0] - (v[0] + t * (w[0] - v[0]))) ** 2 + (p[1] - (v[1] + t * (w[1] - v[1]))) ** 2
}

export interface NetCoTheCham {
  id: string
  points: [number, number][]
  tool?: string
  text?: string
  size?: number
}

export interface HopGioiHan {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/** Tính khung bao quanh của bất kỳ nét vẽ nào (chữ, hình, bút, dạ quang). */
export function hopGioiHanNet(net: NetCoTheCham, tiLeNgang = 1): HopGioiHan | null {
  const diem = net.points
  if (!diem || !diem.length) return null
  if (net.tool === 'text' && net.text) {
    const [x, y] = diem[0]
    const lines = net.text.split('\n')
    const maxLen = Math.max(...lines.map((l) => l.length))
    const cao = (net.size ?? 16) * (lines.length > 1 ? lines.length * 1.25 : 1)
    const rong = (maxLen * (net.size ?? 16) * 0.58) / tiLeNgang
    return { minX: x, minY: y, maxX: x + rong, maxY: y + cao, width: Math.max(12, rong), height: Math.max(12, cao) }
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const [x, y] of diem) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  const nuaSize = Math.max(2, (net.size ?? 4) / 2)
  minX -= nuaSize
  maxX += nuaSize
  minY -= nuaSize
  maxY += nuaSize
  return { minX, minY, maxX, maxY, width: Math.max(12, maxX - minX), height: Math.max(12, maxY - minY) }
}

/**
 * Nét trên cùng nằm dưới điểm `p` (cùng hệ toạ độ với nét). Chữ được tính theo khung chữ ước lượng.
 * `tiLeNgang` = độ rộng hiển thị của 1 đơn vị x so với 1 đơn vị y (trang tài liệu không vuông).
 * `chonCaBenTrong` = true khi dùng công cụ Di chuyển để dễ dàng nắm bất kỳ đâu trong sản phẩm (hình, chữ, nét vẽ).
 */
export function netDuocCham<T extends NetCoTheCham>(
  p: [number, number],
  cacNet: readonly T[],
  nguong: number,
  tiLeNgang = 1,
  chonCaBenTrong = false,
  laChuanHoa01 = false,
): T | null {
  for (let i = cacNet.length - 1; i >= 0; i--) {
    const net = cacNet[i]
    const diem = net.points
    if (!diem?.length) continue
    if (net.tool === 'text' && net.text) {
      const [x, y] = diem[0]
      const lines = net.text.split('\n')
      const maxLen = Math.max(...lines.map((l) => l.length))
      const cao = (net.size ?? 0) * (lines.length > 1 ? lines.length * 1.25 : 1)
      const rong = (maxLen * (net.size ?? 0) * 0.58) / tiLeNgang
      if (p[0] >= x - nguong && p[0] <= x + rong + nguong && p[1] >= y - nguong && p[1] <= y + cao + nguong) return net
      continue
    }
    if (chonCaBenTrong) {
      const hop = hopGioiHanNet(net, tiLeNgang)
      if (hop && p[0] >= hop.minX - nguong && p[0] <= hop.maxX + nguong && p[1] >= hop.minY - nguong && p[1] <= hop.maxY + nguong) {
        return net
      }
    }
    const effNguong = chonCaBenTrong
      ? (laChuanHoa01 ? Math.max(nguong, ((net.size ?? 0) / 1000) / 2 + 0.01) : Math.max(nguong, ((net.size ?? 0) / 2) + 8))
      : nguong
    const nguong2 = effNguong * effNguong
    if (diem.length === 1) {
      if ((p[0] - diem[0][0]) ** 2 + (p[1] - diem[0][1]) ** 2 <= nguong2) return net
      continue
    }
    for (let j = 0; j < diem.length - 1; j++) {
      if (khoangCachDenDoan2(p, diem[j], diem[j + 1]) <= nguong2) return net
    }
  }
  return null
}
