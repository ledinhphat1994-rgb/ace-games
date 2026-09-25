// Hồi quy giao diện có thật đã sửa trong đợt thiết kế lại (không phải kiểm thử thẩm mỹ).
import { describe, expect, it } from 'vitest'
import { tenLop } from '../src/lib/utils'
import passwordRoomDialogRaw from '../src/features/hub/PasswordRoomDialog.tsx?raw'
import learningPageRaw from '../src/features/hub/LearningPage.tsx?raw'

describe('Vào phòng có mật khẩu', () => {
  it('hộp thoại trả về MÃ SỐ phòng, không phải cả object (từng điều hướng tới /room/phong-[object Object])', () => {
    expect(passwordRoomDialogRaw).toContain('onSuccess: (roomId: number) => void')
    expect(passwordRoomDialogRaw).toContain('onSuccess(room.id)')
    expect(passwordRoomDialogRaw).not.toMatch(/onSuccess\(room\)/)
  })

  it('trang Học tập điều hướng bằng mã số phòng nhận được', () => {
    expect(learningPageRaw).toContain('navigate(`/room/phong-${roomId}`)')
  })
})

describe('tenLop — không lặp chữ "Lớp"', () => {
  it('thêm tiền tố khi tên lớp chưa có', () => {
    expect(tenLop('10A7')).toBe('Lớp 10A7')
    expect(tenLop(' 10A8 Thử nghiệm ')).toBe('Lớp 10A8 Thử nghiệm')
  })

  it('giữ nguyên khi tên lớp đã có chữ "Lớp"', () => {
    expect(tenLop('Lớp 10A7')).toBe('Lớp 10A7')
    expect(tenLop('lớp 11B2')).toBe('lớp 11B2')
  })
})
