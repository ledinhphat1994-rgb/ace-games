// Quan hệ bạn bè giữa người xem và một tài khoản khác, suy ra từ SocialState (luôn mới nhất theo thời gian thực).
// Dùng chung cho hồ sơ người dùng (bấm ảnh trong chat) và kết quả tìm kiếm ở tab Bạn bè.

import type { RelationshipStatus, SocialState } from '@shared/protocol/social'

export function suyRaQuanHe(id: number, toiId: number, state: SocialState): RelationshipStatus {
  if (id === toiId) return 'self'
  if (state.blockedUsers.some((b) => b.id === id)) return 'blocked'
  if (state.friends.some((f) => f.id === id)) return 'friend'
  if (state.outgoingRequests.some((r) => r.receiver?.id === id)) return 'pending_sent'
  if (state.incomingRequests.some((r) => r.sender?.id === id)) return 'pending_received'
  return 'none'
}

/** Nhãn vai trò hiển thị (vai trò trong CSDL: student / teacher / admin / school_admin; chat dùng hoc_sinh / giao_vien). */
export function nhanVaiTro(vaiTro: string | null | undefined): string | null {
  switch (vaiTro) {
    case 'teacher':
    case 'giao_vien':
      return 'Giáo viên'
    case 'admin':
    case 'school_admin':
      return 'Quản trị'
    case 'student':
    case 'hoc_sinh':
      return 'Học sinh'
    default:
      return null
  }
}
