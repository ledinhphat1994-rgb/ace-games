export const GOC = 'https://campus.test'
export const MAT_KHAU = 'ThuNghiem@v2-2026'

// Lớp thử: id tự tăng theo đúng thứ tự này (1, 2).
export const LOP_THU = ['10A7 Thử nghiệm', '10A8 Thử nghiệm'] as const

export interface TaiKhoanThu {
  username: string
  ten: string
  hoatDong: 0 | 1
  vaiTro: 'student' | 'teacher'
  lopId: number | null
  laAdminTruong?: boolean
  /** Lớp được gán qua giao_vien_lop (chỉ giáo viên). */
  lopPhuTrach?: number[]
}

export const TAI_KHOAN_THU: readonly TaiKhoanThu[] = [
  { username: 'qa.v2.thu1', ten: 'QA Thử nghiệm 1', hoatDong: 1, vaiTro: 'student', lopId: 1 },
  { username: 'qa.v2.thu2', ten: 'QA Thử nghiệm 2', hoatDong: 1, vaiTro: 'student', lopId: 1 },
  { username: 'qa.v2.khoa', ten: 'QA Tài khoản khoá', hoatDong: 0, vaiTro: 'student', lopId: 1 },
  { username: 'qa.v2.thu3', ten: 'QA Học sinh lớp 2', hoatDong: 1, vaiTro: 'student', lopId: 2 },
  { username: 'qa.v2.tudo', ten: 'QA Chưa có lớp', hoatDong: 1, vaiTro: 'student', lopId: null },
  { username: 'qa.v2.gv', ten: 'QA Giáo viên lớp 1', hoatDong: 1, vaiTro: 'teacher', lopId: 1, lopPhuTrach: [1] },
  { username: 'qa.v2.admin', ten: 'QA Quản trị trường', hoatDong: 1, vaiTro: 'teacher', lopId: null, laAdminTruong: true },
]
