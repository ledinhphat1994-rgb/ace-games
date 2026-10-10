import { describe, it, expect } from 'vitest'
import faviconRaw from '../public/favicon.svg?raw'
import logoRaw from '../src/components/brand/DigitalCampusLogo.tsx?raw'
import authGateRaw from '../src/app/AuthGate.tsx?raw'
import khungChoTrangRaw from '../src/components/layout/KhungChoTrang.tsx?raw'

describe('Logo tab, Logo Vùng X & Màn hình loading Ace Games', () => {
  it('1. Logo vùng tab (public/favicon.svg) đồng bộ với logo vùng X và không có dấu chấm tròn', () => {
    // Đã đổi từ tia sét tím cũ sang logo squircle chữ A
    expect(faviconRaw).not.toContain('#863bff')
    // Khung squircle bo góc
    expect(faviconRaw).toContain('rx="23"')
    // Path chữ A đặc trưng
    expect(faviconRaw).toContain('M50 16C43.5 16 35.8 28.5')
    // Tuyệt đối không có dấu chấm tròn nào
    expect(faviconRaw).not.toContain('<circle')
  })

  it('2. Logo vùng X (DigitalCampusLogo.tsx) đã xóa hoàn toàn dấu chấm tròn & hỗ trợ animation chạy dọc chữ A', () => {
    // Xóa dấu chấm tròn live signal ở góc trên bên phải
    expect(logoRaw).not.toContain('animate-ping')
    expect(logoRaw).not.toContain('rounded-full bg-sky-400')
    // Xóa viên ngọc tròn ở giữa vòm chữ A
    expect(logoRaw).not.toContain('<circle')

    // Hỗ trợ prop loading và size 2xl
    expect(logoRaw).toContain("loading = false")
    expect(logoRaw).toContain("'2xl'")

    // Có hiệu ứng animated chạy dọc chữ A khi chờ
    expect(logoRaw).toContain('dc-a-pulse-outer')
    expect(logoRaw).toContain('dc-a-pulse-inner')
    expect(logoRaw).toContain('dcPulseTrace')
    expect(logoRaw).toContain('stroke-dashoffset')
  })

  it('3. Màn hình loading (AuthGate.tsx) chỉ hiện duy nhất logo to bản, không có text hay spinner', () => {
    // Trong khối phien.isPending chỉ render DigitalCampusLogo size 2xl loading
    expect(authGateRaw).toContain('<DigitalCampusLogo size="2xl" loading showGlow />')
    expect(authGateRaw).not.toContain('<LogoCampus />')
    // Không có spinner Loader2 trong AuthGate
    expect(authGateRaw).not.toContain('Loader2')
  })

  it('4. Khung giữ chỗ khi tải trang (KhungChoTrang.tsx) đồng bộ hiển thị logo animated', () => {
    expect(khungChoTrangRaw).toContain('<DigitalCampusLogo size="xl" loading')
  })
})
