import { describe, expect, it } from 'vitest'
import drawModalRaw from '../src/features/games/GameDrawModal.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'

describe('Đồng bộ Vùng 5 Game Trí Nhớ & Cân đối nội dung Popup Đề Nghị Hòa', () => {
  describe('Popup 6 (GameDrawModal): Cân đối nội dung với card popup', () => {
    it('căn giữa biểu tượng handshake và câu xác nhận, card gọn gàng cân đối', () => {
      // Biểu tượng Handshake căn giữa với kích thước size-12
      expect(drawModalRaw).toContain('size-12 rounded-2xl border flex items-center justify-center')
      expect(drawModalRaw).toContain('<Handshake className="size-6" />')

      // Nội dung câu xác nhận căn giữa cân đối
      expect(drawModalRaw).toContain('flex flex-col items-center justify-center py-2 text-center space-y-2.5')
      expect(drawModalRaw).toContain('max-w-[280px]')

      // Kích thước card gọn gàng cân đối (340px)
      expect(drawModalRaw).toContain('w-[min(340px,calc(100vw-2rem))]')
      expect(drawModalRaw).toContain('skeuo-modal-surface')
      expect(drawModalRaw).toContain('BlueprintArcadePattern')
    })
  })

  describe('Vùng 5 Game Trí Nhớ: Đồng bộ layout đối kháng giống Cờ Tướng, Cờ Vua, Caro', () => {
    it('có thanh thông tin đối thủ trên mobile (flex xl:hidden) nằm trên bàn chơi', () => {
      expect(memoryRaw).toContain('THÔNG TIN ĐỐI THỦ TRÊN MOBILE (< xl)')
      expect(memoryRaw).toContain('flex xl:hidden w-full max-w-[480px] h-12 px-2 items-center justify-between mb-1 select-none z-20')
      expect(memoryRaw).toContain('title="Thời gian đối thủ"')
    })

    it('có thanh thông tin người chơi trên mobile (flex xl:hidden) nằm dưới bàn chơi', () => {
      expect(memoryRaw).toContain('KHU VỰC NGƯỜI CHƠI CHÂN MÀN HÌNH (< xl)')
      expect(memoryRaw).toContain('flex xl:hidden w-full max-w-[480px] h-12 px-2 items-center justify-between mt-1 select-none z-20')
      expect(memoryRaw).toContain('title="Thời gian của Bạn"')
    })

    it('có thanh công cụ 1 hàng ngang mobile-tools-bar chuẩn 5 nút theo chuẩn Cờ Tướng', () => {
      expect(memoryRaw).toContain('id="mobile-tools-bar"')
      expect(memoryRaw).toContain('flex xl:hidden w-full max-w-[480px] h-12 px-2 items-center justify-center')
      expect(memoryRaw).toContain('id={`mobile-tool-${tool.id}`}')
    })

    it('có bảng tin nhắn nhanh mobile-quick-menu-container dưới thanh công cụ', () => {
      expect(memoryRaw).toContain('id="mobile-quick-menu-container"')
      expect(memoryRaw).toContain('className="flex xl:hidden w-full max-w-[480px] px-2 flex-col gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-150 z-30 select-none"')
    })

    it('hai panel thông tin người chơi và đối thủ desktop được ẩn trên mobile (hidden xl:flex)', () => {
      expect(memoryRaw).toContain('id="vung-4-plus-desk"')
      expect(memoryRaw).toContain('className="hidden xl:flex xl:absolute xl:right-[calc(100%+24px)] xl:bottom-12 xl:w-[250px]')
      expect(memoryRaw).toContain('id="vung-2-plus-desk"')
      expect(memoryRaw).toContain('className="hidden xl:flex xl:absolute xl:left-[calc(100%+24px)] xl:top-0 xl:w-[250px]')
    })

    it('bảo toàn các bất biến kiến trúc: không rò rỉ online, không dùng chuỗi cũ', () => {
      expect(memoryRaw).not.toContain('online')
      expect(memoryRaw).not.toContain('matchmaking')
      expect(memoryRaw).not.toContain('Chơi với máy')
      expect(memoryRaw).not.toContain('Chơi với người')
      expect(memoryRaw).not.toContain('Đấu online')
    })
  })
})
