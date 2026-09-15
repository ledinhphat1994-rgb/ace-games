import type { PhongSanh, VaiTroCampus } from '../../shared/protocol/campus'
import { actorKey, type Phien } from '../lib/auth'
import { laGiaoVienDaDuyet, layPhamViQuanTri } from '../lib/scope'
import type { TaiKhoan } from '../lib/session'

/** Chỉ có một CampusDO cho toàn trường. */
export const TEN_CAMPUS = 'campus'

export interface DanhTinhCampus {
  accountId: number
  key: string
  ten: string
  vaiTro: VaiTroCampus
  lopId: number | null
  lopTen: string | null
  phienId: string | null
  /** Giáo viên đã duyệt / School Admin được xoá mọi tin chat toàn trường. */
  xoaMoiTin: boolean
  xemTatCaLop: boolean
  lopXem: number[]
}

export async function taoDanhTinhCampus(env: Env, phien: Phien, tk: TaiKhoan): Promise<DanhTinhCampus> {
  const giaoVien = laGiaoVienDaDuyet(tk)
  const [pham, lop] = await Promise.all([
    giaoVien ? layPhamViQuanTri(env.DB, tk) : null,
    tk.lopId ? env.DB.prepare('SELECT ten FROM lop WHERE id = ?1').bind(tk.lopId).first<{ ten: string }>() : null,
  ])
  return {
    accountId: tk.id,
    key: actorKey(phien),
    ten: tk.ten || tk.username,
    vaiTro: giaoVien ? 'giao_vien' : 'hoc_sinh',
    lopId: tk.lopId,
    lopTen: lop?.ten ?? null,
    phienId: phien.phienId ?? null,
    xoaMoiTin: giaoVien,
    xemTatCaLop: pham?.quanTriTruong ?? false,
    // Như danh sách phòng của phong.js: học sinh thấy lớp mình, giáo viên thấy các lớp được gán.
    lopXem: pham ? (pham.lopIds ?? []) : tk.lopId ? [tk.lopId] : [],
  }
}

export function thayPhong(
  dt: Pick<DanhTinhCampus, 'xemTatCaLop' | 'lopXem'>,
  phong: Pick<PhongSanh, 'phamVi' | 'lopId'>,
): boolean {
  return phong.phamVi === 'truong' || dt.xemTatCaLop || (phong.lopId !== null && dt.lopXem.includes(phong.lopId))
}
