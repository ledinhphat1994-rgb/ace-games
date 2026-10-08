import { describe, expect, it } from 'vitest'
import chessBoardCode from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroBoardCode from '../src/features/games/caro/CaroBoard.tsx?raw'

describe('Game Chess & Caro - Vùng 1 & Vùng 2 Quality and Invariants', () => {
  describe('Vùng 1: Nút BẮT ĐẦU ngăn chặn khi chưa đủ 2 người chơi', () => {
    it('ChessBoard: kiểm tra coDuNguoiChoi và vô hiệu hóa nút bắt đầu khi chưa đủ 2 người chơi online', () => {
      expect(chessBoardCode).toContain('const coDuNguoiChoi = !laOnlinePvp || Boolean(banOnline?.meta.playerX && banOnline?.meta.playerO)')
      expect(chessBoardCode).toContain('disabled={laOnlinePvp && !coDuNguoiChoi}')
      expect(chessBoardCode).toContain('cursor-not-allowed shadow-none')
      expect(chessBoardCode).toContain('Cần đủ 2 người chơi để bắt đầu ván đấu')
    })

    it('ChessBoard: handleStartGameClick ngăn không gửi websocket khi chưa đủ 2 người chơi', () => {
      expect(chessBoardCode).toContain('if (!banOnline.meta?.playerX || !banOnline.meta?.playerO) {')
    })

    it('CaroBoard: kiểm tra coDuNguoiChoi và vô hiệu hóa nút bắt đầu khi chưa đủ 2 người chơi online', () => {
      expect(caroBoardCode).toContain('const coDuNguoiChoi = !laOnlinePvp || Boolean(banOnline?.meta.playerX && banOnline?.meta.playerO)')
      expect(caroBoardCode).toContain('disabled={laOnlinePvp && !coDuNguoiChoi}')
      expect(caroBoardCode).toContain('cursor-not-allowed shadow-none')
      expect(caroBoardCode).toContain('Cần đủ 2 người chơi để bắt đầu ván đấu')
    })

    it('CaroBoard: handleStartGameClick ngăn không gửi websocket khi chưa đủ 2 người chơi', () => {
      expect(caroBoardCode).toContain('if (!banOnline.meta?.playerX || !banOnline.meta?.playerO) {')
    })
  })

  describe('Vùng 2: Tin nhắn nhanh ở mobile hiển thị đầy đủ và không đè lên bàn cờ', () => {
    it('ChessBoard: có container riêng cho mobile nằm dưới toolbar (không đè lên bàn cờ)', () => {
      expect(chessBoardCode).toContain('id="mobile-quick-menu-container"')
      expect(chessBoardCode).toContain('className="flex xl:hidden w-full max-w-[480px]')
    })

    it('ChessBoard: hiển thị đầy đủ icon và quote nội dung tin nhắn nhanh', () => {
      expect(chessBoardCode).toContain('{item.emoji}')
      expect(chessBoardCode).toContain('{item.quote}')
      expect(chessBoardCode).toContain('DANH_SACH_THAI_DO_CHESS.map')
    })

    it('CaroBoard: có container riêng cho mobile nằm dưới toolbar (không đè lên bàn cờ)', () => {
      expect(caroBoardCode).toContain('id="mobile-quick-menu-container"')
      expect(caroBoardCode).toContain('className="flex xl:hidden w-full max-w-[480px]')
    })

    it('CaroBoard: hiển thị đầy đủ icon và quote nội dung tin nhắn nhanh', () => {
      expect(caroBoardCode).toContain('{item.emoji}')
      expect(caroBoardCode).toContain('{item.quote}')
      expect(caroBoardCode).toContain('QUICK_EMOTES_CARO.map')
    })
  })
})
