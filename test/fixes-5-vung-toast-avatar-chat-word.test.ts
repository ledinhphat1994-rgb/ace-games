import { describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import sonnerRaw from '../src/components/ui/sonner.tsx?raw'
import memberStripRaw from '../src/features/study/workspace/MemberStrip.tsx?raw'
import campusChatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'
import roomDoRaw from '../worker/room-do.ts?raw'
import useRoomRaw from '../src/hooks/use-room.ts?raw'
import docStageRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import docxViewerRaw from '../src/features/study/DocxDocumentViewer.tsx?raw'

const indexCssRaw = (env as any).INDEX_CSS as string

describe('Kiểm tra 5 vùng sửa lỗi theo yêu cầu người dùng', () => {
  describe('Vùng 1: Popup thông báo (Sonner Toast) không có dấu X và không hiện card rỗng', () => {
    it('Sonner không hiển thị nút close (closeButton={false})', () => {
      expect(sonnerRaw).toContain('closeButton={false}')
      expect(indexCssRaw).toContain('[data-sonner-toast] [data-close-button] {')
      expect(indexCssRaw).toContain('display: none !important;')
    })

    it('Sonner bọc guard lọc bỏ hoàn toàn các toast có message rỗng hoặc whitespace', () => {
      expect(sonnerRaw).toContain('if (!message || (typeof message === "string" && !message.trim()))')
      expect(sonnerRaw).toContain('return undefined')
    })

    it('CSS ẩn triệt để bất kỳ card toast nào bị rỗng', () => {
      expect(indexCssRaw).toContain('[data-sonner-toast]:empty')
      expect(indexCssRaw).toContain('display: none !important;')
    })
  })

  describe('Vùng 2: Icon công cụ không che khuất avatar thành viên trong MemberStrip', () => {
    it('Badge icon công cụ đặt ở đáy cân đối, không che mặt avatar', () => {
      expect(memberStripRaw).toContain('absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10')
      expect(memberStripRaw).not.toContain('absolute -right-1.5 -bottom-1')
    })

    it('MemberStrip container có đệm dọc phù hợp để không bị cắt', () => {
      expect(memberStripRaw).toContain('pt-2 pb-3.5')
    })
  })

  describe('Vùng 3: Chỉ hiển thị nội dung "Trò chuyện" trong sidebar chat', () => {
    it('Tiêu đề cột trò chuyện được đổi chính xác thành "Trò chuyện"', () => {
      expect(campusChatSheetRaw).toContain('Trò chuyện</h2>')
      expect(campusChatSheetRaw).toContain('text-center">Trò chuyện</h2>')
      expect(campusChatSheetRaw).not.toContain('Tin nhắn & Trò chuyện')
    })
  })

  describe('Vùng 4: Xóa sạch toàn bộ nội dung cuộc trò chuyện khi phòng bị hủy/đóng', () => {
    it('RoomDO xóa sạch bảng room_chat trong SQLite khi đóng phòng', () => {
      expect(roomDoRaw).toContain("this.ctx.storage.sql.exec('DELETE FROM room_chat')")
    })

    it('useRoom reset chatMessages về rỗng khi nhận sự kiện room.closed', () => {
      const roomClosedRegex = /case 'room\.closed':\s*\{[\s\S]*?break\s*\}/
      const match = useRoomRaw.match(roomClosedRegex)
      expect(match).not.toBeNull()
      expect(match![0]).toContain('setChatMessages([])')
    })
  })

  describe('Vùng 5: Tài liệu Word nạp vào hoạt động nội tại, không bị Microsoft Office Live chặn', () => {
    it('DocumentStageView chuyển toàn bộ file Word sang DocxDocumentViewer', () => {
      expect(docStageRaw).toContain('isWord && slideState ? (')
      expect(docStageRaw).toContain('<DocxDocumentViewer')
      expect(docStageRaw).not.toContain('isLegacyDoc ? (\n              <OfficeEmbedViewer')
    })

    it('DocxDocumentViewer hỗ trợ trích xuất và hiển thị fallback cho file .doc, HTML, RTF và nhị phân', () => {
      expect(docxViewerRaw).toContain('parseAndRenderFallbackWordDoc')
      expect(docxViewerRaw).toContain('extractUtf16Paragraphs')
      expect(docxViewerRaw).toContain('extract8BitParagraphs')
      expect(docxViewerRaw).toContain('renderParagraphs')
    })
  })
})
