// Đăng nhập bằng Google — mức liên kết (Platform Core: Identity & Accounts).
// Máy chủ chuyển hướng về trang với ?google=<kết quả>; giao diện đọc mã này để báo cho người dùng.

export const KET_QUA_GOOGLE = [
  'ok',
  'khoi_phuc',
  'da_lien_ket',
  'chua_lien_ket',
  'da_lien_ket_khac',
  'bi_khoa',
  'can_dang_nhap',
  'chua_cau_hinh',
  'da_huy',
  'loi',
] as const
export type KetQuaGoogle = (typeof KET_QUA_GOOGLE)[number]

/** GET /api/auth/google/status — trạng thái liên kết Google của tài khoản đang đăng nhập. */
export interface TrangThaiGoogle {
  ok: true
  /** Máy chủ đã cấu hình Client ID + Client secret. */
  sanSang: boolean
  lienKet: boolean
  email: string | null
}
