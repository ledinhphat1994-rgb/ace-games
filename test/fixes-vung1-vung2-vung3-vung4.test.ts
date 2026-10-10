import { describe, it, expect } from 'vitest'
import gameLobbyRaw from '../src/features/games/GameLobbyView.tsx?raw'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import thePhongGameRaw from '../src/features/games/ThePhongGame.tsx?raw'
import chessBoardRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroBoardRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryGameRaw from '../src/features/games/memory/MemoryGame.tsx?raw'
import appShellRaw from '../src/components/layout/AppShell.tsx?raw'

describe('Kiểm tra 4 vùng fix theo yêu cầu người dùng (Ảnh 1, 2, 3)', () => {
  describe('Yêu cầu 1 (Ảnh 1): Vùng 1 tiêu đề là "Bàn đấu", các nội dung trong vùng để trống', () => {
    it('tiêu đề khung bàn đấu là "Bàn đấu", không còn "Khung bàn đấu"', () => {
      expect(gameLobbyRaw).toContain('Bàn đấu')
      expect(gameLobbyRaw).not.toContain('Khung bàn đấu')
    })

    it('đã xóa hết các nội dung bên trong vùng: tag "Sẵn sàng mở bàn", bàn dummy và chữ giải thích', () => {
      expect(gameLobbyRaw).not.toContain('Sẵn sàng mở bàn')
      expect(gameLobbyRaw).not.toContain('Bàn đấu #1')
      expect(gameLobbyRaw).not.toContain('Bàn đấu #2')
      expect(gameLobbyRaw).not.toContain('Bàn thi đấu sẽ tự động xuất hiện tại đây khi người chơi tạo phòng.')
    })
  })

  describe('Yêu cầu 2 (Ảnh 2): Popup tạo phòng hiển thị trọn vẹn, không bị cắt nửa trên mobile', () => {
    it('DialogContent tạo phòng căn giữa chuẩn, không dùng max-sm:top-24 gây trôi mất nửa popup', () => {
      expect(gameLobbyRaw).not.toContain('max-sm:top-24')
      expect(gameLobbyRaw).not.toContain('max-sm:h-[calc(100svh-6rem)]')
      expect(gameLobbyRaw).toContain('fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2')
      expect(gameLobbyRaw).toContain('max-h-[calc(100svh-2rem)]')
    })

    it('giữ thanh footer CTA và nút Tạo bàn ngay cố định ở đáy modal', () => {
      expect(gameLobbyRaw).toContain('Tạo bàn ngay')
      expect(gameLobbyRaw).toContain('border-t border-slate-800/80 shrink-0')
    })
  })

  describe('Yêu cầu hoán đổi Vùng 1, Vùng 2 và Vùng X theo ảnh mới nhất', () => {
    it('Vùng 2 (số bàn đấu) thay thế Vùng 1 trên top header', () => {
      const headerArea = xiangqiBoardRaw.slice(
        xiangqiBoardRaw.indexOf('<header'),
        xiangqiBoardRaw.indexOf('</header>')
      )
      expect(headerArea).toContain('id="room-number-badge-header"')
      expect(headerArea).toContain('soPhongHienThi')
      expect(headerArea).toContain('帥')
      expect(headerArea).not.toContain('id="game-leave-btn"')
    })

    it('Vùng 1 (nút Sảnh) được chuyển xuống cùng hàng với icon tin nhắn nổi và bảo vệ safe area chống bị che', () => {
      expect(xiangqiBoardRaw).toContain('id="game-leave-btn"')
      expect(xiangqiBoardRaw).toContain('fixed bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))] left-2.5 sm:left-3.5')
      expect(xiangqiBoardRaw).not.toContain('id="room-number-badge-bottom-left"')
    })
  })

  describe('Yêu cầu 4 (Ảnh 3): Vùng 4 icon to rõ và sửa chức năng nhắn tin nhanh không dùng được', () => {
    it('các nút công cụ trên mobile có kích thước to rõ (size-11 sm:size-12) và icon size-5 sm:size-5.5', () => {
      expect(xiangqiBoardRaw).toContain('size-11 sm:size-12 rounded-2xl')
      expect(xiangqiBoardRaw).toContain('size-5 sm:size-5.5')
    })

    it('có bảng tin nhắn nhanh riêng cho mobile nằm dưới thanh công cụ', () => {
      expect(xiangqiBoardRaw).toContain('id="mobile-quick-menu-container"')
      expect(xiangqiBoardRaw).toContain('Tin nhắn nhanh')
    })

    it('bảng tin nhắn nhanh chứa đủ emoji và câu thoại cờ tướng tương tác mượt mà', () => {
      expect(xiangqiBoardRaw).toContain('Nước cờ hay')
      expect(xiangqiBoardRaw).toContain('Xin chỉ giáo')
      expect(xiangqiBoardRaw).toContain('Chiến tiếp nào')
    })

    it('sửa lỗi handleClickOutside không tự ý đóng khi bấm vào nút biểu cảm trên mobile', () => {
      expect(xiangqiBoardRaw).toContain('#tool-bubble-emoji, #mobile-tool-emoji')
    })
  })

  describe('Yêu cầu mới: Xóa vùng X (thùng rác), Fix vùng 1 để trống nếu phòng không có ai, Fix vùng 2 đưa search xuống bàn đấu', () => {
    it('Xóa vùng X: nút thùng rác Trash2 đã bị xóa hoàn toàn khỏi ThePhongGame', () => {
      expect(thePhongGameRaw).not.toContain('<Trash2')
      expect(thePhongGameRaw).not.toContain('Hủy bàn đấu')
    })

    it('Fix vùng 1: Nếu phòng không có ai thì để trống vị trí chứ không tự thêm vào', () => {
      expect(thePhongGameRaw).toContain('hasPlayer={Boolean(room.tenChu)}')
      expect(thePhongGameRaw).toContain("ten={room.tenChu || 'Chờ đối thủ'}")
      expect(gameLobbyRaw).toContain('tenChu: t.tenChu')
      expect(gameLobbyRaw).not.toContain('tenChu: localMeta?.tenChu || t.tenChu')
    })

    it('Fix vùng 2: Đưa thanh search xuống khu vực bàn đấu để tiện tìm phòng', () => {
      expect(gameLobbyRaw).toContain('KHU VỰC BÀN ĐẤU')
      expect(gameLobbyRaw).toContain('data-testid="game-search-input"')
      // Kiểm tra vị trí thanh search nằm ngay trước game-rooms-list
      const searchIdx = gameLobbyRaw.indexOf('data-testid="game-search-input"')
      const roomsListIdx = gameLobbyRaw.indexOf('data-testid="game-rooms-list"')
      expect(searchIdx).toBeGreaterThan(0)
      expect(roomsListIdx).toBeGreaterThan(searchIdx)
    })
  })

  describe('Yêu cầu mới: Fix vùng 1 bị che & Lấy cờ tướng làm chuẩn cho cờ vua, caro, trí nhớ', () => {
    it('Fix vùng 1 bị che: nút Sảnh và chat nổi đều có safe area offset bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))]', () => {
      expect(xiangqiBoardRaw).toContain("bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))]")
      expect(appShellRaw).toContain("bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))]")
    })

    it('Cờ Vua áp dụng chuẩn cờ tướng: header có id="room-number-badge-header", không có nút Sảnh ở header, nút Sảnh ở đáy trái', () => {
      const headerArea = chessBoardRaw.slice(
        chessBoardRaw.indexOf('<header'),
        chessBoardRaw.indexOf('</header>')
      )
      expect(headerArea).toContain('id="room-number-badge-header"')
      expect(headerArea).not.toContain('id="game-leave-btn"')
      expect(chessBoardRaw).toContain('id="game-leave-btn"')
      expect(chessBoardRaw).toContain('fixed bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))] left-2.5 sm:left-3.5')
      expect(chessBoardRaw).toContain('size-11 sm:size-12 rounded-2xl')
      expect(chessBoardRaw).toContain('[&_svg]:size-5 [&_svg]:sm:size-5.5')
    })

    it('Cờ Caro áp dụng chuẩn cờ tướng: header có id="room-number-badge-header", không có nút Sảnh ở header, nút Sảnh ở đáy trái', () => {
      const headerArea = caroBoardRaw.slice(
        caroBoardRaw.indexOf('<header'),
        caroBoardRaw.indexOf('</header>')
      )
      expect(headerArea).toContain('id="room-number-badge-header"')
      expect(headerArea).not.toContain('id="game-leave-btn"')
      expect(caroBoardRaw).toContain('id="game-leave-btn"')
      expect(caroBoardRaw).toContain('fixed bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))] left-2.5 sm:left-3.5')
      expect(caroBoardRaw).toContain('size-11 sm:size-12 rounded-2xl')
      expect(caroBoardRaw).toContain('[&_svg]:size-5 [&_svg]:sm:size-5.5')
    })

    it('Trí Nhớ áp dụng chuẩn cờ tướng: header có id="room-number-badge-header", không có nút Sảnh ở header, nút Sảnh ở đáy trái', () => {
      const headerArea = memoryGameRaw.slice(
        memoryGameRaw.indexOf('<header'),
        memoryGameRaw.indexOf('</header>')
      )
      expect(headerArea).toContain('id="room-number-badge-header"')
      expect(headerArea).not.toContain('id="game-leave-btn"')
      expect(memoryGameRaw).toContain('id="game-leave-btn"')
      expect(memoryGameRaw).toContain('fixed bottom-[max(0.875rem,calc(env(safe-area-inset-bottom,0px)+0.625rem))] left-2.5 sm:left-3.5')
      expect(memoryGameRaw).toContain('size-11 sm:size-12 rounded-2xl')
      expect(memoryGameRaw).toContain('[&_svg]:size-5 [&_svg]:sm:size-5.5')
    })
  })
})
