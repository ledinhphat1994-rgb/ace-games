// Hồi quy giao diện có thật đã sửa trong đợt thiết kế lại (không phải kiểm thử thẩm mỹ).
import { describe, expect, it } from 'vitest'
import { tenLop } from '../src/lib/utils'
import passwordRoomDialogRaw from '../src/features/hub/PasswordRoomDialog.tsx?raw'
import learningPageRaw from '../src/features/hub/LearningPage.tsx?raw'
import arenaLeaderboardRaw from '../src/features/games/GameArenaLeaderboard.tsx?raw'
import appHeaderRaw from '../src/components/layout/AppHeader.tsx?raw'
import campusContextRaw from '../src/app/CampusContext.tsx?raw'
import gameRoomsHookRaw from '../src/hooks/use-game-rooms.ts?raw'

describe('Khách chưa đăng nhập không thấy số liệu giả', () => {
  it('header chỉ hiện số trực tuyến khi đã đăng nhập', () => {
    expect(appHeaderRaw).toMatch(/\{nguoiDung && \(\s*<ConnectionIndicator/)
  })

  it('trang Học tập hiển thị sảnh phòng khám phá đồng bộ với Game, yêu cầu đăng nhập khi tương tác', () => {
    // Số phòng chỉ hiện với người đã đăng nhập (mẫu sảnh chung chỉ hiện số khi danh sách đã sẵn sàng).
    expect(learningPageRaw).toContain("nguoiDung && lobbyState.status === 'ready'")
    expect(learningPageRaw).toContain('danhSachPhongLoc.length')
    // Số liệu tổng chỉ Quản trị trường thấy (ThongKeHocTap tự ẩn với người khác), và chỉ khi sảnh đã sẵn sàng.
    expect(learningPageRaw).toContain("<ThongKeHocTap rooms={rooms} sanSang={lobbyState.status === 'ready'} />")
    expect(learningPageRaw).toContain('PLATFORM_DEFAULT_STUDY_ROOMS')
    expect(learningPageRaw).toContain("moAuthModal('dang_nhap')")
  })
})

describe('Tự nối lại WebSocket', () => {
  it('sảnh trường: lùi có độ trễ ngẫu nhiên, nối lại ngay khi có mạng / quay lại tab (không bao giờ sau mã 4001)', () => {
    expect(campusContextRaw).toContain('mucLui / 2 + Math.random() * (mucLui / 2)')
    expect(campusContextRaw).toContain("window.addEventListener('online', noiLaiNgay)")
    expect(campusContextRaw).toContain("document.addEventListener('visibilitychange', noiLaiNgay)")
    expect(campusContextRaw).toContain('!choNoiLaiRef.current')
  })

  it('sảnh game: lùi dần 1s → 30s có độ trễ ngẫu nhiên thay vì cố định 5 giây', () => {
    expect(gameRoomsHookRaw).toContain('Math.min(1000 * 2 ** soLanThu, 30_000)')
    expect(gameRoomsHookRaw).not.toContain('setTimeout(connect, 5000)')
  })
})

describe('Bảng xếp hạng Đấu Trường', () => {
  it('chỉ lấy điểm máy chủ đã xác thực (điểm legacy do trình duyệt tự khai không được lên top)', () => {
    expect(arenaLeaderboardRaw).toContain("verifiedOnly: '1'")
  })
})

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
