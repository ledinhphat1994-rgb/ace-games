// Trang /privacy: công khai (ngoài AuthGate), không gọi API, nội dung khớp dữ liệu hệ thống thực sự lưu.
import { describe, expect, it } from 'vitest'
import mainRaw from '../src/main.tsx?raw'
import privacyRaw from '../src/app/PrivacyPage.tsx?raw'

describe('Trang chính sách bảo mật /privacy', () => {
  it('khai báo trước nhánh AuthGate nên không cần đăng nhập', () => {
    const viTriPrivacy = mainRaw.indexOf("path: 'privacy'")
    expect(viTriPrivacy).toBeGreaterThan(-1)
    expect(viTriPrivacy).toBeLessThan(mainRaw.indexOf('element: <AuthGate />'))
    expect(mainRaw).toContain("import('@/app/PrivacyPage')")
  })

  it('không gọi API và nêu rõ dữ liệu Google, thời hạn lưu, không quảng cáo', () => {
    expect(privacyRaw).not.toContain('fetch(')
    expect(privacyRaw).not.toContain('useQuery')
    expect(privacyRaw).toContain('Chính sách bảo mật')
    expect(privacyRaw).toContain('Đăng nhập bằng Google:')
    expect(privacyRaw).toContain('không truy cập thư, danh bạ hay tệp trên Google Drive')
    expect(privacyRaw).toContain('200 tin nhắn gần nhất')
    expect(privacyRaw).toContain('tự xoá sau 60 ngày')
    expect(privacyRaw).toContain('không dùng dữ liệu của bạn để quảng cáo')
  })
})
