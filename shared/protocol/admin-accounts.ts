import { z } from 'zod'

// Quản lý tài khoản của School Admin (Platform Core — Identity & Accounts), theo docs/contracts/account-administration-v1.md:
// tìm/lọc tài khoản, duyệt hoặc từ chối yêu cầu giáo viên đang chờ, cấp quyền giáo viên cho học sinh, khoá/mở khoá tài khoản.

export const LOC_TAI_KHOAN = ['pending_teacher', 'all', 'teacher', 'student', 'locked'] as const
export type LocTaiKhoan = (typeof LOC_TAI_KHOAN)[number]

export const HanhDongTaiKhoanSchema = z.object({
  action: z.enum(['approve_teacher', 'reject_teacher', 'grant_teacher', 'lock', 'unlock']),
})
export type HanhDongTaiKhoan = z.infer<typeof HanhDongTaiKhoanSchema>['action']

/** Một tài khoản trong danh sách quản trị — không bao giờ có hash/salt/mật khẩu/thiết bị. */
export interface AdminAccountItem {
  id: number
  username: string
  displayName: string
  role: 'student' | 'teacher'
  teacherPending: boolean
  active: boolean
  isSchoolAdmin: boolean
  lopId: number | null
  lopTen: string | null
  /** Gmail đã liên kết để đăng nhập bằng Google; null nếu chưa liên kết. */
  googleEmail: string | null
  /** ms (UTC); 0 nếu không rõ. */
  createdAt: number
}

export interface AdminAccountCounts {
  pendingTeacher: number
  locked: number
  total: number
}
