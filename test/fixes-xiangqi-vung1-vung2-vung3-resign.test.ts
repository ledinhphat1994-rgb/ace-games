import { describe, expect, it } from 'vitest'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'

describe('Kiểm tra 3 vùng fix Cờ Tướng: Xóa Vùng 1, Vị trí trước đó Vùng 2, Xác nhận Xin Thua 2 chiều Vùng 3', () => {
  describe('Vùng 1: Xóa badge Level & Elo trên avatar của người chơi & Vị trí bảng biểu cảm tin nhanh chuẩn xác', () => {
    it('XiangqiBoard không còn badge Level & Elo lơ lửng trên avatar cá nhân của người chơi', () => {
      expect(xiangqiBoardRaw).not.toContain('bottom-[calc(100%+46px)] left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#121622]/95')
      expect(xiangqiBoardRaw).not.toContain('BADGE LEVEL & ELO CỦA TÔI')
    })

    it('XiangqiBoard vẫn giữ badge Level & Elo bên ngoài cho đối thủ để người chơi nhận diện', () => {
      expect(xiangqiBoardRaw).toContain('BADGE LEVEL & ELO ĐỐI THỦ')
      expect(xiangqiBoardRaw).toContain("isPveMode ? 'AI Cấp 10' : `Lv.${opponentLevel}`")
      expect(xiangqiBoardRaw).toContain('opponentElo')
    })

    it('Người chơi xem Level & Elo của chính mình thông qua Modal Cài đặt khi bấm vào Avatar', () => {
      expect(xiangqiBoardRaw).toContain('THẺ HỒ SƠ KỲ THỦ HIỂN THỊ ELO & LEVEL')
      expect(xiangqiBoardRaw).toContain('Cấp {myLevel}')
      expect(xiangqiBoardRaw).toContain('Elo {myElo}')
    })

    it('Bảng Biểu cảm & Tin nhanh nằm ngay trên cụm avatar/bong bóng kích hoạt, z-[60], không bị bay lên xl:top-6', () => {
      expect(xiangqiBoardRaw).toContain('id="vung-2-quick-chat-container"')
      expect(xiangqiBoardRaw).toContain('z-[60]')
      expect(xiangqiBoardRaw).not.toContain('xl:top-6')
      expect(xiangqiBoardRaw).toContain("document.getElementById('tool-bubble-emoji')")
    })

    it('Các bong bóng công cụ Vùng 1 duy trì khoảng đệm an toàn D=62px và không có badge số đè lên Avatar', () => {
      expect(xiangqiBoardRaw).toContain('const D = 62')
      expect(xiangqiBoardRaw).not.toContain('Indicator số lượng bong bóng đã ghim nhỏ ở góc trên nếu có')
    })
  })

  describe('Vùng 2: Hiện vị trí trước đó của con cờ đã đi mới nhất (Tông Hổ Phách dịu mắt, hòa quyện bàn cờ gỗ)', () => {
    it('XiangqiBoard tính toán effectiveLastMove từ cả nước đi online lẫn ván cục bộ/PvE', () => {
      expect(xiangqiBoardRaw).toContain('effectiveLastMove = useMemo(')
      expect(xiangqiBoardRaw).toContain('online.moves[online.moves.length - 1]')
    })

    it('XiangqiBoard render layer và marker vị trí trước đó (from) với màu hổ phách dịu mắt thay cho màu xanh chói', () => {
      expect(xiangqiBoardRaw).toContain('id="last-move-indicator-layer"')
      expect(xiangqiBoardRaw).toContain('id="last-move-from-marker"')
      expect(xiangqiBoardRaw).toContain('border-dashed border-amber-600')
      expect(xiangqiBoardRaw).toContain('bg-amber-500')
      expect(xiangqiBoardRaw).toContain('Vị trí xuất phát của nước cờ vừa đi')
    })

    it('XiangqiBoard highlight quân cờ ở ô đích (to) với viền ring ánh hổ phách dịu mắt', () => {
      expect(xiangqiBoardRaw).toContain('isLastMoveDestination = effectiveLastMove?.to === sq')
      expect(xiangqiBoardRaw).toContain("isLastMoveDestination && !isSelected && 'ring-2 ring-amber-500")
    })
  })

  describe('Cơ chế cờ tướng tự do di chuyển & Bật/Tắt hướng dẫn & Kéo thả quân cờ', () => {
    it('XiangqiBoard hỗ trợ kéo thả quân cờ trực tiếp trên bàn cờ', () => {
      expect(xiangqiBoardRaw).toContain('handlePiecePointerDown')
      expect(xiangqiBoardRaw).toContain('handlePiecePointerMove')
      expect(xiangqiBoardRaw).toContain('handlePiecePointerUp')
      expect(xiangqiBoardRaw).toContain('draggingPiece')
    })

    it('XiangqiBoard hỗ trợ tương tác trên toàn bộ 90 giao điểm bàn cờ', () => {
      expect(xiangqiBoardRaw).toContain('handleBoardPointerDown')
      expect(xiangqiBoardRaw).toContain('ref={boardRef}')
    })

    it('XiangqiBoard cho phép bật/tắt gợi ý nước đi để người chơi tự do di chuyển không bị ép', () => {
      expect(xiangqiBoardRaw).toContain('showHints')
      expect(xiangqiBoardRaw).toContain('id="btn-toggle-hints"')
      expect(xiangqiBoardRaw).toContain('{showHints && (')
    })

    it('Bảng biểu cảm vung-2-quick-chat-container sử dụng position: fixed và clamp viewport an toàn', () => {
      expect(xiangqiBoardRaw).toContain('id="vung-2-quick-chat-container"')
      expect(xiangqiBoardRaw).toContain("position: 'fixed'")
      expect(xiangqiBoardRaw).toContain('quickMenuPos.left')
      expect(xiangqiBoardRaw).toContain('quickMenuPos.top')
      expect(xiangqiBoardRaw).toContain('updateQuickMenuPos')
    })
  })

  describe('Vùng 3 & Kết thúc ván: Logic xác nhận 2 chiều cho Xin Thua, Xin Hòa, Xin Thắng và Bắt Đầu Lại', () => {
    it('handleResign không tự ý gọi online.surrender() hoặc setGameOver trước khi đối thủ xác nhận', () => {
      expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}resign_offer`)")
      expect(xiangqiBoardRaw).not.toContain("online.surrender()\n          online.guiChat(`${PROPOSAL_PREFIX}resign`)")
    })

    it('Trong PvP cục bộ, đối thủ có đủ 2 lựa chọn Đồng ý và Chơi tiếp khi nhận lời xin thua', () => {
      expect(xiangqiBoardRaw).toContain("title: 'Đối Thủ Xin Thua'")
      expect(xiangqiBoardRaw).toContain("subtitle: 'Đối thủ xin thua ván này, bạn có đồng ý không?'")
      expect(xiangqiBoardRaw).toContain("confirmText: 'Đồng ý'")
      expect(xiangqiBoardRaw).toContain("cancelText: 'Chơi tiếp'")
      expect(xiangqiBoardRaw).toContain("showGameNotice('TỪ CHỐI XIN THUA')")
    })

    it('Tất cả thông báo cơ chế game hiển thị chung 1 mẫu GameHeroicBanner ở giữa bàn cờ, không dùng toast Sonner', () => {
      expect(xiangqiBoardRaw).not.toContain("import { toast } from 'sonner'")
      expect(xiangqiBoardRaw).toContain("showGameNotice('TỪ CHỐI HOÀ CỜ')")
      expect(xiangqiBoardRaw).toContain("showGameNotice('TỪ CHỐI XIN THUA')")
      expect(xiangqiBoardRaw).toContain("showGameNotice('TỪ CHỐI NHƯỜNG THẮNG')")
      expect(xiangqiBoardRaw).toContain("showGameNotice('NƯỚC ĐI SAI LUẬT')")
      expect(xiangqiBoardRaw).toContain("showGameNotice('CHƯA SẴN SÀNG')")
    })

    it('Kênh chat online hỗ trợ resign_offer, resign_accept và resign_decline', () => {
      expect(xiangqiBoardRaw).toContain("action === 'resign_offer'")
      expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}resign_accept`)")
      expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}resign_decline`)")
      expect(xiangqiBoardRaw).toContain("action === 'resign_accept'")
      expect(xiangqiBoardRaw).toContain("action === 'resign_decline'")
    })

    it('isOver và isPlaying dựa trên isCustomOver để trận đấu kết thúc ngay lập tức khi 2 bên đồng thuận', () => {
      expect(xiangqiBoardRaw).toContain('const isCustomOver = Boolean(customGameOver?.over)')
      expect(xiangqiBoardRaw).toContain('const isOver = isCustomOver || (laOnlinePvp ? online?.meta.status === \'ended\' : outcome.over)')
      expect(xiangqiBoardRaw).toContain('const isPlaying = !isOver && (')
    })

    it('Nút Bắt Đầu ở giữa sông chỉ hiển thị khi chưa vào ván, ẩn khi đang chơi hoặc kết thúc để tránh đè trùng thông báo giữa bàn cờ (Vùng 2)', () => {
      expect(xiangqiBoardRaw).toContain('(!isPlaying && !isOver) && !activeDlg && !heroicBanner && (')
      expect(xiangqiBoardRaw).toContain('id="btn-bat-dau-river"')
    })

    it('Vùng 1: Các nút công cụ quanh avatar không bị disable cứng và luôn phản hồi thông báo rõ ràng', () => {
      expect(xiangqiBoardRaw).toContain("showGameNotice('VÁN CHƯA BẮT ĐẦU'")
      expect(xiangqiBoardRaw).toContain("showGameNotice('VÁN ĐÃ KẾT THÚC'")
      expect(xiangqiBoardRaw).toContain("showGameNotice('MÁY ĐANG TÍNH NƯỚC')")
      expect(xiangqiBoardRaw).toContain("showGameNotice('ĐÃ SAO CHÉP LIÊN KẾT'")
    })

    it('Bắt đầu lại ván mới gửi start_offer yêu cầu 2 bên xác nhận đồng thuận mới bắt đầu', () => {
      expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}start_offer`)")
      expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}start_accept`)")
      expect(xiangqiBoardRaw).toContain("action === 'start_offer'")
      expect(xiangqiBoardRaw).toContain("action === 'start_accept'")
    })

    it('Vùng 1 & Vùng 2: Dải góc bong bóng 60°-180°, đồng hồ mt-2.5 và nâng aside xl:bottom-12 giải phóng đáy avatar, triệt tiêu 100% va chạm', () => {
      expect(xiangqiBoardRaw).toContain('const startAngle = 60')
      expect(xiangqiBoardRaw).toContain('const endAngle = 180')
      expect(xiangqiBoardRaw).toContain('mt-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full border')
      expect(xiangqiBoardRaw).toContain('xl:bottom-12')
      expect(xiangqiBoardRaw).toContain('onPointerDown={(e) => e.stopPropagation()}')
    })

    it('Vùng X & Vùng 1: Bỏ qua proposal cũ khi mount tránh báo sai hoà cờ và giữ overflow-hidden tránh thanh trượt', () => {
      expect(xiangqiBoardRaw).toContain('isFirstMountProposalRef')
      expect(xiangqiBoardRaw).toContain('lastHandledProposalMsgIdRef')
      expect(xiangqiBoardRaw).toContain('overflow-hidden')
    })

    it('Vùng 3: Avatar đối thủ được đưa ra xa bàn cờ với xl:left-[calc(100%+48px)]', () => {
      expect(xiangqiBoardRaw).toContain('xl:left-[calc(100%+48px)]')
    })

    it('Xóa tất cả nút Dùng trong modal Cài Đặt Trận Đấu theo yêu cầu', () => {
      expect(xiangqiBoardRaw).not.toContain('Nút dùng ngay từ modal')
      expect(xiangqiBoardRaw).not.toContain('>Dùng</button>')
    })

    it('Move dots và tương tác cờ tướng có onPointerDown riêng và không bị reset bởi board section', () => {
      expect(xiangqiBoardRaw).toContain('key={`target-${toSq}`}')
      expect(xiangqiBoardRaw).toContain('justDraggedRef')
      expect(xiangqiBoardRaw).not.toContain('ref={boardRef}\n          onPointerDown={handleBoardPointerDown}\n          onClick={() => setSelectedSq(null)}')
    })

    it('Phương án 1: game.join hỗ trợ autoStart: false để 2 bên vào phòng chưa bắt đầu ngay mà chờ sẵn sàng', () => {
      expect(xiangqiBoardRaw).toContain('hasOfferedStart')
      expect(xiangqiBoardRaw).toContain("title: 'Bắt Đầu Trận Đấu'")
      expect(xiangqiBoardRaw).toContain("subtitle: 'Đối thủ đã sẵn sàng và mời bắt đầu, bạn có đồng ý không?'")
      expect(xiangqiBoardRaw).toContain("confirmText: 'Sẵn sàng ngay'")
      expect(xiangqiBoardRaw).toContain("cancelText: 'Chưa sẵn sàng'")
      expect(xiangqiBoardRaw).toContain('CHỜ ĐỐI THỦ')
      expect(xiangqiBoardRaw).toContain('ĐÃ SẴN SÀNG')
    })
  })
})
