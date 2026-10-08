import { describe, it, expect } from 'vitest'
import accountQuickCenterRaw from '../src/components/account/AccountQuickCenter.tsx?raw'
import achievementsModalRaw from '../src/features/engagement/AchievementsModal.tsx?raw'

describe('Account Menu & Achievements Modal Mobile Responsiveness', () => {
  it('1. Vùng 1: AccountQuickCenter đã xóa "Huy hiệu & thành tựu", dẫn trực tiếp tới /me', () => {
    // Không còn mục Huy hiệu & thành tựu trong menu
    expect(accountQuickCenterRaw).not.toContain('Huy hiệu & thành tựu')
    // Không còn subview và truy vấn thừa
    expect(accountQuickCenterRaw).not.toContain("currentView === 'achievements'")
    expect(accountQuickCenterRaw).not.toContain('/api/engagement/achievements')
    // Vẫn duy trì điều hướng đến /me (Hồ sơ của tôi)
    expect(accountQuickCenterRaw).toContain("diToi('/me')")
    expect(accountQuickCenterRaw).toContain('Hồ sơ của tôi')
    expect(accountQuickCenterRaw).toContain('Đổi mật khẩu')
    expect(accountQuickCenterRaw).toContain('Đăng xuất')
  })

  it('2. Vùng 2: AchievementsModal cố định chân modal với nút Thoát & Nạp tiền ngay, không bị che khuất trên mobile dọc & ngang', () => {
    // Khung DialogContent khóa chiều cao và không cho cuộn cả vỏ ngoài
    expect(achievementsModalRaw).toContain('flex flex-col overflow-hidden')
    expect(achievementsModalRaw).toContain('max-h-[calc(100svh-1.5rem)]')

    // Footer được cố định ở đáy modal với mt-auto shrink-0
    expect(achievementsModalRaw).toContain('mt-auto shrink-0')
    expect(achievementsModalRaw).toContain('Thoát')
    expect(achievementsModalRaw).toContain('Nạp tiền ngay')

    // Có safe-area-inset-bottom
    expect(achievementsModalRaw).toContain('env(safe-area-inset-bottom)')
  })

  it('3. Vùng 2: Khung danh sách co giãn flex-1 min-h-0 và card hiển thị trọn vẹn nội dung', () => {
    // Không còn hardcode h-[370px] cố định gây vỡ layout mobile ngang/dọc
    expect(achievementsModalRaw).not.toContain('h-[370px] min-h-[370px] max-h-[370px]')

    // Khung cuộn thích ứng với chiều cao màn hình
    expect(achievementsModalRaw).toContain('flex-1 min-h-0 overflow-y-auto overscroll-contain')

    // Card huy hiệu linh hoạt min-h-[80px], không bị cắt chữ
    expect(achievementsModalRaw).toContain('min-h-[80px]')
    expect(achievementsModalRaw).not.toContain('h-[84px] min-h-[84px] max-h-[84px] overflow-hidden')

    // Khung kim cương 3D tự động ẩn trên màn hình quá ngắn (mobile landscape) để nhường chỗ cho card
    expect(achievementsModalRaw).toContain('short-screen:hidden')
  })
})
