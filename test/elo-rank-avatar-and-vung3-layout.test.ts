import { describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { getEloRankTier } from '../src/features/games/EloRankAvatarFrame'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'

const indexCssRaw = ((env as any).INDEX_CSS ?? '') as string

describe('EloRankAvatarFrame & Vùng 3 đồng bộ Vùng 2', () => {
  it('Phân loại chính xác 7 bậc cấp Elo rank và xếp hạng Bot', () => {
    // Bot luôn là bậc Tinh Anh (3)
    const botTier = getEloRankTier(1000, true)
    expect(botTier.tier).toBe(3)
    expect(botTier.title).toBe('AI Cấp Cao')

    // 1. Tân Thủ (Bronze): < 1200
    expect(getEloRankTier(1000).tier).toBe(1)
    expect(getEloRankTier(1000).title).toBe('Tân Thủ')
    expect(getEloRankTier(1199).tier).toBe(1)

    // 2. Chiến Binh (Silver): 1200 - 1399
    expect(getEloRankTier(1200).tier).toBe(2)
    expect(getEloRankTier(1200).title).toBe('Chiến Binh')
    expect(getEloRankTier(1399).tier).toBe(2)

    // 3. Tinh Anh (Gold): 1400 - 1599
    expect(getEloRankTier(1400).tier).toBe(3)
    expect(getEloRankTier(1400).title).toBe('Tinh Anh')

    // 4. Cao Thủ (Platinum): 1600 - 1799
    expect(getEloRankTier(1600).tier).toBe(4)
    expect(getEloRankTier(1600).title).toBe('Cao Thủ')

    // 5. Kiện Tướng (Diamond): 1800 - 1999
    expect(getEloRankTier(1800).tier).toBe(5)
    expect(getEloRankTier(1800).title).toBe('Kiện Tướng')

    // 6. Đại Kiện Tướng (Master): 2000 - 2199
    expect(getEloRankTier(2000).tier).toBe(6)
    expect(getEloRankTier(2000).title).toBe('Đại Kiện Tướng')

    // 7. Thần Thoại (Mythic): >= 2200
    expect(getEloRankTier(2200).tier).toBe(7)
    expect(getEloRankTier(2200).title).toBe('Thần Thoại')
    expect(getEloRankTier(2800).tier).toBe(7)
  })

  it('Cờ Tướng: Tích hợp EloRankAvatarFrame, bỏ kí hiệu cờ đính kèm avatar, Vùng 3 đồng bộ Vùng 2', () => {
    expect(xiangqiRaw).toContain('EloRankAvatarFrame')
    // Không còn badge đĩa cờ đính kèm góc avatar
    expect(xiangqiRaw).not.toContain('absolute -bottom-1 -right-1')
    // Vùng 3 không có mt-auto đẩy tạo khoảng trống
    expect(xiangqiRaw).not.toContain('mt-auto shrink-0 flex flex-col gap-1.5 w-full')
    // Avatar sử dụng kích thước lớn
    expect(xiangqiRaw).toContain('sizeClassName="size-11 sm:size-12"')
  })

  it('Cờ Vua: Tích hợp EloRankAvatarFrame, bỏ kí hiệu cờ đính kèm avatar, Vùng 3 đồng bộ Vùng 2', () => {
    expect(chessRaw).toContain('EloRankAvatarFrame')
    expect(chessRaw).not.toContain('absolute -bottom-1 -right-1')
    expect(chessRaw).not.toContain('mt-auto shrink-0 flex flex-col gap-1.5 w-full')
    expect(chessRaw).toContain('sizeClassName="size-11 sm:size-12"')
  })

  it('Cờ Caro: Tích hợp EloRankAvatarFrame, bỏ kí hiệu cờ đính kèm avatar, Vùng 3 đồng bộ Vùng 2', () => {
    expect(caroRaw).toContain('EloRankAvatarFrame')
    expect(caroRaw).not.toContain('absolute -bottom-1 -right-1')
    expect(caroRaw).toContain('sizeClassName="size-11 sm:size-12"')
  })

  it('Bàn cờ nở tối đa theo chiều cao còn lại của màn hình trong CSS', () => {
    if (indexCssRaw) {
      expect(indexCssRaw).toContain('.game-board-xiangqi')
      expect(indexCssRaw).toContain('max-height: calc(100dvh - 165px)')
      expect(indexCssRaw).toContain('.game-board-chess')
      expect(indexCssRaw).toContain('.game-board-caro')
    }
  })
})
