// Bố cục sân khấu lớp học: Tài liệu, Bảng, Video chạy đồng thời như các lớp chồng lên nhau.
// Người trình chiếu đặt bố cục và RoomDO đồng bộ cho cả phòng (lưu lại cho người vào sau); nội dung bên trong mỗi lớp đồng bộ riêng.

import type { WorkspaceMode } from './types'

export type LopId = 'doc' | 'board' | 'video'

/**
 * - main: chiếm toàn sân khấu.
 * - pip: cửa sổ nổi kéo thả được, nằm trên lớp chính.
 * - an: ẩn khỏi màn hình nhưng vẫn chạy (video vẫn phát tiếng).
 * Vẽ lên video / tài liệu dùng lớp vẽ riêng của chúng, không phủ Bảng lên nữa.
 */
export type VaiTroLop = 'main' | 'pip' | 'an'

/** Vị trí + cỡ cửa sổ nổi theo tỉ lệ khung sân khấu (0..1): giáo viên kéo tới đâu, học sinh thấy ở đúng chỗ đó. */
export interface KhungCuaSo {
  x: number
  y: number
  w: number
  h: number
}

export type BoCuc = Partial<Record<LopId, VaiTroLop>> & {
  khung?: Partial<Record<LopId, KhungCuaSo>>
  /** Vai trò ngay trước khi ẩn: bật lại lớp thì về đúng vai trò cũ (cửa sổ nổi giữ nguyên khung), không tự phóng to. */
  truocKhiAn?: Partial<Record<LopId, 'main' | 'pip'>>
}

/** Bố cục nhận từ máy chủ: bản cũ có thể còn vai trò 'phu' (bảng phủ, đã bỏ) — đọc thành cửa sổ nổi. */
export type BoCucMayChu = Partial<Record<LopId, VaiTroLop | 'phu'>> & { khung?: BoCuc['khung']; truocKhiAn?: BoCuc['truocKhiAn'] }

/** Kẹp khung trong sân khấu, làm tròn cho gọn gói tin. */
export function kepKhung(k: KhungCuaSo): KhungCuaSo {
  const tron = (v: number) => Math.round(v * 10000) / 10000
  const w = Math.min(1, Math.max(0.1, k.w))
  const h = Math.min(1, Math.max(0.1, k.h))
  return { x: tron(Math.min(1 - w, Math.max(0, k.x))), y: tron(Math.min(1 - h, Math.max(0, k.y))), w: tron(w), h: tron(h) }
}

/** Đặt khung cho một cửa sổ nổi. */
export function datKhung(bc: BoCuc, id: LopId, k: KhungCuaSo): BoCuc {
  return { ...bc, khung: { ...bc.khung, [id]: kepKhung(k) } }
}

/** Thứ tự cố định: dùng cho vị trí cửa sổ nổi và thứ tự nâng lên làm lớp chính. */
export const THU_TU_LOP: readonly LopId[] = ['doc', 'video', 'board']

export const dangHien = (vaiTro: VaiTroLop | undefined): boolean => vaiTro === 'main' || vaiTro === 'pip'

export function lopChinh(bc: BoCuc): LopId | null {
  return THU_TU_LOP.find((id) => bc[id] === 'main') ?? null
}

/** Lớp chính vừa mất: nâng cửa sổ nổi đầu tiên lên. */
function nangLopChinh(bc: BoCuc): BoCuc {
  if (lopChinh(bc)) return bc
  const cuaSo = THU_TU_LOP.find((id) => bc[id] === 'pip')
  return cuaSo ? { ...bc, [cuaSo]: 'main' } : bc
}

/** Đưa một lớp lên làm lớp chính; lớp chính cũ thu thành cửa sổ nổi. */
export function lamChinh(bc: BoCuc, id: LopId): BoCuc {
  const ketQua: BoCuc = { ...bc }
  const cu = lopChinh(bc)
  if (cu && cu !== id) ketQua[cu] = 'pip'
  ketQua[id] = 'main'
  return ketQua
}

/** Lớp chính thu thành cửa sổ nổi (lớp khác đang hiện được nâng lên làm chính). */
export function thuNho(bc: BoCuc, id: LopId): BoCuc {
  if (bc[id] !== 'main') return bc
  const conLai = THU_TU_LOP.find((khac) => khac !== id && bc[khac] === 'pip')
  if (conLai) return { ...bc, [id]: 'pip', [conLai]: 'main' }
  return { ...bc, [id]: 'pip' }
}

/** Ẩn một lớp (vẫn chạy); nhớ vai trò đang có để bật lại đúng như cũ. */
export function anLop(bc: BoCuc, id: LopId): BoCuc {
  const vaiTro = bc[id]
  if (!vaiTro) return bc
  const nho = vaiTro === 'main' || vaiTro === 'pip' ? { truocKhiAn: { ...bc.truocKhiAn, [id]: vaiTro } } : {}
  return nangLopChinh({ ...bc, ...nho, [id]: 'an' })
}

/** Bỏ hẳn một lớp khỏi sân khấu (nội dung đã kết thúc: đóng tài liệu, gỡ video). */
export function goLop(bc: BoCuc, id: LopId): BoCuc {
  if (!bc[id]) return bc
  const ketQua: BoCuc = { ...bc }
  delete ketQua[id]
  return nangLopChinh(ketQua)
}

/** Bảo đảm một lớp đang hiện: chưa có lớp chính thì làm chính, có rồi thì thành cửa sổ nổi. Đang hiện thì giữ nguyên. */
export function hienLop(bc: BoCuc, id: LopId): BoCuc {
  if (dangHien(bc[id])) return bc
  const chinh = lopChinh(bc)
  return chinh ? { ...bc, [id]: 'pip' } : { ...bc, [id]: 'main' }
}

/**
 * Nút trên thanh dock: lớp đang hiện → ẩn đi; bật lại → về đúng vai trò trước khi ẩn (cửa sổ nổi giữ nguyên chỗ / cỡ),
 * không tự phóng to — cỡ chỉ đổi khi bấm phóng to / thu nhỏ. Chưa từng mở → làm lớp chính.
 */
export function bamLop(bc: BoCuc, id: LopId): BoCuc {
  if (dangHien(bc[id])) return anLop(bc, id)
  if (bc[id] === 'an' && bc.truocKhiAn?.[id] === 'pip' && lopChinh(bc)) return { ...bc, [id]: 'pip' }
  return lamChinh(bc, id)
}

/** Vị trí góc của từng cửa sổ nổi (0: dưới-phải, 1: trên-phải, 2: dưới-trái, 3: trên-trái). */
export function viTriCuaSo(bc: BoCuc, id: LopId): number {
  return THU_TU_LOP.filter((khac) => bc[khac] === 'pip').indexOf(id)
}

/** Bố cục người trình chiếu gửi về: lớp chưa có nội dung trên máy này (gói đồng bộ nội dung chưa tới) thì bỏ ra. */
export function theoBoCucTrinhChieu(bc: BoCucMayChu, coVideo: boolean, coTaiLieu: boolean): BoCuc {
  const ketQua: BoCuc = {
    ...(bc.khung ? { khung: bc.khung } : {}),
    ...(bc.truocKhiAn ? { truocKhiAn: bc.truocKhiAn } : {}),
  }
  for (const id of THU_TU_LOP) {
    const vaiTro = bc[id] === 'phu' ? 'pip' : bc[id]
    if (!vaiTro) continue
    if ((id === 'video' && !coVideo) || (id === 'doc' && !coTaiLieu)) continue
    ketQua[id] = vaiTro
  }
  return nangLopChinh(ketQua)
}

const cungKhung = (a?: KhungCuaSo, b?: KhungCuaSo) =>
  a === b || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h)

export function cungBoCuc(a: BoCuc, b: BoCucMayChu | null): boolean {
  return b !== null && THU_TU_LOP.every((id) => a[id] === b[id] && cungKhung(a.khung?.[id], b.khung?.[id]))
}

/** Bố cục ban đầu khi vào phòng, suy từ nội dung đang có trên máy chủ. */
export function boCucBanDau(cheDo: WorkspaceMode, coVideo: boolean, coTaiLieu: boolean): BoCuc {
  const bc: BoCuc = {}
  if (cheDo === 'video') bc.video = 'main'
  else if (cheDo === 'document') bc.doc = 'main'
  else if (cheDo === 'whiteboard') bc.board = 'main'
  if (coVideo && !bc.video) bc.video = 'pip'
  if (coTaiLieu && !bc.doc) bc.doc = 'pip'
  return bc
}
