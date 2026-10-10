import { describe, expect, it } from 'vitest'
import campusChatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'

describe('Kiểm tra Vùng 1 & Vùng 2 khung Trò chuyện (CampusChatSheet)', () => {
  describe('Vùng 1: Hiển thị số bạn bè online trên tổng số bạn bè, phân biệt online sáng / offline mờ', () => {
    it('Tính toán chính xác số bạn bè online từ friendsPresence (online hoặc away)', () => {
      expect(campusChatSheetRaw).toContain('onlineFriendsCount = useMemo(')
      expect(campusChatSheetRaw).toContain("p?.state === 'online' || p?.state === 'away'")
    })

    it('Badge bạn bè hiển thị số online trên tổng số (dạng {onlineFriendsCount}/{friends.length})', () => {
      expect(campusChatSheetRaw).toContain('data-testid="friends-count-badge"')
      expect(campusChatSheetRaw).toContain('{onlineFriendsCount}')
      expect(campusChatSheetRaw).toContain('{friends.length}')
      expect(campusChatSheetRaw).toContain('text-emerald-400')
    })

    it('Bạn bè online hiển thị sáng rõ (opacity-100, font-semibold text-text-primary)', () => {
      expect(campusChatSheetRaw).toContain('const isCoMat = isOnline || isAway')
      expect(campusChatSheetRaw).toContain("opacity-100")
      expect(campusChatSheetRaw).toContain("isCoMat ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'")
    })

    it('Bạn bè offline hiển thị nick mờ (opacity-60 hover:opacity-90, font-medium text-text-secondary, grayscale avatar)', () => {
      expect(campusChatSheetRaw).toContain("'text-text-secondary hover:bg-surface-raised opacity-60 hover:opacity-90'")
      expect(campusChatSheetRaw).toContain("'font-medium text-text-secondary'")
      expect(campusChatSheetRaw).toContain("!isCoMat && 'grayscale-35 opacity-75'")
    })
  })

  describe('Vùng 2: Thanh Tab phân tách rõ ràng Bạn bè, Toàn trường và Phòng', () => {
    it('Tab Phòng hiển thị Gamepad2 khi trong phòng game và GraduationCap khi trong phòng học', () => {
      expect(campusChatSheetRaw).toContain("inRoomInfo?.type === 'game'")
      expect(campusChatSheetRaw).toContain('<Gamepad2')
      expect(campusChatSheetRaw).toContain('<GraduationCap')
    })

    it('Tab Trường và Bạn bè hiển thị icon tương ứng với chỉ báo rõ nét', () => {
      expect(campusChatSheetRaw).toContain('<Users className="size-3.5 shrink-0"')
      expect(campusChatSheetRaw).toContain('<School className="size-3.5 shrink-0"')
    })
  })

  describe('Vùng 3: Khung chat nổi mobile được tối ưu không gian và mượt mà', () => {
    it('Sử dụng kích thước tối ưu trên mobile với safe area', () => {
      expect(campusChatSheetRaw).toMatch(/max-h-\[calc\(100[ds]vh-(?:20|12)px\)\]/)
      expect(campusChatSheetRaw).toMatch(/(?:bottom-\[max\(0\.625rem,env\(safe-area-inset-bottom\)\)\]|h-\[calc\(100svh-12px\)\])/)
    })
  })
})

describe('Kiểm tra từ chối tệp Word cũ (.doc), chỉ chấp nhận .docx', () => {
  it('SlideUploadModal loại bỏ .doc khỏi accept và có thông báo từ chối khi chọn .doc', async () => {
    const slideUploadModalRaw = (await import('../src/features/study/SlideUploadModal.tsx?raw')).default
    expect(slideUploadModalRaw).not.toContain('.docx,.doc')
    expect(slideUploadModalRaw).toContain('accept=".pdf,.pptx,.docx,.xlsx,.xls,.png,.jpg,.jpeg,.webp"')
    expect(slideUploadModalRaw).toContain("ext === 'doc'")
    expect(slideUploadModalRaw).toContain('Định dạng Word cũ (.doc) không được hỗ trợ để đảm bảo đồng bộ chuẩn xác')
  })

  it('Backend validateDocumentUpload từ chối dứt khoát tệp .doc', async () => {
    const { validateDocumentUpload } = await import('../worker/lib/document-validation')
    const fakeDocBytes = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    const res = await validateDocumentUpload('bien_ban.doc', 'application/msword', fakeDocBytes)
    expect(res.ok).toBe(false)
    expect(res.errorCode).toBe('UPLOAD_UNSUPPORTED_TYPE')
    expect(res.error).toContain('Định dạng .doc cũ (Word 97-2003) không được hỗ trợ')
  })
})
