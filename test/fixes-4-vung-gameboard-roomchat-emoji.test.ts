import { describe, expect, it } from 'vitest'
import gameBoardViewRaw from '../src/features/games/GameBoardView.tsx?raw'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import gamePlayToolbarRaw from '../src/features/games/GamePlayToolbar.tsx?raw'
import campusChatDrawerRaw from '../src/features/hub/CampusChatDrawer.tsx?raw'
import campusChatSheetRaw from '../src/components/layout/CampusChatSheet.tsx?raw'
import gameSocialSidebarRaw from '../src/features/games/GameSocialSidebar.tsx?raw'
import appShellRaw from '../src/components/layout/AppShell.tsx?raw'

describe('Kiểm tra 4 vùng fix giao diện bàn cờ & chat phòng emoji (User Request)', () => {
  describe('Vùng 1 -> Vùng 1+: Thông tin phòng tích hợp vào hàng công cụ bàn cờ', () => {
    it('GameBoardView không còn thanh topbar ngoài thừa thãi, truyền roomName, isPrivate, onInvite xuống bàn cờ', () => {
      expect(gameBoardViewRaw).not.toContain('<header')
      expect(gameBoardViewRaw).toContain('roomName={roomName}')
      expect(gameBoardViewRaw).toContain('isPrivate={isPrivate}')
      expect(gameBoardViewRaw).toContain('onInvite={() => setMoModalMoi(true)}')
    })

    it('XiangqiBoard và GamePlayToolbar hiển thị cụm Vùng 1+ (nút Sảnh, tên phòng, badge Riêng tư)', () => {
      expect(xiangqiBoardRaw).toContain('{roomName && (')
      expect(xiangqiBoardRaw).toContain('{isPrivate && (')
      expect(xiangqiBoardRaw).toContain('Quay lại sảnh')
      expect(gamePlayToolbarRaw).toContain('{roomName ? (')
      expect(gamePlayToolbarRaw).toContain('{isPrivate && (')
    })
  })

  describe('Vùng 2: Xóa nút mũi tên quay lại sảnh thừa thãi cạnh nút PvP/PvE', () => {
    it('XiangqiBoard không còn nút ArrowLeft thừa thãi cạnh nút PvP/PvE', () => {
      expect(xiangqiBoardRaw).not.toContain('title="Về sảnh trò chơi"\n            aria-label="Về sảnh trò chơi"\n            className="h-9')
    })
  })

  describe('Vùng 3 -> Vùng 3+: Nút Mời chơi đưa xuống cạnh nút PvP/PvE và trước đồng hồ', () => {
    it('XiangqiBoard có nút Mời chơi cạnh nút PvP/PvE ở Vùng 3+', () => {
      expect(xiangqiBoardRaw).toContain('onClick={onInvite}')
      expect(xiangqiBoardRaw).toContain('title="Mời người chơi theo tên"')
      expect(xiangqiBoardRaw).toContain('<UserPlus className="size-3.5 text-sky-400" />')
      expect(xiangqiBoardRaw).toContain('Mời chơi')
    })

    it('GamePlayToolbar hỗ trợ prop onInvite và render nút Mời người chơi', () => {
      expect(gamePlayToolbarRaw).toContain('onInvite?: () => void')
      expect(gamePlayToolbarRaw).toContain('title="Mời người chơi theo tên"')
      expect(gamePlayToolbarRaw).toContain('<UserPlus className="size-3.5 text-sky-400" />')
      expect(gamePlayToolbarRaw).toContain('Mời chơi')
    })
  })

  describe('Vùng 4: Fix chat phòng emoji hoạt động chính xác & mượt mà', () => {
    it('CampusChatDrawer render emoji reaction picker bằng Portal (createPortal) ra document.body', () => {
      expect(campusChatDrawerRaw).toContain('createPortal(')
      expect(campusChatDrawerRaw).toContain('document.body')
      expect(campusChatDrawerRaw).toContain('useTopLayerZIndex')
      expect(campusChatDrawerRaw).toContain('getPickerPosition')
    })

    it('CampusChatDrawer hỗ trợ scope="room" lưu reaction theo phòng và không gây lỗi 404', () => {
      expect(campusChatDrawerRaw).toContain("scope?: 'campus' | 'room'")
      expect(campusChatDrawerRaw).toContain('c10a7_room_reactions_')
      expect(campusChatDrawerRaw).toContain('!isRoomScope')
    })

    it('CampusChatSheet truyền scope="room" và roomId vào CampusChatDrawer cho tab phòng', () => {
      expect(campusChatSheetRaw).toContain('scope="room"')
      expect(campusChatSheetRaw).toContain('roomId={inRoomInfo?.id ? String(inRoomInfo.id) : undefined}')
    })

    it('GameSocialSidebar chèn emoji và tự động focus lại ô input (preventScroll)', () => {
      expect(gameSocialSidebarRaw).toContain('roomInputRef.current?.focus({ preventScroll: true })')
      expect(gameSocialSidebarRaw).toContain('campusInputRef.current?.focus({ preventScroll: true })')
    })
  })

  describe('Fix giao diện Cờ Tướng: Bàn cờ chuẩn quy cách, Vùng 2 đưa xuống Vùng 2+, nút Bắt đầu tinh gọn', () => {
    it('Vùng 2: Icon game to rõ đẹp hơn với đĩa cờ 3D nổi khối và số phòng vàng óng', () => {
      expect(xiangqiBoardRaw).toContain('size-8 sm:size-9 rounded-full')
      expect(xiangqiBoardRaw).toContain('帥')
      expect(xiangqiBoardRaw).toContain('#{soPhongHienThi || \'55\'}')
      expect(xiangqiBoardRaw).not.toContain('{roomName} #{soPhongHienThi || \'55\'}')
    })

    it('Fix vùng 2 đưa xuống Vùng 2+: Cụm thông tin Bạn và các nút PvE/PvP, Xin xỏ ở Card góc dưới bên trái', () => {
      expect(xiangqiBoardRaw).toContain('id="vung-2-plus-card"')
      expect(xiangqiBoardRaw).toContain('xl:right-[calc(100%+24px)] xl:bottom-0')
      expect(xiangqiBoardRaw).toContain('id="mode-toggle-card"')
      expect(xiangqiBoardRaw).toContain('id="xin-xo-btn"')
    })

    it('Fix bàn cờ thiết kế sai: Xóa rect trong cắt ngang lưng quân cờ và không đè nút Bắt đầu lên sông', () => {
      // Đã xóa đường rect 72x76 cắt ngang thân các quân cờ ở rìa
      expect(xiangqiBoardRaw).not.toContain('<rect x="72" y="76"')
      // Nút Bắt đầu đã được chuyển từ giữa sông xuống Vùng 2+
      expect(xiangqiBoardRaw).not.toContain('id="btn-bat-dau-river"\n                  onClick={handleStartGameClick}\n                  className="group relative px-7 sm:px-9 py-2.5 sm:py-3.5')
      expect(xiangqiBoardRaw).toContain('id="btn-bat-dau-river"')
    })

    it('Con cờ thiết kế chữ to rõ hơn, font-black và chân thật cân đối lề bàn cờ', () => {
      expect(xiangqiBoardRaw).toContain("w-[9.4%]")
      expect(xiangqiBoardRaw).toContain("font-han text-lg sm:text-xl md:text-[23px] drop-shadow-sm")
    })

    it('Nút Bắt đầu chỉ hiện khi không có thông báo kết quả (heroicBanner) và không đè nhau', () => {
      expect(xiangqiBoardRaw).toContain('(!isPlaying || isOver) && !heroicBanner && !activeDlg')
      expect(xiangqiBoardRaw).toContain('>BẮT ĐẦU<')
      expect(xiangqiBoardRaw).not.toContain('>Chơi lại<')
    })
  })

  describe('Yêu cầu căn giữa màn hình thiết bị, không thanh kéo và khoảng thở dưới đáy', () => {
    it('GameBoardView bỏ hộp Card 2 (max-w-[1100px], rounded-2xl, border, bg-surface)', () => {
      expect(gameBoardViewRaw).not.toContain('max-w-[1100px]')
      expect(gameBoardViewRaw).not.toContain('rounded-2xl border border-border-default bg-surface/85')
      expect(gameBoardViewRaw).toContain('className="game-stage relative flex min-w-0 w-full flex-1 flex-col items-center h-full overflow-hidden"')
    })

    it('AppShell căn giữa bàn cờ theo màn hình thiết bị (lg:mr cân bằng lg:ml) và khóa thanh kéo', () => {
      expect(appShellRaw).toContain("!isFullscreen && isGameRoom && 'lg:mr-[240px] xl:mr-[256px]'")
      expect(appShellRaw).toContain("justify-start")
      expect(appShellRaw).toContain("overflow-hidden")
    })

    it('XiangqiBoard có bàn cờ to hơn (max-h-[min(73vh,690px)]), xích lên trên và sửa lỗi hiệu ứng hover/click', () => {
      expect(xiangqiBoardRaw).toContain("max-h-[min(73vh,690px)]")
      expect(xiangqiBoardRaw).toContain("piece-movable")
      expect(xiangqiBoardRaw).toContain("daBatDauVan")
      expect(xiangqiBoardRaw).toContain("justify-start")
      expect(xiangqiBoardRaw).toContain("py-1 mb-1")
    })
  })
})
