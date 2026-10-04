import { describe, expect, it } from 'vitest'
import directMessageThreadRaw from '../src/components/chat/DirectMessageThread.tsx?raw'
import campusChatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'

describe('Kiểm tra 3 vùng sửa lỗi theo yêu cầu người dùng (Vùng 1, Vùng 2, Vùng 3)', () => {
  describe('Vùng 1: Dưới tên người dùng hiển thị mục nào, phòng bao nhiêu, tên phòng', () => {
    it('DirectMessageThread lấy rooms từ useCampusContext để tra cứu thông tin phòng', () => {
      expect(directMessageThreadRaw).toContain('rooms,')
      expect(directMessageThreadRaw).toContain('useCampusContext()')
    })

    it('DirectMessageThread định dạng chi tiết mục nào, phòng bao nhiêu, tên phòng', () => {
      expect(directMessageThreadRaw).toContain('const moTaViTri = useMemo(')
      expect(directMessageThreadRaw).toContain("const muc = isGame ? 'Game' : 'Học tập'")
      expect(directMessageThreadRaw).toContain('`${muc} • Phòng #${rId}`')
      expect(directMessageThreadRaw).toContain('`${muc} • Phòng #${rId} • ${ten}`')
    })

    it('Header DirectMessageThread hiển thị moTaViTri dưới tên người dùng', () => {
      expect(directMessageThreadRaw).toContain('title={moTaViTri}')
      expect(directMessageThreadRaw).toContain('{moTaViTri}')
    })
  })

  describe('Vùng 2: Icon nằm bên trái ngoài cùng còn text mới căn giữa', () => {
    it('Container header là relative flex justify-center', () => {
      expect(campusChatSheetRaw).toContain('relative flex items-center justify-center border-b border-border-subtle px-4 py-3.5')
    })

    it('Icon MessageSquare nằm bên trái ngoài cùng với absolute left-4', () => {
      expect(campusChatSheetRaw).toContain('<MessageSquare className="absolute left-4 size-4.5 text-brand shrink-0" />')
    })

    it('Tiêu đề Trò chuyện được căn giữa chính giữa header', () => {
      expect(campusChatSheetRaw).toContain('<h2 className="text-sm font-semibold text-text-primary text-center">Trò chuyện</h2>')
    })
  })

  describe('Vùng 3: Dưới tên ghi mục nào (game, học tập, trang chủ) và số bạn thấy rõ hơn', () => {
    it('Số bạn bè có badge font-bold, nền nổi bật và viền rõ ràng', () => {
      expect(campusChatSheetRaw).toContain('tabular-nums font-bold text-xs px-2 py-0.5 rounded-full bg-surface-overlay text-text-primary border border-border-subtle shadow-2xs')
    })

    it('Có hàm layViTriBanBe phân loại mục hoạt động (game, học tập, trang chủ, cộng đồng)', () => {
      expect(campusChatSheetRaw).toContain('function layViTriBanBe(')
      expect(campusChatSheetRaw).toContain("return { text: 'Game', isOnline: true, isAway: false }")
      expect(campusChatSheetRaw).toContain("return { text: 'Học tập', isOnline: true, isAway: false }")
      expect(campusChatSheetRaw).toContain("return { text: 'Trang chủ', isOnline: true, isAway: false }")
      expect(campusChatSheetRaw).toContain("return { text: 'Cộng đồng', isOnline: true, isAway: false }")
    })

    it('Mỗi dòng bạn bè hiển thị dòng vị trí dưới tên', () => {
      expect(campusChatSheetRaw).toContain('const viTriBan = layViTriBanBe(presence, rooms)')
      expect(campusChatSheetRaw).toContain('{viTriBan.text}')
      expect(campusChatSheetRaw).toContain('text-[11px] truncate mt-0.5 leading-tight')
    })
  })
})
