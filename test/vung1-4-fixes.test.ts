import { describe, expect, it } from 'vitest'
import campusChatDrawerRaw from '../src/features/hub/CampusChatDrawer.tsx?raw'
import dmThreadRaw from '../src/components/chat/DirectMessageThread.tsx?raw'
import campusChatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'
import gameLobbyPageRaw from '../src/features/games/GameLobbyPage.tsx?raw'
import gameArenaPageRaw from '../src/features/games/GameArenaPage.tsx?raw'
import gameRoomPageRaw from '../src/features/games/GameRoomPage.tsx?raw'
import campusSearchRaw from '../src/components/layout/CampusSearch.tsx?raw'
import roomCardRaw from '../src/features/hub/RoomCard.tsx?raw'

describe('Kiểm tra 4 yêu cầu sửa giao diện & tính năng', () => {
  describe('Vùng 1: Icon chèn emoji trong chat hoạt động tin cậy', () => {
    it('CampusChatDrawer có Popover emoji có state kiểm soát moPickerEmoji và testid rõ ràng', () => {
      expect(campusChatDrawerRaw).toContain('moPickerEmoji')
      expect(campusChatDrawerRaw).toContain('data-testid="chat-emoji-trigger"')
      expect(campusChatDrawerRaw).toContain('setMoPickerEmoji(false)')
      expect(campusChatDrawerRaw).toContain('z-[150]')
    })

    it('DirectMessageThread có Popover emoji có state kiểm soát moPickerEmoji và testid rõ ràng', () => {
      expect(dmThreadRaw).toContain('moPickerEmoji')
      expect(dmThreadRaw).toContain('data-testid="dm-emoji-trigger"')
      expect(dmThreadRaw).toContain('setMoPickerEmoji(false)')
      expect(dmThreadRaw).toContain('z-[150]')
    })
  })

  describe('Vùng 2: Xóa chức năng sảnh cũ, áp dụng cho tất cả nơi đang có', () => {
    it('GameLobbyPage chuyển hướng vô điều kiện về sảnh chung duy nhất /arena', () => {
      expect(gameLobbyPageRaw).toContain('<Navigate to="/arena" replace />')
    })

    it('GameArenaPage hiển thị trực tiếp GameLobbyView mà không có onMoSanh sang sảnh cũ', () => {
      expect(gameArenaPageRaw).not.toContain('/arena/${gameType}')
      expect(gameArenaPageRaw).toContain('<GameLobbyView />')
    })

    it('Rời bàn game luôn điều hướng về sảnh chung /arena', () => {
      expect(gameRoomPageRaw).toContain("navigate('/arena')")
    })

    it('Tìm kiếm game trong CampusSearch điều hướng thẳng về /arena', () => {
      expect(campusSearchRaw).toContain("go('/arena')")
    })
  })

  describe('Vùng 3: Bảng chat chiều ngang ngắn lại & tích hợp liên kết chat phòng', () => {
    it('CampusChatSheet có chiều ngang thu hẹp thanh lịch (không chiếm 80% màn hình)', () => {
      expect(campusChatSheetRaw).toMatch(/sm:w-\[(480|500|520|540|660|700|740)px\]/)
      expect(campusChatSheetRaw).toMatch(/sm:w-(44|48|52)/)
    })

    it('CampusChatSheet tự động phát hiện đang ở phòng game hoặc phòng học và hiển thị kênh phòng', () => {
      expect(campusChatSheetRaw).toContain('inRoomInfo')
      expect(campusChatSheetRaw).toContain('location.pathname.match(/^\\/game\\/([^/?#]+)/)')
      expect(campusChatSheetRaw).toContain('location.pathname.match(/^\\/room\\/([^/?#]+)/)')
      expect(campusChatSheetRaw).toContain('handleSelectRoomChat')
      expect(campusChatSheetRaw).toContain('handleOpenRoomNativeChat')
    })

    it('CampusChatSheet có nút kích hoạt mở trực tiếp chat native của phòng', () => {
      expect(campusChatSheetRaw).toContain('[data-testid="game-room-chat-trigger"]')
      expect(campusChatSheetRaw).toContain('[data-testid="topbar-btn-chat"]')
    })

    it('khi vào phòng chỉ có chat phòng và bạn bè, khi ở ngoài chỉ có toàn trường và bạn bè', () => {
      expect(campusChatSheetRaw).toContain('inRoomInfo ? (')
      expect(campusChatSheetRaw).toContain('handleSelectRoomChat')
      expect(campusChatSheetRaw).toContain('handleSelectCampus')
      expect(campusChatSheetRaw).not.toContain('Quay lại sảnh toàn trường')
    })
  })

  describe('Vùng 4: Thẻ phòng học tập RoomCard áp dụng thiết kế ThePhongGame (Image 4)', () => {
    it('Hàng trên có nhãn môn badge có chấm tròn + số phòng góc trên bên phải', () => {
      expect(roomCardRaw).toContain('mon.badge')
      expect(roomCardRaw).toContain('#{room.id}')
    })

    it('Phần giữa có logo môn to nổi bật (size-16 sm:size-18), tên phòng đậm và tên chủ phòng chữ mờ', () => {
      expect(roomCardRaw).toMatch(/size-16\s+sm:size-18/)
      expect(roomCardRaw).toContain('room.ten')
      expect(roomCardRaw).toContain('text-text-tertiary font-normal truncate')
      expect(roomCardRaw).toContain('room.chuPhongTen')
    })

    it('Hàng dưới có trạng thái ván đấu/học tập, sĩ số, bạn bè và nút gradient Vào phòng ->', () => {
      expect(roomCardRaw).toContain('Sẵn sàng')
      expect(roomCardRaw).toContain('Đã đầy')
      expect(roomCardRaw).toContain('room.soNguoi')
      expect(roomCardRaw).toContain('room.sucChua')
      expect(roomCardRaw).toContain('Vào phòng')
      expect(roomCardRaw).toContain('bg-gradient-to-r from-sky-500 to-blue-600')
    })
  })

  describe('Vùng 1 & 2: Emoji reaction pill xích lên 1/3 (-mt-2) & 3 dấu chấm sát cạnh bên card tin nhắn', () => {
    it('CampusChatDrawer: Card emoji xích lên 1/3 (-mt-2) vào cạnh dưới của card tin nhắn', () => {
      expect(campusChatDrawerRaw).toContain('relative -mt-2 flex items-center flex-nowrap gap-1.5 pointer-events-auto whitespace-nowrap')
    })

    it('CampusChatDrawer: 3 dấu chấm bọc chung hàng flex với bubble tin nhắn để luôn sát cạnh bên', () => {
      expect(campusChatDrawerRaw).toContain("laCuaMinh ? 'flex-row-reverse' : 'flex-row'")
      expect(campusChatDrawerRaw).toContain('data-msg-action-trigger={msg.id}')
      expect(campusChatDrawerRaw).toContain('flex items-center gap-1.5 max-w-full flex-nowrap')
    })

    it('DirectMessageThread: Card emoji xích lên 1/3 (-mt-2) và 3 dấu chấm sát cạnh bên card tin nhắn', () => {
      expect(dmThreadRaw).toContain('relative -mt-2 flex items-center flex-nowrap gap-1.5 pointer-events-auto whitespace-nowrap')
      expect(dmThreadRaw).toContain("laCuaMinh ? 'flex-row-reverse' : 'flex-row'")
      expect(dmThreadRaw).toContain('data-msg-action-trigger={msg.id}')
      expect(dmThreadRaw).toContain('flex items-center gap-1.5 max-w-full flex-nowrap')
    })
  })
})
