// test/vung1-vung2-vung5-reactions.test.ts
// Kiểm tra hồi quy cho các tính năng:
// 1. Vùng 1: GhiChuSuyNghiModal (Ghi chú mới, thought bubble trên avatar, 3 nút chức năng Nhạc, GIF, Emoji, nút Chia sẻ)
// 2. Vùng 2: HoSoNguoiDungDialog (Avatar bấm edit mở Vùng 1, Tên người dùng, Tag người dùng xác thực, Dòng trạng thái Vùng 1)
// 3. Vùng 5: Reaction Pill không dư lớp lót nền, click tăng số lượng (+1), nhấn giữ đổi emoji, double-click xóa emoji

import { describe, expect, it } from 'vitest'
import ghiChuModalRaw from '../src/components/social/GhiChuSuyNghiModal.tsx?raw'
import dialogRaw from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import campusChatDrawerRaw from '../src/features/hub/CampusChatDrawer.tsx?raw'
import dmThreadRaw from '../src/components/chat/DirectMessageThread.tsx?raw'

describe('Vùng 1: Ghi chú suy nghĩ & cấu hình Avatar', () => {
  it('GhiChuSuyNghiModal có đầy đủ cấu trúc chuẩn như Hình 1', () => {
    // Header có "Ghi chú mới" và nút "Chia sẻ"
    expect(ghiChuModalRaw).toContain('Ghi chú mới')
    expect(ghiChuModalRaw).toContain('Chia sẻ')
    expect(ghiChuModalRaw).toContain('capNhatHoSo')

    // Bong bóng suy nghĩ "Chia sẻ suy nghĩ…"
    expect(ghiChuModalRaw).toContain('Chia sẻ suy nghĩ…')

    // 3 nút tròn chức năng bên dưới Avatar: 🎵 Nhạc, GIF, 😊 Emoji
    expect(ghiChuModalRaw).toContain('<Music')
    expect(ghiChuModalRaw).toContain('GIF')
    expect(ghiChuModalRaw).toContain('<Smile')

    // Banner gợi ý bạn bè
    expect(ghiChuModalRaw).toContain('Giờ bạn có thể chia sẻ suy nghĩ & tâm trạng')
  })
})

describe('Vùng 2: Header Hồ sơ người dùng gồm Avatar, Tên, Tag xác thực, Dòng trạng thái', () => {
  it('HoSoNguoiDungDialog tích hợp Avatar có nút edit mở Vùng 1 khi là chính mình', () => {
    expect(dialogRaw).toContain('GhiChuSuyNghiModal')
    expect(dialogRaw).toContain('setMoModalGhiChu(true)')
    expect(dialogRaw).toContain('Bấm vào ảnh đại diện để sửa ghi chú & suy nghĩ')
  })

  it('HoSoNguoiDungDialog có Tên người dùng và Tag người dùng xác thực duy nhất', () => {
    expect(dialogRaw).toContain('data-testid="tag-xac-thuc"')
    expect(dialogRaw).toContain('BadgeCheck')
    expect(dialogRaw).toContain('tagDinhDanh')
  })

  it('HoSoNguoiDungDialog hiển thị dòng trạng thái suy nghĩ như Vùng 1', () => {
    expect(dialogRaw).toContain('Chia sẻ suy nghĩ…')
    expect(dialogRaw).toContain('💭')
  })

  it('Chỉnh sửa suy nghĩ hiển thị trực tiếp ở Vùng 2 (inline), z-index 140 không bị đè', () => {
    expect(dialogRaw).toContain('isMe && moModalGhiChu ? (')
    expect(dialogRaw).toContain('<GhiChuSuyNghiModal')
    expect(dialogRaw).toContain('inline')
    expect(dialogRaw).toContain('z-[140]')
    expect(dialogRaw).toContain('z-[130]')
  })

  it('Vùng 3 nhập vào Vùng 4 (hover Hủy kết bạn) và Vùng 4 cùng hàng Vùng 5 chia đôi card (grid-cols-2)', async () => {
    const nutQuanHeRaw = (await import('../src/components/social/NutQuanHe.tsx?raw')).default
    // Vùng 3 nhập vào Vùng 4: khi bạn bè, là 1 nút duy nhất, hover hiển thị Hủy kết bạn
    expect(nutQuanHeRaw).toContain('group/friend')
    expect(nutQuanHeRaw).toContain('group-hover/friend:hidden')
    expect(nutQuanHeRaw).toContain('group-hover/friend:flex text-destructive')
    expect(nutQuanHeRaw).toContain('data-testid={`huy-ket-ban-${id}`}')
    // Vùng 4 và Vùng 5 cùng 1 hàng chia đôi card ra
    expect(dialogRaw).toContain('grid gap-2 w-full')
    expect(dialogRaw).toContain('grid-cols-2')
  })
})

describe('Vùng 5: Reaction Pill không dư lớp lót nền & 3 thao tác tương tác', () => {
  it('CampusChatDrawer: Không lồng thêm lớp lót nền pill trong từng emoji', () => {
    // Không có ring-1 ring-brand/40 bg-brand/20 bên trong từng button gây dư nền
    expect(campusChatDrawerRaw).not.toContain('bg-brand/20 ring-1 ring-brand/40 text-brand')
    // Container ngoài bo tròn con nhộng
    expect(campusChatDrawerRaw).toContain('rounded-full bg-surface-raised/95 border border-border-default/90 shadow-sm')
  })

  it('CampusChatDrawer: Hỗ trợ click tăng số lượng (+1)', () => {
    expect(campusChatDrawerRaw).toContain('handleIncrementEmoji')
    expect(campusChatDrawerRaw).toContain('reactionCounts')
  })

  it('CampusChatDrawer: Hỗ trợ nhấn giữ im (pointerdown timer) để đổi emoji khác', () => {
    expect(campusChatDrawerRaw).toContain('handlePointerDownEmoji')
    expect(campusChatDrawerRaw).toContain('isLongPressRef')
    expect(campusChatDrawerRaw).toContain('replaceIndex')
  })

  it('CampusChatDrawer: Hỗ trợ double click để xóa emoji', () => {
    expect(campusChatDrawerRaw).toContain('onDoubleClick')
    expect(campusChatDrawerRaw).toContain('handleDeleteEmoji')
  })

  it('DirectMessageThread: Không lồng thêm lớp lót nền và hỗ trợ double-click xóa & nhấn giữ đổi', () => {
    expect(dmThreadRaw).not.toContain('ring-1 ring-brand bg-brand/20')
    expect(dmThreadRaw).toContain('onDoubleClick')
    expect(dmThreadRaw).toContain('handleDeleteEmoji')
    expect(dmThreadRaw).toContain('handlePointerDownEmoji')
  })

  it('DirectMessageThread Vùng 3: Quy tắc 3 emoji cố định là hiển thị tối đa 3 ở ngoài, cho phép chọn full emojis', () => {
    expect(dmThreadRaw).toContain('DM_FIXED_3_EMOJIS')
    expect(dmThreadRaw).toContain("['❤️', '😆', '😡']")
    expect(dmThreadRaw).toContain('ALL_REACTION_EMOJIS')
    expect(dmThreadRaw).toContain('slice(0, 3)')
  })
})

describe('Top-Layer Stack Invariant: Popup mở sau cùng nhất luôn đè lên tất cả', () => {
  it('useTopLayerZIndex được tích hợp đồng bộ cho Dialog, Sheet, Popover, AlertDialog, DropdownMenu và HoSoNguoiDungDialog', async () => {
    const dialogCode = (await import('../src/components/ui/dialog.tsx?raw')).default
    const sheetCode = (await import('../src/components/ui/sheet.tsx?raw')).default
    const popoverCode = (await import('../src/components/ui/popover.tsx?raw')).default
    const alertDialogCode = (await import('../src/components/ui/alert-dialog.tsx?raw')).default
    const dropdownMenuCode = (await import('../src/components/ui/dropdown-menu.tsx?raw')).default

    expect(dialogCode).toContain('useTopLayerZIndex')
    expect(sheetCode).toContain('useTopLayerZIndex')
    expect(popoverCode).toContain('useTopLayerZIndex')
    expect(alertDialogCode).toContain('useTopLayerZIndex')
    expect(dropdownMenuCode).toContain('useTopLayerZIndex')
    expect(dialogRaw).toContain('useTopLayerZIndex')
  })

  it('Top-layer manager phân bổ z-index tăng dần cho các layer kế tiếp và hỗ trợ bringToFront khi tương tác', async () => {
    const { getNextTopLayerZIndex, getCurrentTopLayerZIndex } = await import('../src/lib/top-layer')
    const z1 = getNextTopLayerZIndex()
    const z2 = getNextTopLayerZIndex()
    expect(z2).toBeGreaterThan(z1)
    expect(getCurrentTopLayerZIndex()).toBeGreaterThanOrEqual(z2)
  })
})
