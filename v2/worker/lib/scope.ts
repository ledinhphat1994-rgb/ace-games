import type { TaiKhoan } from './session'

// Port functions/_lib/quan-tri.js. v2 chỉ có phiên tài khoản Campus, và kiemTraPhien đã đọc tươi dòng tài khoản
// từ D1, nên không cần đọc lại la_admin_truong/vai_tro như bản cũ.

/** lopIds = null nghĩa là mọi lớp (School Admin). */
export interface PhamViQuanTri {
  quanTriTruong: boolean
  lopIds: number[] | null
}

export function laQuanTriTruong(tk: TaiKhoan): boolean {
  return tk.laAdminTruong || tk.role === 'admin' || tk.role === 'school_admin'
}

export function laGiaoVienDaDuyet(tk: TaiKhoan): boolean {
  return laQuanTriTruong(tk) || (tk.role === 'teacher' && !tk.teacherPending)
}

// Chỉ gọi cho giáo viên đã duyệt / School Admin. Lỗi D1 để nổi lên cho nơi gọi xử lý (không mặc định cấp quyền).
export async function layPhamViQuanTri(db: D1Database, tk: TaiKhoan): Promise<PhamViQuanTri> {
  if (laQuanTriTruong(tk)) return { quanTriTruong: true, lopIds: null }

  const { results } = await db
    .prepare('SELECT lop_id AS lopId FROM giao_vien_lop WHERE giao_vien_id = ?1')
    .bind(tk.id)
    .all<{ lopId: number }>()
  const lopIds = results.map((r) => r.lopId)
  // Tương thích ngược: tài khoản chưa có dòng giao_vien_lop vẫn dùng lop_id sẵn có trên tai_khoan_campus.
  if (lopIds.length === 0 && tk.lopId) lopIds.push(tk.lopId)
  return { quanTriTruong: false, lopIds }
}

// Lớp THỰC SỰ áp dụng cho một yêu cầu: lớp client chọn chỉ được dùng khi nằm trong phạm vi (chống IDOR).
export function xacDinhLopIdApDung(
  pham: PhamViQuanTri,
  lopIdYeuCau: number | null,
  lopIdMacDinh: number | null,
): number | null {
  if (!lopIdYeuCau) return lopIdMacDinh || null
  if (pham.quanTriTruong) return lopIdYeuCau
  return pham.lopIds?.includes(lopIdYeuCau) ? lopIdYeuCau : null
}
