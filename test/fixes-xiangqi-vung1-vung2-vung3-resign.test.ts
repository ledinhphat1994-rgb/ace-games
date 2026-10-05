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
  })

  describe('Vùng 2: Hiện vị trí trước đó của con cờ đã đi mới nhất (Màu xanh dương đậm)', () => {
    it('XiangqiBoard tính toán effectiveLastMove từ cả nước đi online lẫn ván cục bộ/PvE', () => {
      expect(xiangqiBoardRaw).toContain('effectiveLastMove = useMemo(')
      expect(xiangqiBoardRaw).toContain('online.moves[online.moves.length - 1]')
    })

    it('XiangqiBoard render layer và marker vị trí trước đó (from) với màu xanh dương đậm', () => {
      expect(xiangqiBoardRaw).toContain('id="last-move-indicator-layer"')
      expect(xiangqiBoardRaw).toContain('id="last-move-from-marker"')
      expect(xiangqiBoardRaw).toContain('border-dashed border-blue-600')
      expect(xiangqiBoardRaw).toContain('bg-blue-600')
      expect(xiangqiBoardRaw).toContain('Vị trí xuất phát của nước cờ vừa đi')
    })

    it('XiangqiBoard highlight quân cờ ở ô đích (to) với viền ring xanh dương đậm', () => {
      expect(xiangqiBoardRaw).toContain('isLastMoveDestination = effectiveLastMove?.to === sq')
      expect(xiangqiBoardRaw).toContain('isLastMoveDestination && !isSelected && \'ring-2 ring-blue-600')
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
      expect(xiangqiBoardRaw).toContain('toast.info(\'Đối thủ muốn tiếp tục thi đấu, không chấp nhận lời xin thua!\')')
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

    it('Nút Bắt Đầu ở giữa sông luôn sẵn sàng hiển thị khi trận kết thúc và không bị !heroicBanner chặn', () => {
      expect(xiangqiBoardRaw).toContain('(!isPlaying || isOver) && !activeDlg && (')
      expect(xiangqiBoardRaw).toContain('id="btn-bat-dau-river"')
    })

    it('Bắt đầu lại ván mới gửi start_offer yêu cầu 2 bên xác nhận đồng thuận mới bắt đầu', () => {
      expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}start_offer`)")
      expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}start_accept`)")
      expect(xiangqiBoardRaw).toContain("action === 'start_offer'")
      expect(xiangqiBoardRaw).toContain("action === 'start_accept'")
    })
  })
})
