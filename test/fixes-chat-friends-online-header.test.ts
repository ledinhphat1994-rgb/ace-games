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

  describe('Vùng 2: Text "Học tập" sáng rõ hơn dòng thông tin phòng bên dưới nó', () => {
    it('Dòng tiêu đề "Học tập" được hiển thị sáng rõ, nổi bật với text-sm font-bold text-text-primary', () => {
      expect(campusChatSheetRaw).toContain('<h2 className="text-sm font-bold text-text-primary block truncate">')
      expect(campusChatSheetRaw).toContain("{activeConversation.roomType === 'game' ? 'Game' : 'Học tập'}")
    })

    it('Dòng phía dưới "Phòng #id · tiêu đề" có cỡ chữ nhỏ hơn và màu nhạt hơn (text-xs text-text-secondary)', () => {
      expect(campusChatSheetRaw).toContain('<p className="text-xs font-normal text-text-secondary flex items-center gap-1.5 truncate mt-0.5">')
      expect(campusChatSheetRaw).toContain('<span>Phòng #{activeConversation.id}</span>')
    })
  })

  describe('Vùng 3: Icon Trò chuyện tăng bề ngang hơn, to hơn', () => {
    it('Icon MessageSquare ở header có kích thước rộng hơn (w-6), cao hơn (h-5) và preserveAspectRatio="none"', () => {
      expect(campusChatSheetRaw).toContain('preserveAspectRatio="none"')
      expect(campusChatSheetRaw).toContain('w-6 h-5 text-brand shrink-0')
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
