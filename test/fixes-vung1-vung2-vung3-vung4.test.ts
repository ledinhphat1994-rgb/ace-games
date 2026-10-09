import { describe, it, expect } from 'vitest'
import gameLobbyRaw from '../src/features/games/GameLobbyView.tsx?raw'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'

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

  describe('Yêu cầu 3 (Ảnh 3): Đưa Vùng 3 (Số bàn đấu) xuống Vùng X ở góc trái dưới cùng', () => {
    it('badge số bàn không còn nằm trong top header cạnh nút Sảnh', () => {
      // Header chỉ còn Sảnh và Riêng tư
      const headerArea = xiangqiBoardRaw.slice(
        xiangqiBoardRaw.indexOf('<header'),
        xiangqiBoardRaw.indexOf('</header>')
      )
      expect(headerArea).not.toContain('soPhongHienThi')
      expect(headerArea).not.toContain('帥')
    })

    it('badge số bàn được chuyển xuống vị trí Vùng X ở góc trái dưới cùng', () => {
      expect(xiangqiBoardRaw).toContain('id="room-number-badge-bottom-left"')
      expect(xiangqiBoardRaw).toContain('fixed bottom-3 left-3')
      expect(xiangqiBoardRaw).toContain('#{soPhongHienThi || \'55\'}')
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
})
