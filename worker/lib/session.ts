import { tenHienThiAnToan } from '../../shared/protocol/common'
import { COOKIE_NAME, readCookie, verifyToken, type Phien } from './auth'

export interface TaiKhoan {
  id: number
  username: string
  ten: string | null
  role: string | null
  teacherPending: boolean
  hocSinhId: number | null
  lopId: number | null
  avatar: string | null
  tieuDeHoSo: string | null
  laAdminTruong: boolean
}

export type KetQuaPhien =
  | { hopLe: true; phien: Phien; taiKhoan: TaiKhoan }
  | { hopLe: false; lyDo: string; thongBao: string; biDaRa: boolean }

interface DongTaiKhoan {
  id: number
  tenDangNhap: string
  ten: string | null
  vaiTro: string | null
  teacherPending: number | null
  dangHoatDong: number | null
  thietBi: string | null
  hocSinhId: number | null
  lopId: number | null
  avatar: string | null
  tieuDeHoSo: string | null
  laAdminTruong: number | null
}

export async function layPhien(request: Request, env: Env): Promise<Phien | null> {
  if (!env.SESSION_SECRET) return null
  return verifyToken(env.SESSION_SECRET, readCookie(request, COOKIE_NAME))
}

const tuChoi = (lyDo: string, thongBao: string, biDaRa = false): KetQuaPhien => ({
  hopLe: false,
  lyDo,
  thongBao,
  biDaRa,
})

// Đối chiếu CSDL mỗi lần để tài khoản bị khoá / đăng nhập ở thiết bị khác mất phiên ngay; lỗi D1 thì không cho qua.
export async function kiemTraPhien(phien: Phien | null, env: Env): Promise<KetQuaPhien> {
  if (!phien) return tuChoi('chua_dang_nhap', 'Chưa đăng nhập.')
  if (!phien.accountId) {
    return tuChoi('phien_khong_ho_tro', 'Bản mới chỉ hỗ trợ đăng nhập bằng tài khoản Campus.', true)
  }

  let tk: DongTaiKhoan | null
  try {
    tk = await env.DB.prepare(
      `SELECT id, ten_dang_nhap AS tenDangNhap, ten_hien_thi AS ten, vai_tro AS vaiTro,
              teacher_pending AS teacherPending, dang_hoat_dong AS dangHoatDong, thiet_bi AS thietBi,
              hoc_sinh_id AS hocSinhId, lop_id AS lopId, avatar, tieu_de_ho_so AS tieuDeHoSo,
              la_admin_truong AS laAdminTruong
         FROM tai_khoan_campus WHERE id = ?1`,
    )
      .bind(phien.accountId)
      .first<DongTaiKhoan>()
  } catch (e) {
    console.error(`Không xác minh được phiên (accountId=${phien.accountId}):`, e)
    return tuChoi('khong_xac_minh_duoc', 'Không xác minh được phiên đăng nhập.')
  }

  if (!tk) return tuChoi('tai_khoan_khong_con', 'Tài khoản không còn tồn tại.', true)
  if (!tk.dangHoatDong) return tuChoi('tai_khoan_khoa', 'Tài khoản này đã bị khoá.', true)
  if (tk.thietBi && (!phien.phienId || tk.thietBi !== phien.phienId)) {
    return tuChoi(
      'da_dang_nhap_noi_khac',
      'Tài khoản của bạn đã được đăng nhập trên một thiết bị khác hoặc phiên đã bị hủy. Bạn đã bị đăng xuất.',
      true,
    )
  }

  const taiKhoan: TaiKhoan = {
    id: tk.id,
    username: tk.tenDangNhap,
    ten: tenHienThiAnToan(tk.ten),
    role: tk.vaiTro,
    teacherPending: Boolean(tk.teacherPending),
    hocSinhId: tk.hocSinhId || null,
    lopId: tk.lopId || null,
    avatar: tk.avatar,
    tieuDeHoSo: tk.tieuDeHoSo,
    laAdminTruong: tk.laAdminTruong === 1,
  }
  return {
    hopLe: true,
    taiKhoan,
    phien: {
      ...phien,
      ten: taiKhoan.ten || phien.ten,
      role: tk.vaiTro || phien.role,
      teacherPending: taiKhoan.teacherPending,
      hocSinhId: taiKhoan.hocSinhId,
      lopId: taiKhoan.lopId,
    },
  }
}
