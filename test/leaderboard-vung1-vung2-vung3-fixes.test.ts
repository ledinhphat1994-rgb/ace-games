import { describe, it, expect } from 'vitest'
import leaderboardRaw from '../src/features/hub/LeaderboardPage.tsx?raw'
import gameArtRaw from '../src/features/games/GameArt3D.tsx?raw'

describe('Leaderboard Fixes — Vùng 1, Vùng 2, Vùng 3', () => {
  // ── 1. Vùng 1: Hero Banner — Tiêu đề ngắn gọn, hình nền trọn vẹn không cắt góc ──
  it('1. Vùng 1: Hero banner có tiêu đề ngắn gọn "Bảng xếp hạng", loại bỏ câu dài dòng', () => {
    expect(leaderboardRaw).toContain('Bảng xếp hạng')
    // Không chứa khẩu hiệu hoặc subtitle dài dòng
    expect(leaderboardRaw).not.toContain('Tôn vinh nỗ lực,')
    expect(leaderboardRaw).not.toContain('chinh phục đỉnh cao.')
    expect(leaderboardRaw).not.toContain('Vinh danh thành tích học sinh toàn trường.')
    expect(leaderboardRaw).not.toContain('Xác thực máy chủ tự động')
  })

  it('2. Vùng 1: Hiển thị trọn vẹn toàn cảnh ảnh gốc không cắt góc', () => {
    expect(leaderboardRaw).toContain('aspect-[16/9]')
    expect(leaderboardRaw).toContain('object-contain sm:object-cover')
    expect(leaderboardRaw).toContain('/assets/banners/leaderboard_hero_cyber.webp')
    // Không chứa lớp gradient đen dày che mất nửa bức tranh
    expect(leaderboardRaw).not.toContain('via-[#0d0903]/85 via-45%')
  })

  // ── 2. Vùng 2: Logo Game Tabs — Chạy ngang từ từ & Hold-and-drag kéo qua kéo lại ──
  it('3. Vùng 2: Sử dụng logo game 3D cho tất cả các tab bao gồm học tập', () => {
    expect(gameArtRaw).toContain('export function IconStudy3D')
    expect(leaderboardRaw).toContain('IconStudy3D')
    expect(leaderboardRaw).toContain('IconCrown3D')
    expect(leaderboardRaw).toContain('IconXiangqiPiece3D')
    expect(leaderboardRaw).toContain('IconCaroCubes3D')
    expect(leaderboardRaw).toContain('IconSnakeApple3D')
    expect(leaderboardRaw).toContain('IconManaCrystal3D')
    expect(leaderboardRaw).toContain('size={76}')
  })

  it('4. Vùng 2: Hỗ trợ cuộn ngang tự động (auto-scroll) và hold-and-drag chuột + cảm ứng', () => {
    expect(leaderboardRaw).toContain('scrollTrackRef')
    expect(leaderboardRaw).toContain('requestAnimationFrame')
    expect(leaderboardRaw).toContain('onMouseDown')
    expect(leaderboardRaw).toContain('onMouseMove')
    expect(leaderboardRaw).toContain('onMouseUp')
    expect(leaderboardRaw).toContain('onTouchStart')
    expect(leaderboardRaw).toContain('onTouchMove')
    expect(leaderboardRaw).toContain('onTouchEnd')
    expect(leaderboardRaw).toContain('cursor-grab active:cursor-grabbing')
  })

  // ── 3. Vùng 3: Bảng xếp hạng thật đẹp, màu sắc, thẩm mỹ cao, chuyên nghiệp, không dài dòng ──
  it('5. Vùng 3: Header vinh danh sang trọng với icon Trophy và badge thời gian thực', () => {
    expect(leaderboardRaw).toContain('Bảng vinh danh {activeCategoryConfig.label}')
    expect(leaderboardRaw).toContain('Thời gian thực')
  })

  it('6. Vùng 3: Top 3 Podium và bảng danh sách có màu sắc thẩm mỹ cao, chuyên nghiệp', () => {
    expect(leaderboardRaw).toContain('data-testid="leaderboard-podium"')
    expect(leaderboardRaw).toContain('Quán quân')
    expect(leaderboardRaw).toContain('Á quân')
    expect(leaderboardRaw).toContain('Quý quân')
    expect(leaderboardRaw).toContain('isTop5')
    expect(leaderboardRaw).toContain('isTop10')
    expect(leaderboardRaw).toContain('bg-indigo-500/20 text-indigo-300')
    expect(leaderboardRaw).toContain('bg-cyan-500/15 text-cyan-300')
  })
})
