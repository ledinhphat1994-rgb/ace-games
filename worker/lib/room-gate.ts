import { loi } from './http'
import type { Phien } from './auth'
import { kiemTraPhien, layPhien, type TaiKhoan } from './session'
import { laGiaoVienDaDuyet, laQuanTriTruong, layPhamViQuanTri } from './scope'
import { readAdmitCookie, verifyAdmitToken } from './admission'

export interface DongPhong {
  id: number
  trang_thai: string
  pham_vi: string
  lop_id: number | null
  access_mode: string
  mat_khau_hash: string | null
  mat_khau_salt: string | null
  mat_khau_iterations: number | null
  suc_chua: number
  chu_phong_khoa: string
}

export const CANONICAL_ACCESS_MODES = new Set(['public', 'password'])

export function kiemTraCauHinhMatKhauPhong(phong: DongPhong): boolean {
  if (!phong.mat_khau_hash || !phong.mat_khau_salt || !phong.mat_khau_iterations) {
    return false
  }
  const iters = Number(phong.mat_khau_iterations)
  return Number.isInteger(iters) && iters > 0
}

export async function kiemTraPhamVi(
  env: Env,
  taiKhoan: TaiKhoan,
  phong: DongPhong,
): Promise<Response | null> {
  if (phong.pham_vi === 'truong') {
    return null
  }

  if (phong.pham_vi === 'lop') {
    const lopId = Number(phong.lop_id)
    if (!Number.isInteger(lopId) || lopId <= 0) {
      return loi('Cấu hình phạm vi lớp học không hợp lệ.', 503)
    }

    if (laQuanTriTruong(taiKhoan)) return null

    if (laGiaoVienDaDuyet(taiKhoan)) {
      const gvl = await env.DB.prepare(
        'SELECT 1 FROM giao_vien_lop WHERE giao_vien_id = ?1 AND lop_id = ?2 LIMIT 1',
      ).bind(taiKhoan.id, lopId).first<{ 1: number }>()
      if (!gvl) return loi('Bạn không phụ trách lớp học này.', 403)
      return null
    }

    if (!taiKhoan.lopId || taiKhoan.lopId !== lopId) {
      return loi('Bạn không thuộc lớp học này.', 403)
    }
    return null
  }

  return loi('Phạm vi phòng không được hỗ trợ.', 403)
}

export type KetQuaKiemTraQuyenPhong =
  | { ok: true; taiKhoan: TaiKhoan; phien: Phien; phongRow: DongPhong }
  | { ok: false; response: Response }

export async function kiemTraQuyenTruyCapPhong(
  request: Request,
  env: Env,
  phongId: number,
): Promise<KetQuaKiemTraQuyenPhong> {
  const kq = await kiemTraPhien(await layPhien(request, env), env)
  if (!kq.hopLe) return { ok: false, response: loi(kq.thongBao, 401) }

  let phongRow: DongPhong | null = null
  try {
    phongRow = await env.DB.prepare(
      `SELECT id, trang_thai, pham_vi, lop_id, access_mode, mat_khau_hash, mat_khau_salt,
              mat_khau_iterations, suc_chua, chu_phong_khoa
         FROM phong WHERE id = ?1 AND loai = 'video'`,
    )
      .bind(phongId)
      .first<DongPhong>()
  } catch (e) {
    console.error('Admission gate: lỗi tra cứu phòng D1:', e)
    return { ok: false, response: loi('Không thể xác minh thông tin phòng.', 500) }
  }

  if (!phongRow) return { ok: false, response: loi('Không tìm thấy phòng học.', 404) }
  if (phongRow.trang_thai !== 'mo') return { ok: false, response: loi('Phòng đã đóng hoặc tạm dừng hoạt động.', 403) }

  const loiPhamVi = await kiemTraPhamVi(env, kq.taiKhoan, phongRow)
  if (loiPhamVi) return { ok: false, response: loiPhamVi }

  try {
    const ban = await env.DB.prepare(
      'SELECT 1 FROM phong_ban WHERE phong_id = ?1 AND tai_khoan_id = ?2 LIMIT 1',
    )
      .bind(phongRow.id, kq.taiKhoan.id)
      .first<{ 1: number }>()
    if (ban) return { ok: false, response: loi('Bạn đã bị cấm vào phòng này.', 403) }
  } catch (e) {
    console.error('Admission gate: lỗi kiểm tra ban:', e)
    return { ok: false, response: loi('Không thể xác minh trạng thái thành viên. Vui lòng thử lại.', 503) }
  }

  if (!CANONICAL_ACCESS_MODES.has(phongRow.access_mode)) {
    return { ok: false, response: loi('Chế độ truy cập phòng không được hỗ trợ.', 403) }
  }

  if (phongRow.access_mode === 'password') {
    if (!kiemTraCauHinhMatKhauPhong(phongRow)) {
      return { ok: false, response: loi('Cấu hình bảo mật của phòng không hợp lệ. Vui lòng liên hệ quản trị viên.', 503) }
    }
    const admitToken = readAdmitCookie(request, phongRow.id)
    const hopLe = await verifyAdmitToken(env.SESSION_SECRET, admitToken, {
      roomId: phongRow.id,
      accountId: kq.taiKhoan.id,
      phienId: kq.phien.phienId!,
    })
    if (!hopLe) {
      return { ok: false, response: loi('Phòng này yêu cầu mật khẩu. Vui lòng xác thực trước khi kết nối.', 403) }
    }
  }

  return { ok: true, taiKhoan: kq.taiKhoan, phien: kq.phien, phongRow }
}

export interface QuyenModeratorPhong {
  canModerate: boolean
  isHost: boolean
  isTeacher: boolean
  isAdmin: boolean
  authorityRank: number // 3: Admin, 2: Scoped Teacher, 1: Host, 0: None
}

/**
 * XÁC ĐỊNH QUYỀN MODERATOR TRONG PHÒNG HỌC (Server-Authoritative Canonical Helper)
 * Invariant: Host != Moderator != Teacher != Admin
 * - School Admin (rank 3): Toàn quyền kiểm duyệt mọi phòng học.
 * - Approved Teacher (rank 2): Chỉ kiểm duyệt phòng phạm vi 'lop' khi phòng đó thuộc lớp được phân công.
 *   KHÔNG tự động là moderator trong phòng toàn trường hoặc phòng của lớp khác.
 * - Room Host (rank 1): Có quyền điều hành trong chính phòng của mình (không thể ghi đè cấp cao hơn).
 * - Student/Member (rank 0): Không có quyền điều hành.
 */
export async function xacDinhQuyenModeratorPhong(
  db: D1Database,
  taiKhoan: TaiKhoan,
  phong: DongPhong,
  callerKey: string,
): Promise<QuyenModeratorPhong> {
  const isAdmin = laQuanTriTruong(taiKhoan)
  const isHost = phong.chu_phong_khoa === callerKey

  if (isAdmin) {
    return {
      canModerate: true,
      isHost,
      isTeacher: true,
      isAdmin: true,
      authorityRank: 3,
    }
  }

  let isScopedTeacher = false
  if (laGiaoVienDaDuyet(taiKhoan)) {
    if (phong.pham_vi === 'lop' && phong.lop_id != null && phong.lop_id > 0) {
      const phamVi = await layPhamViQuanTri(db, taiKhoan)
      if (phamVi.lopIds?.includes(phong.lop_id)) {
        isScopedTeacher = true
      }
    }
  }

  if (isScopedTeacher) {
    return {
      canModerate: true,
      isHost,
      isTeacher: true,
      isAdmin: false,
      authorityRank: 2,
    }
  }

  if (isHost) {
    return {
      canModerate: true,
      isHost: true,
      isTeacher: false,
      isAdmin: false,
      authorityRank: 1,
    }
  }

  return {
    canModerate: false,
    isHost: false,
    isTeacher: false,
    isAdmin: false,
    authorityRank: 0,
  }
}
