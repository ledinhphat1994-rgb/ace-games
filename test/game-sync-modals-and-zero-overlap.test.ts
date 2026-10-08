import { describe, expect, it } from 'vitest'
import chessBoardRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroBoardRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'
import heroicBannerRaw from '../src/features/games/GameHeroicBanner.tsx?raw'
import drawModalRaw from '../src/features/games/GameDrawModal.tsx?raw'
import surrenderModalRaw from '../src/features/games/GameSurrenderModal.tsx?raw'
import modalMoiRaw from '../src/features/games/ModalMoiNguoiChoi.tsx?raw'
import profileRaw from '../src/features/hub/ProfilePage.tsx?raw'
import progressPanelRaw from '../src/features/profile/ProgressPanel.tsx?raw'
import wormateHudRaw from '../src/features/games/snake/Wormate3DArena.tsx?raw'
import soloGameRaw from '../src/features/games/SoloGamePage.tsx?raw'
import indexCssRaw from '../src/index.css?raw'

describe('Game UI Đồng Bộ: Zero Overlap cho Banner BẠN THUA / ĐẤU LẠI & Chuẩn Hóa Popup Cùng Cấp', () => {
  it('ChessBoard và CaroBoard ẩn nút ĐẤU LẠI khi đang hiển thị heroicBanner để loại bỏ hoàn toàn đè chữ', () => {
    // ChessBoard: không render đồng thời heroicBanner và nút bắt đầu / đấu lại
    expect(chessBoardRaw).toContain("!heroicBanner")
    expect(chessBoardRaw).toMatch(/\(!isPlaying && !isOver && !heroicBanner\)/)
    expect(chessBoardRaw).toMatch(/\(isOver && !isPlaying && !heroicBanner\)/)

    // CaroBoard: tương tự
    expect(caroBoardRaw).toContain("!heroicBanner")
    expect(caroBoardRaw).toMatch(/\(!isPlaying && !winner && !heroicBanner\)/)
    expect(caroBoardRaw).toMatch(/\(Boolean\(winner\) && !isPlaying && !heroicBanner\)/)

    // XiangqiBoard cũng đã giữ nguyên tính chất an toàn này
    expect(xiangqiBoardRaw).toContain("!heroicBanner")
  })

  it('GameHeroicBanner hỗ trợ click để đóng nhanh và giải phóng nút chơi lại ngay lập tức', () => {
    expect(heroicBannerRaw).toContain('pointer-events-auto cursor-pointer')
    expect(heroicBannerRaw).toContain('onClick={() => onCloseRef.current?.()}')
  })

  it('GameDrawModal và GameSurrenderModal đồng bộ vị trí giữa màn cờ và cùng style Skeuomorphic Blueprint', () => {
    // Không bị ghim cứng lên đỉnh top: 72px mà căn giữa màn cờ (Zone 3)
    expect(drawModalRaw).not.toContain("top: '72px'")
    expect(surrenderModalRaw).not.toContain("top: '72px'")

    // Chuẩn bề mặt Skeuomorphic & BlueprintArcadePattern
    expect(drawModalRaw).toContain('skeuo-modal-surface')
    expect(drawModalRaw).toContain('BlueprintArcadePattern')
    expect(surrenderModalRaw).toContain('skeuo-modal-surface')
    expect(surrenderModalRaw).toContain('BlueprintArcadePattern')

    // Chuẩn nút bấm đồng bộ
    expect(drawModalRaw).toContain('skeuo-btn-cancel')
    expect(drawModalRaw).toContain('skeuo-btn-cta-amber')
    expect(surrenderModalRaw).toContain('skeuo-btn-cancel')
    expect(surrenderModalRaw).toContain('skeuo-btn-cta-amber')
  })

  it('ModalMoiNguoiChoi hiển thị ở giữa màn cờ (Zone 3) không bị ghim top 72px', () => {
    expect(modalMoiRaw).not.toContain("top: '72px'")
    expect(modalMoiRaw).toContain('skeuo-modal-surface')
  })

  it('XiangqiBoard center-board-dialog đồng bộ bề mặt skeuo-modal-surface và BlueprintArcadePattern', () => {
    expect(xiangqiBoardRaw).toContain('skeuo-modal-surface')
    expect(xiangqiBoardRaw).toContain('BlueprintArcadePattern')
  })

  it('Nút và nhãn Xin thua / Đầu hàng đồng nhất trên cả 4 game cờ và trí tuệ', () => {
    expect(chessBoardRaw).toContain('Xin thua / Đầu hàng')
    expect(caroBoardRaw).toContain('Xin thua / Đầu hàng')
    expect(memoryRaw).toContain('Xin thua / Đầu hàng')
    expect(xiangqiBoardRaw).toContain('Xin thua / Đầu hàng')
    expect(surrenderModalRaw).toContain('Xin thua / Đầu hàng')
  })

  it('XiangqiBoard hiển thị trọn vẹn tin nhắn nhanh và popup căn giữa màn cờ', () => {
    expect(xiangqiBoardRaw).not.toContain('truncate max-w-[100px]')
    expect(xiangqiBoardRaw).toContain('top: \'auto\'')
    expect(xiangqiBoardRaw).toContain('left: \'auto\'')
    expect(xiangqiBoardRaw).toContain('transform: \'none\'')
  })

  it('Snake game sử dụng trọn vẹn map không bị co rút card riêng và HUD chống chồng chéo text', () => {
    expect(soloGameRaw).not.toMatch(/gameType === 'solo_snake'\s*\?\s*'[^\']*game-stage/)
    expect(wormateHudRaw).toContain('whitespace-nowrap')
  })

  it('Hồ sơ tối giản không dùng banner ảnh bìa, tập trung vào Thành tựu và dialog không bị trôi nóc', () => {
    expect(profileRaw).not.toContain('profile_cover_clean.jpg')
    expect(profileRaw).not.toContain('-mt-14')
    expect(progressPanelRaw).toContain('Thành tựu')
    // skeuo-modal-surface không gán cứng top 72px hay fixed làm trôi nóc modal
    expect(indexCssRaw).not.toMatch(/\.skeuo-modal-surface\s*\{[^}]*top:\s*72px/)
    expect(indexCssRaw).not.toMatch(/\.skeuo-modal-surface\s*\{[^}]*position:\s*fixed/)
  })
})
