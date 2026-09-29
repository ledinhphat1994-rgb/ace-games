import { useEffect, useState } from 'react'
import { timKiemNguoiDung } from '@/lib/api'
import { UserSearchController, type SearchState } from '@/features/hub/social-semantics'

/** Chờ người dùng ngừng gõ rồi mới hỏi máy chủ. */
const CHO_GO_MS = 300

/**
 * Tìm tài khoản trong trường theo tên (kể cả người chưa kết bạn). Trả về trạng thái thật: đang tìm / có kết quả /
 * không có / lỗi mạng — lỗi không bao giờ bị hiểu nhầm thành "không tìm thấy". Kết quả chậm của lần gõ cũ bị bỏ.
 */
export function useTimNguoiDung(tuKhoa: string, batDau: boolean, lanThu = 0): SearchState {
  const [controller] = useState(() => new UserSearchController())
  const [trangThai, setTrangThai] = useState<SearchState>({ status: 'idle' })

  useEffect(() => controller.subscribe(setTrangThai), [controller])

  useEffect(() => {
    const q = tuKhoa.trim()
    if (!batDau || !q) {
      controller.reset()
      return
    }
    const hen = setTimeout(() => void controller.executeSearch(q, timKiemNguoiDung), CHO_GO_MS)
    return () => clearTimeout(hen)
  }, [tuKhoa, batDau, lanThu, controller])

  return trangThai
}
