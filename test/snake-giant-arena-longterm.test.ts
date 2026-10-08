import { describe, it, expect } from 'vitest'
import wormateRaw from '../src/features/games/snake/Wormate3DArena.tsx?raw'
import audioRaw from '../src/features/games/snake/SnakeAudioEngine.ts?raw'
import { SIZE_TIERS, getWormSizeTier } from '../src/features/games/snake/snake-size-tiers'

describe('Wormate 3D: Map to rộng 7200, Xóa dải viền đỏ Vùng 1, Cơ chế game lâu dài và Level kích cỡ khổng lồ', () => {
  it('Map to rộng 7200 và mật độ bánh ngọt 1200 viên', () => {
    expect(wormateRaw).toContain('const ARENA_SIZE = 7200')
    expect(wormateRaw).toContain('const TOTAL_FOOD_COUNT = 1200')
    expect(wormateRaw).toContain('const MAX_RADIUS = 72.0')
  })

  it('Xóa bỏ hoàn toàn dải viền đỏ thô kệch Vùng 1 và mở rộng nền vô cực theo camera', () => {
    // Không còn viền đỏ 16px bao quanh toàn bộ arena
    expect(wormateRaw).not.toContain("ctx.strokeStyle = '#ef4444'")
    // Nền tràn viewBounds camera
    expect(wormateRaw).toContain("ctx.fillStyle = '#080d1a'")
    expect(wormateRaw).toContain('viewBounds.minX - 500')
    // Ranh giới bản đồ mảnh thanh lịch
    expect(wormateRaw).toContain("ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)'")
  })

  it('Hệ thống 6 cấp độ kích cỡ khổng lồ và hào quang Titan', () => {
    expect(SIZE_TIERS).toHaveLength(6)
    expect(SIZE_TIERS[0].name).toBe('Bé Bỏng')
    expect(SIZE_TIERS[3].name).toBe('Khổng Lồ')
    expect(SIZE_TIERS[5].name).toBe('CHÚA TỂ TITAN')

    expect(getWormSizeTier(0).name).toBe('Bé Bỏng')
    expect(getWormSizeTier(300).name).toBe('Trưởng Thành')
    expect(getWormSizeTier(1000).name).toBe('Dũng Mãnh')
    expect(getWormSizeTier(2500).name).toBe('Khổng Lồ')
    expect(getWormSizeTier(6000).name).toBe('Cự Thú')
    expect(getWormSizeTier(15000).name).toBe('CHÚA TỂ TITAN')

    // Hiệu ứng hào quang Titan, vương miện và sóng xung kích thăng cấp
    expect(wormateRaw).toContain('Hào quang Titan')
    expect(wormateRaw).toContain('drawGoldenCrown')
    expect(wormateRaw).toContain('shockwaves')
    expect(wormateRaw).toContain('LÊN CẤP KHỔNG LỒ')
    expect(audioRaw).toContain('playLevelUp')
  })

  it('Cơ chế game lâu dài: Vòng bo an toàn rộng, co chậm, trừ máu dần ngoài bo và bot tự hồi sinh', () => {
    // Bo ban đầu rộng và đợt 1 kéo dài 120s
    expect(wormateRaw).toContain('countdown: 120')
    expect(wormateRaw).toContain('shrinkDuration: 24')
    expect(wormateRaw).toContain('Math.max(1800')
    // Ngoài bo trừ điểm dần dần không chết đột tử
    expect(wormateRaw).toContain('player.score - dt * 15')
    // AI tự hồi sinh duy trì đấu trường sôi động lâu dài
    expect(wormateRaw).toContain('respawnTimer')
  })
})
