import { describe, it, expect } from 'vitest'
import menuRaw from '../src/features/games/AiDifficultyHoldMenu.tsx?raw'
import hookRaw from '../src/features/games/useHoldBotDifficulty.ts?raw'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'
import snakeDuelRaw from '../src/features/games/snake/SnakeDuel.tsx?raw'
import cumPvePvpRaw from '../src/features/games/CumPvePvp.tsx?raw'
import wormateRaw from '../src/features/games/snake/Wormate3DArena.tsx?raw'

describe('Tính năng hold icon bot chọn mức độ AI & Tab cài đặt Rắn Săn Mồi', () => {
  it('AiDifficultyHoldMenu và useHoldBotDifficulty tồn tại và hỗ trợ 3 mức độ Dễ, Vừa, Khó', () => {
    expect(menuRaw).toContain("id: 'easy'")
    expect(menuRaw).toContain("id: 'medium'")
    expect(menuRaw).toContain("id: 'hard'")
    expect(menuRaw).toContain("name: 'Dễ'")
    expect(menuRaw).toContain("name: 'Vừa'")
    expect(menuRaw).toContain("name: 'Khó'")
    // Tuyệt đối không chú thích, chỉ ghi tiêu đề (Rule 6)
    expect(menuRaw).not.toContain('sub:')

    expect(hookRaw).toContain('420')
    expect(hookRaw).toContain('onPointerDown')
    expect(hookRaw).toContain('onContextMenu')
    expect(hookRaw).toContain('wrapClickHandler')
  })

  it('Tích hợp hold icon bot vào Cờ Tướng, Cờ Vua, Caro, Trí Nhớ, Rắn Săn Mồi và CumPvePvp', () => {
    expect(xiangqiRaw).toContain('useHoldBotDifficulty')
    expect(xiangqiRaw).toContain('AiDifficultyHoldMenu')
    expect(xiangqiRaw).toContain('isModeTool ? botHoldHandlers')

    expect(chessRaw).toContain('useHoldBotDifficulty')
    expect(chessRaw).toContain('AiDifficultyHoldMenu')
    expect(chessRaw).toContain('isModeTool ? botHoldHandlers')

    expect(caroRaw).toContain('useHoldBotDifficulty')
    expect(caroRaw).toContain('AiDifficultyHoldMenu')
    expect(caroRaw).toContain('isModeTool ? botHoldHandlers')

    expect(memoryRaw).toContain('useHoldBotDifficulty')
    expect(memoryRaw).toContain('AiDifficultyHoldMenu')
    expect(memoryRaw).toContain('isModeTool ? botHoldHandlers')

    expect(snakeDuelRaw).toContain('useHoldBotDifficulty')
    expect(snakeDuelRaw).toContain('AiDifficultyHoldMenu')
    expect(snakeDuelRaw).toContain('nut-che-do-choi')

    expect(cumPvePvpRaw).toContain('useHoldBotDifficulty')
    expect(cumPvePvpRaw).toContain('AiDifficultyHoldMenu')
    expect(cumPvePvpRaw).toContain('che-do-pve')
  })

  it('Wormate3DArena có đầy đủ 3 tab: Cài Đặt, Skin Rắn, Âm Thanh với bảng chính cố định', () => {
    // Bảng chính cố định 100% kích thước
    expect(wormateRaw).toContain('w-[min(540px,calc(100vw-1.5rem))] h-[500px] min-h-[500px] max-h-[500px]')
    expect(wormateRaw).toContain('h-[360px] min-h-[360px] max-h-[360px]')

    // 3 Tab định danh rõ ràng
    expect(wormateRaw).toContain('data-testid="tab-snake-settings"')
    expect(wormateRaw).toContain('data-testid="tab-snake-skin"')
    expect(wormateRaw).toContain('data-testid="tab-snake-audio"')

    // Tab Cài Đặt chứa Mức độ AI bot và Số lượng rắn AI
    expect(wormateRaw).toContain('data-testid="snake-settings-panel"')
    expect(wormateRaw).toContain('Mức Độ Rắn AI')
    expect(wormateRaw).toContain('snake-diff-')

    // Số lượng rắn AI: Mặc định + Tùy chỉnh 1 hàng tinh gọn
    expect(wormateRaw).toContain('Số Lượng Rắn AI')
    expect(wormateRaw).toContain('snake-count-preset-')
    expect(wormateRaw).toContain('data-testid="snake-count-decrement"')
    expect(wormateRaw).toContain('data-testid="snake-count-increment"')
    expect(wormateRaw).toContain('Tùy chỉnh')
  })
})
