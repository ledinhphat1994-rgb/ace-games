import { describe, expect, it } from 'vitest'
import homePageRaw from '../src/features/hub/HomePage.tsx?raw'

describe('HomePage Vùng 1, Vùng 2, Vùng 3 Fix Suite', () => {
  // ── VÙNG 1: Tiêu đề banner sạch sẽ, không ghi nơi chốn ───────────────────────
  it('1. Vùng 1: Banner badge chỉ ghi tiêu đề, không chứa GDTX hay địa danh', () => {
    expect(homePageRaw).not.toContain('GDTX ĐỊNH QUÁN')
    expect(homePageRaw).not.toContain('PHÒNG HỌC TRỰC TUYẾN • GDTX ĐỊNH QUÁN')
    expect(homePageRaw).not.toContain('CỘNG ĐỒNG HỌC SINH • GDTX ĐỊNH QUÁN')
    expect(homePageRaw).not.toContain('ĐẤU TRƯỜNG TRÒ CHƠI • DIGITAL CAMPUS')
    expect(homePageRaw).not.toContain('BẢNG VINH DANH • DIGITAL CAMPUS')

    // Phải có các badge tiêu đề game tinh gọn
    expect(homePageRaw).toContain("badge: 'ĐẤU TRƯỜNG CHIẾN THUẬT'")
    expect(homePageRaw).toContain("badge: 'ARCADE SINH TỒN 120HZ'")
    expect(homePageRaw).toContain("badge: 'BẢNG VINH DANH CAO THỦ'")
  })

  // ── VÙNG 2: Bảng xếp hạng và Sự kiện (giống mục game, học tập) ──────────────
  it('2. Vùng 2: Right panel có card Bảng xếp hạng ở trên và Sự kiện ở dưới', () => {
    // Card trên: Bảng xếp hạng
    expect(homePageRaw).toContain('aria-label="Bảng xếp hạng"')
    expect(homePageRaw).toContain('<h3 className="text-sm font-bold text-white">Bảng xếp hạng</h3>')
    expect(homePageRaw).toContain("to=\"/leaderboard\"")

    // Card dưới: Sự kiện
    expect(homePageRaw).toContain('aria-label="Sự kiện"')
    expect(homePageRaw).toContain('data-testid="homepage-events-card"')
    expect(homePageRaw).toContain('<h3 className="text-sm font-bold text-text-primary">Sự kiện</h3>')
    expect(homePageRaw).toContain('Đang diễn ra')
    expect(homePageRaw).toContain('Sắp diễn ra')
    expect(homePageRaw).toContain('19:30 – 21:30 hôm nay')
    expect(homePageRaw).toContain('08:30 – 11:00 Thứ Bảy')
  })

  // ── VÙNG 3: Danh mục trò chơi nổi bật ─────────────────────────────────────────
  it('3. Vùng 3: Trò chơi nổi bật hiển thị danh mục game và link tới arena', () => {
    expect(homePageRaw).toContain('aria-label="Trò chơi nổi bật"')
    expect(homePageRaw).toContain('to="/arena"')
  })
})
