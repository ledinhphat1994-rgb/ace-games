import { describe, expect, it } from 'vitest'
import slideUploadModalRaw from '../src/features/study/SlideUploadModal.tsx?raw'
import documentStageViewRaw from '../src/features/study/workspace/DocumentStageView.tsx?raw'
import khungLopRaw from '../src/features/study/workspace/KhungLop.tsx?raw'
import campusChatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'
import studyRoomViewRaw from '../src/features/study/StudyRoomView.tsx?raw'
import roomProtocolRaw from '../shared/protocol/room.ts?raw'
import roomDoRaw from '../worker/room-do.ts?raw'

describe('Kiểm tra 4 lỗi đã sửa theo yêu cầu người dùng', () => {
  describe('Hình 1: SlideUploadModal cắt tên file dài ở giữa và chống thanh cuộn ngang', () => {
    it('có hàm truncateMiddle cắt giữa giữ đầu và đuôi kèm phần mở rộng', () => {
      expect(slideUploadModalRaw).toContain('function truncateMiddle(')
      expect(slideUploadModalRaw).toContain('truncateMiddle(docName, 34)')
    })

    it('khung tải lên có overflow-hidden và truncate chống tràn ngang', () => {
      expect(slideUploadModalRaw).toContain('overflow-hidden')
      expect(slideUploadModalRaw).toContain('max-w-full px-2 truncate block text-center')
    })
  })

  describe('Hình 2 - Vùng 2: Card app chỉ hiện số khi > 1 file, Base-UI Popover dropdown không bị che, nút hold kéo nhạy', () => {
    it('card app sử dụng Base-UI Popover portal để dropdown nổi lên trên mà không bị overflow-hidden hay overflow-x-auto cắt xén', () => {
      expect(documentStageViewRaw).toContain("from '@/components/ui/popover'")
      expect(documentStageViewRaw).toContain('<PopoverTrigger')
      expect(documentStageViewRaw).toContain('<PopoverContent')
    })

    it('chỉ hiện số lượng khi có hơn 1 tài liệu và số to rõ thẩm mỹ', () => {
      expect(documentStageViewRaw).toContain('const hasMultipleFiles = files.length > 1')
      expect(documentStageViewRaw).toContain('hasMultipleFiles')
      // Nhãn số to rõ dạng badge nổi bật
      expect(documentStageViewRaw).toContain('inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold font-mono shadow-xs')
      expect(documentStageViewRaw).toContain('{files.length}')
    })

    it('có tay nắm kéo riêng (data-keo-khung-handle) và KhungLop kích hoạt kéo nhạy ngay lập tức', () => {
      expect(documentStageViewRaw).toContain('data-keo-khung-handle')
      expect(documentStageViewRaw).toContain('<GripVertical')
      expect(khungLopRaw).toContain('data-keo-khung-handle')
      expect(khungLopRaw).toContain('const laHandle = Boolean(dich0.closest(\'[data-keo-khung-handle]\'))')
    })
  })

  describe('Hình 2 - Vùng 3: Tiêu đề mục trước, phía dưới là số phòng; trên khung chat thêm tên phòng', () => {
    it('danh sách hội thoại bên trái hiện mục (Học tập / Game) ở trên và Phòng #id ở dưới', () => {
      expect(campusChatSheetRaw).toContain("inRoomInfo.type === 'game' ? 'Game' : 'Học tập'")
      expect(campusChatSheetRaw).toContain('Phòng #{inRoomInfo.id}')
    })

    it('thanh tiêu đề khung chat bên phải hiện mục ở trên, số phòng và tên phòng ở dưới', () => {
      expect(campusChatSheetRaw).toContain("activeConversation.roomType === 'game' ? 'Game' : 'Học tập'")
      expect(campusChatSheetRaw).toContain('Phòng #{activeConversation.id}')
      expect(campusChatSheetRaw).toContain('roomTitle')
    })
  })

  describe('Hình 2 - Vùng 4: Đồng bộ avatar trong room chat giống như các vùng chat khác', () => {
    it('RoomChatMessage và ThanhVienPhong trong protocol có trường avatar và accountId', () => {
      expect(roomProtocolRaw).toMatch(/interface RoomChatMessage \{[\s\S]*?avatar\?: string \| null/)
      expect(roomProtocolRaw).toMatch(/interface ThanhVienPhong \{[\s\S]*?accountId\?: number/)
    })

    it('RoomDO lưu và phát avatar kèm theo room.chat và trả về trong layChat', () => {
      expect(roomDoRaw).toContain('ALTER TABLE room_chat ADD COLUMN avatar TEXT')
      expect(roomDoRaw).toContain('INSERT INTO room_chat (account_id, req_id, sender_name, content, created_at, avatar)')
      expect(roomDoRaw).toContain('avatar: att.avatar ?? null')
      expect(roomDoRaw).toContain('SELECT id, account_id, sender_name, content, created_at, avatar FROM room_chat')
    })

    it('CampusChatSheet giải quyết avatar qua avatarMap và avatarByNameMap từ roomMembers và bạn bè', () => {
      expect(campusChatSheetRaw).toContain('roomMembers?: Array<{ accountId?: number; avatar?: string | null; ten?: string }>')
      expect(campusChatSheetRaw).toContain('avatarMap')
      expect(campusChatSheetRaw).toContain('avatarByNameMap')
      expect(campusChatSheetRaw).toContain('m.avatar || avatarMap.get(m.accountId) || avatarByNameMap.get(m.ten)')
    })

    it('StudyRoomView truyền roomMembers={members} vào CampusChatSheet', () => {
      expect(studyRoomViewRaw).toContain('roomMembers={members}')
    })
  })
})
