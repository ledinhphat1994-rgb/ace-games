import { describe, expect, it } from 'vitest'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'

describe('Đồng bộ thanh công cụ đáy Vùng 2 và tin nhắn nhanh đối xứng cho 4 game', () => {
  const games = [
    { name: 'Cờ Vua', raw: chessRaw },
    { name: 'Cờ Caro', raw: caroRaw },
    { name: 'Cờ Tướng', raw: xiangqiRaw },
    { name: 'Trí Nhớ', raw: memoryRaw },
  ]

  games.forEach(({ name, raw }) => {
    describe(`Game: ${name}`, () => {
      it('nút Sảnh đã xóa chữ Sảnh, chỉ còn icon mũi tên ArrowLeft trong nút', () => {
        const leaveBtnMatch = raw.match(/id="game-leave-btn"[\s\S]*?<\/button>/)
        expect(leaveBtnMatch).toBeTruthy()
        const leaveBtnHtml = leaveBtnMatch![0]
        expect(leaveBtnHtml).toContain('<ArrowLeft')
        expect(leaveBtnHtml).not.toContain('<span>Sảnh</span>')
        expect(leaveBtnHtml).not.toContain('>Sảnh<')
      })

      it('thanh công cụ mobile-tools-bar được đưa xuống Vùng 2 (đáy màn hình) cách đều', () => {
        expect(raw).toContain('id="mobile-tools-bar"')
        expect(raw).toContain('fixed bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))] left-2.5 sm:left-3.5 right-2.5 sm:right-3.5')
        expect(raw).toContain('items-center justify-between')
      })

      it('tin nhắn nhanh hiển thị ở Vùng X đối với địch (trên thanh đối thủ)', () => {
        expect(raw).toContain('VÙNG X: TIN NHẮN NHANH CỦA ĐỐI THỦ (TRÊN THANH ĐỐI THỦ)')
        expect(raw).toContain('data-testid="opponent-quick-message-bubble"')
      })

      it('tin nhắn nhanh hiển thị ở vị trí đối xứng đối với ta (dưới thanh người chơi)', () => {
        expect(raw).toContain('VỊ TRÍ ĐỐI XỨNG: TIN NHẮN NHANH CỦA TA (DƯỚI THANH NGƯỜI CHƠI)')
        expect(raw).toContain('data-testid="player-quick-message-bubble"')
      })
    })
  })
})
