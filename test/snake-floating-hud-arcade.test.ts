import { describe, it, expect } from 'vitest'
import appShellRaw from '../src/components/layout/AppShell.tsx?raw'
import soloPageRaw from '../src/features/games/SoloGamePage.tsx?raw'
import snakeDuelRaw from '../src/features/games/snake/SnakeDuel.tsx?raw'
import wormateRaw from '../src/features/games/snake/Wormate3DArena.tsx?raw'
import { env } from 'cloudflare:test'
const indexCssRaw = ((env as any).INDEX_CSS ?? '') as string

describe('Chuẩn Quốc Tế Arcade: Tràn viền 100% màn hình & HUD nổi kính mờ cho Rắn Săn Mồi', () => {
  it('AppShell: Ẩn hoàn toàn AppHeader khi chơi Rắn Săn Mồi để giải phóng góc nhìn 360 độ', () => {
    expect(appShellRaw).toContain('!isFullscreen && !isSnakeGame')
    expect(appShellRaw).toContain("isSnakeGame\n                ? 'flex flex-col p-0 m-0 max-w-none w-full h-full min-h-0 overflow-hidden touch-none'")
  })

  it('SoloGamePage: Xóa toàn bộ viền và padding cứng cho solo_snake để chiếm trọn toàn màn hình', () => {
    expect(soloPageRaw).toContain("gameType === 'solo_snake'")
    expect(soloPageRaw).toContain('p-0 border-0 rounded-none bg-slate-950 shadow-none')
  })

  it('SnakeDuel: Kích hoạt floatingHud={true} cho GamePlayToolbar', () => {
    expect(snakeDuelRaw).toContain('<GamePlayToolbar')
    expect(snakeDuelRaw).toContain('floatingHud={true}')
  })

  it('CSS: Định nghĩa HUD nổi kính mờ (.game-toolbar-floating-hud) không chiếm chiều cao layout', () => {
    expect(indexCssRaw).toContain('.game-toolbar-frame.game-toolbar-floating-hud')
    expect(indexCssRaw).toContain('position: absolute !important;')
    expect(indexCssRaw).toContain('backdrop-filter: blur(12px) !important;')
    expect(indexCssRaw).toContain('border-radius: 9999px !important;')
  })

  it('Wormate3DArena: Sắp xếp HUD Top 3 và radar minimap hài hòa, không đè nút nổi', () => {
    expect(wormateRaw).toContain('absolute top-14 left-3 z-10')
    expect(wormateRaw).toContain('const mapY = isMobile ? 48 : 54')
  })
})
