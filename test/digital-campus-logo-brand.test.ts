import { describe, it, expect } from 'vitest'
import appHeaderRaw from '../src/components/layout/AppHeader.tsx?raw'
import authModalRaw from '../src/features/auth/AuthModal.tsx?raw'
import authGateRaw from '../src/app/AuthGate.tsx?raw'
import privacyPageRaw from '../src/app/PrivacyPage.tsx?raw'
import digitalCampusLogoRaw from '../src/components/brand/DigitalCampusLogo.tsx?raw'

describe('Digital Campus Brand Logo Consistency & Animated Effects', () => {
  it('1. DigitalCampusLogo component được thiết kế chuẩn vector chữ A với squircle kính mờ và hiệu ứng animated phát sáng', () => {
    // Vector biểu tượng chữ A / vòm cất cánh đặc trưng
    expect(digitalCampusLogoRaw).toContain('defs')
    expect(digitalCampusLogoRaw).toContain('dc-logo-grad')
    expect(digitalCampusLogoRaw).toContain('animate-pulse')
    expect(digitalCampusLogoRaw).toContain('animate-ping')
    expect(digitalCampusLogoRaw).toContain('rounded-[24%]')
    expect(digitalCampusLogoRaw).toContain('Top Bevel Highlight')
  })

  it('2. AppHeader hiển thị thương hiệu bằng DigitalCampusLogo', () => {
    expect(appHeaderRaw).toContain('<DigitalCampusLogo size="md" />')
    expect(appHeaderRaw).not.toContain('src="/assets/brand/app-logo.png"')
  })

  it('3. AuthModal hiển thị thương hiệu bằng DigitalCampusLogo', () => {
    expect(authModalRaw).toContain('<DigitalCampusLogo size="sm" />')
  })

  it('4. AuthGate hiển thị thương hiệu bằng DigitalCampusLogo', () => {
    expect(authGateRaw).toContain('<DigitalCampusLogo size="sm" />')
  })

  it('5. PrivacyPage hiển thị thương hiệu bằng DigitalCampusLogo', () => {
    expect(privacyPageRaw).toContain('<DigitalCampusLogo size="sm" />')
  })
})
