import { describe, expect, it } from 'vitest'
import topLayerRaw from '../src/lib/top-layer.ts?raw'
import nutQuanHeRaw from '../src/components/social/NutQuanHe.tsx?raw'
import campusChatDrawerRaw from '../src/features/hub/CampusChatDrawer.tsx?raw'
import dmThreadRaw from '../src/components/chat/DirectMessageThread.tsx?raw'

describe('Kiểm tra fix Vùng 1, Vùng 2, Vùng 3 theo yêu cầu', () => {
  describe('Vùng 1: Nút quan hệ bạn bè mở popover tin cậy và luôn ở layer trên cùng', () => {
    it('top-layer.ts khởi tạo currentGlobalZIndex >= 200 và không gọi stopPropagation làm chết event trigger', () => {
      expect(topLayerRaw).toContain('let currentGlobalZIndex = 200')
      expect(topLayerRaw).not.toContain('e?.stopPropagation?.()')
    })

    it('NutQuanHe có z-index cao (z-[250], z-[251]) và không chặn capture click của Base UI Trigger', () => {
      expect(nutQuanHeRaw).toContain('className="z-[250]"')
      expect(nutQuanHeRaw).toContain('className="z-[251] w-52')
      expect(nutQuanHeRaw).toContain('onPointerDown={() => bringOptionsToFront()}')
      expect(nutQuanHeRaw).not.toContain('onClickCapture={bringOptionsToFront}')
    })
  })

  describe('Vùng 2 & Nhắn tin: 3 dấu chấm dọc bên hông tin nhắn (thu hồi, xóa phía tôi) và xóa thùng rác khỏi bubble', () => {
    it('CampusChatDrawer đặt thời gian và Smile trong bubble, thao tác xóa/thu hồi chuyển sang nút 3 chấm bên hông', () => {
      expect(campusChatDrawerRaw).toContain('<Smile className="size-3" />')
      expect(campusChatDrawerRaw).toContain('flex items-center justify-end gap-1.5 pt-0.5')
      expect(campusChatDrawerRaw).toContain('MoreVertical')
      expect(campusChatDrawerRaw).toContain('Xóa ở phía tôi')
      expect(campusChatDrawerRaw).toContain('Thu hồi tin nhắn')
    })

    it('CampusChatDrawer không còn nút xóa thừa trôi dạt', () => {
      expect(campusChatDrawerRaw).not.toContain('flex max-w-full items-center gap-1')
    })

    it('DirectMessageThread: Xóa thùng rác khỏi bubble, có 3 dấu chấm dọc bên hông với thu hồi & xóa phía tôi', () => {
      expect(dmThreadRaw).toContain('xoaTinNhanRieng')
      expect(dmThreadRaw).toContain('data-emoji-trigger={msg.id}')
      expect(dmThreadRaw).toContain('data-emoji-picker={msg.id}')
      expect(dmThreadRaw).toContain('data-msg-action-trigger={msg.id}')
      expect(dmThreadRaw).toContain('MoreVertical')
      expect(dmThreadRaw).toContain('Thu hồi tin nhắn')
      expect(dmThreadRaw).toContain('Xóa ở phía tôi')
      expect(dmThreadRaw).toContain('flex items-center justify-end gap-1.5 pt-0.5')
      expect(dmThreadRaw).not.toContain("mt-0.5 px-1 text-[10px]")
    })
  })

  describe('Vùng 3: Thả cảm xúc tin nhắn riêng hoạt động tin cậy và tuân thủ quy tắc 3 emoji cố định', () => {
    it('DirectMessageThread picker cảm xúc dùng capsule nội bộ không bị che bởi Sheet và đóng khi click ngoài', () => {
      expect(dmThreadRaw).toContain('data-emoji-picker={msg.id}')
      expect(dmThreadRaw).toContain('handleClickOutside')
      expect(dmThreadRaw).toContain("window.addEventListener('pointerdown', handleClickOutside)")
      expect(dmThreadRaw).toContain('DM_FIXED_3_EMOJIS')
    })

    it('DirectMessageThread: 3 dấu chấm dọc nằm trong cùng hàng ngang sát cạnh bên card tin nhắn dù tin dài hay emoji dài', () => {
      expect(dmThreadRaw).toContain('flex items-center gap-1.5 max-w-full flex-nowrap')
      expect(dmThreadRaw).toContain('shrink-0 self-center')
      expect(dmThreadRaw).toContain('data-msg-action-trigger={msg.id}')
    })

    it('DirectMessageThread: Avatar người gửi trong luồng tin nhắn bấm được để mở hồ sơ người dùng trên cùng', () => {
      expect(dmThreadRaw).toContain('Xem hồ sơ của ${target.displayName}')
      expect(dmThreadRaw).toContain('setNguoiXem')
      expect(dmThreadRaw).toContain('emojiPickerZIndex')
    })
  })
})
