import { describe, expect, it } from 'vitest'
import toolbarRaw from '../src/features/games/GamePlayToolbar.tsx?raw'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'

describe('Gộp Vùng 1 và Vùng 2 vào Vùng 3 và căn giữa bàn cờ', () => {
  it('GamePlayToolbar hỗ trợ opponentSlot và playerSlot và căn giữa tuyệt đối 50%', () => {
    expect(toolbarRaw).toContain('opponentSlot?: React.ReactNode')
    expect(toolbarRaw).toContain('playerSlot?: React.ReactNode')
    expect(toolbarRaw).toContain('sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:z-10')
    expect(toolbarRaw).toContain('bg-surface-raised/90 backdrop-blur-md shadow-xs')
  })

  it('Cờ Tướng: tích hợp opponentSlot, playerSlot và bỏ thanh đối thủ/người chơi riêng', () => {
    expect(xiangqiRaw).toContain('opponentSlot={opponentSlotContent}')
    expect(xiangqiRaw).toContain('playerSlot={playerSlotContent}')
    expect(xiangqiRaw).not.toContain('THANH ĐỐI THỦ (TRÊN BÀN CỜ)')
    expect(xiangqiRaw).not.toContain('THANH NGƯỜI CHƠI (DƯỚI BÀN CỜ)')
  })

  it('Cờ Vua: tích hợp opponentSlot, playerSlot, có spacer cân bằng và không trùng nút Xin thua', () => {
    expect(chessRaw).toContain('opponentSlot={opponentSlotContent}')
    expect(chessRaw).toContain('playerSlot={playerSlotContent}')
    expect(chessRaw).not.toContain('THANH ĐỐI THỦ (TRÊN BÀN CỜ)')
    expect(chessRaw).not.toContain('THANH NGƯỜI CHƠI (DƯỚI BÀN CỜ)')
    // Spacer cân bằng cho Cờ vua đạt 50% căn giữa
    expect(chessRaw).toContain('CỘT CÂN BẰNG TRÁI')
    // Không trùng nút Xin thua ở cột phải
    expect(chessRaw).not.toContain('Nút hành động nhanh ở đáy')
  })

  it('Cờ Caro: tích hợp opponentSlot, playerSlot và bỏ thanh đối thủ/người chơi riêng', () => {
    expect(caroRaw).toContain('opponentSlot={opponentSlotContent}')
    expect(caroRaw).toContain('playerSlot={playerSlotContent}')
    expect(caroRaw).not.toContain('THANH ĐỐI THỦ (TRÊN BÀN CỜ)')
    expect(caroRaw).not.toContain('THANH NGƯỜI CHƠI (DƯỚI BÀN CỜ)')
  })

  it('Lật Thẻ Trí Nhớ: tích hợp opponentSlot, playerSlot và bỏ dải đối thủ/người chơi riêng', () => {
    expect(memoryRaw).toContain('opponentSlot={opponentSlotContent}')
    expect(memoryRaw).toContain('playerSlot={playerSlotContent}')
    expect(memoryRaw).not.toContain('DẢI ĐỐI THỦ (TRÊN BÀN CHƠI)')
    expect(memoryRaw).not.toContain('DẢI NGƯỜI CHƠI (DƯỚI BÀN CHƠI)')
    // Bảo vệ không rò rỉ từ online theo test UI-6C
    expect(memoryRaw).not.toContain('online')
  })
})
