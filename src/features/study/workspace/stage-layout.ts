// Bố cục sân khấu lớp học: Tài liệu, Bảng, Video chạy đồng thời như các lớp chồng lên nhau.
// Người trình chiếu đặt bố cục và RoomDO đồng bộ cho cả phòng (lưu lại cho người vào sau); nội dung bên trong mỗi lớp đồng bộ riêng.

import type { WorkspaceMode } from './types'

export type LopId = 'doc' | 'board' | 'video'

/**
 * - main: chiếm toàn sân khấu.
 * - pip: cửa sổ nổi kéo thả được, nằm trên lớp chính.
 * - phu: (chỉ bảng) bảng trong suốt phủ lên lớp chính để vẽ đè lên video / tài liệu.
 * - an: ẩn khỏi màn hình nhưng vẫn chạy (video vẫn phát tiếng).
 */
export type VaiTroLop = 'main' | 'pip' | 'phu' | 'an'

export type BoCuc = Partial<Record<LopId, VaiTroLop>>

/** Thứ tự cố định: dùng cho vị trí cửa sổ nổi và thứ tự nâng lên làm lớp chính. */
export const THU_TU_LOP: readonly LopId[] = ['doc', 'video', 'board']

export const dangHien = (vaiTro: VaiTroLop | undefined): boolean =>
  vaiTro === 'main' || vaiTro === 'pip' || vaiTro === 'phu'

export function lopChinh(bc: BoCuc): LopId | null {
  return THU_TU_LOP.find((id) => bc[id] === 'main') ?? null
}

/** Lớp chính vừa mất: nâng cửa sổ nổi đầu tiên lên; không còn cửa sổ nào thì bảng đang phủ trở thành lớp chính. */
function nangLopChinh(bc: BoCuc): BoCuc {
  if (lopChinh(bc)) return bc
  const cuaSo = THU_TU_LOP.find((id) => bc[id] === 'pip')
  if (cuaSo) return { ...bc, [cuaSo]: 'main' }
  if (bc.board === 'phu') return { ...bc, board: 'main' }
  return bc
}

/** Đưa một lớp lên làm lớp chính; lớp chính cũ thu thành cửa sổ nổi. Bảng đang phủ vẫn phủ lên lớp chính mới. */
export function lamChinh(bc: BoCuc, id: LopId): BoCuc {
  const ketQua: BoCuc = { ...bc }
  const cu = lopChinh(bc)
  if (cu && cu !== id) ketQua[cu] = 'pip'
  ketQua[id] = 'main'
  return ketQua
}

/** Lớp chính thu thành cửa sổ nổi (lớp khác đang hiện được nâng lên làm chính); bảng đang phủ thành cửa sổ. */
export function thuNho(bc: BoCuc, id: LopId): BoCuc {
  if (bc[id] === 'phu') return { ...bc, [id]: 'pip' }
  if (bc[id] !== 'main') return bc
  const conLai = THU_TU_LOP.find((khac) => khac !== id && bc[khac] === 'pip')
  if (conLai) return { ...bc, [id]: 'pip', [conLai]: 'main' }
  return { ...bc, [id]: 'pip' }
}

/** Ẩn một lớp (vẫn chạy). */
export function anLop(bc: BoCuc, id: LopId): BoCuc {
  if (!bc[id]) return bc
  return nangLopChinh({ ...bc, [id]: 'an' })
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

/** Nút trên thanh dock: lớp đang hiện → ẩn đi; đang ẩn / chưa mở → đưa lên làm lớp chính. */
export function bamLop(bc: BoCuc, id: LopId): BoCuc {
  return dangHien(bc[id]) ? anLop(bc, id) : lamChinh(bc, id)
}

/** Bảng: cửa sổ nổi ⇄ phủ trong suốt lên lớp chính (chỉ khi lớp chính là tài liệu hoặc video). */
export function batTatBangPhu(bc: BoCuc): BoCuc {
  if (bc.board === 'phu') return { ...bc, board: 'pip' }
  const chinh = lopChinh(bc)
  if (!chinh || chinh === 'board') return bc
  return { ...bc, board: 'phu' }
}

/**
 * Chọn công cụ vẽ: video (và tài liệu không có lớp chú thích như Word / Excel nhúng) không vẽ trực tiếp được → phủ bảng trong suốt.
 * PDF, ảnh, .pptx vẽ lên lớp chú thích gắn theo trang nên giữ nguyên bố cục.
 */
export function phuBangDeVe(bc: BoCuc, taiLieuVeDuoc: boolean): BoCuc {
  const chinh = lopChinh(bc)
  const canPhu = chinh === 'video' || (chinh === 'doc' && !taiLieuVeDuoc)
  return canPhu && bc.board !== 'phu' ? { ...bc, board: 'phu' } : bc
}

/** Vị trí góc của từng cửa sổ nổi (0: dưới-phải, 1: trên-phải, 2: dưới-trái, 3: trên-trái). */
export function viTriCuaSo(bc: BoCuc, id: LopId): number {
  return THU_TU_LOP.filter((khac) => bc[khac] === 'pip').indexOf(id)
}

/** Bố cục người trình chiếu gửi về: lớp chưa có nội dung trên máy này (gói đồng bộ nội dung chưa tới) thì bỏ ra. */
export function theoBoCucTrinhChieu(bc: BoCuc, coVideo: boolean, coTaiLieu: boolean): BoCuc {
  const ketQua: BoCuc = {}
  for (const id of THU_TU_LOP) {
    const vaiTro = bc[id]
    if (!vaiTro) continue
    if ((id === 'video' && !coVideo) || (id === 'doc' && !coTaiLieu)) continue
    ketQua[id] = vaiTro
  }
  return nangLopChinh(ketQua)
}

export function cungBoCuc(a: BoCuc, b: BoCuc | null): boolean {
  return b !== null && THU_TU_LOP.every((id) => a[id] === b[id])
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
