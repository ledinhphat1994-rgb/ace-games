import { describe, expect, it } from 'vitest'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'

describe('Kiểm tra 3 vùng fix Cờ Tướng: Xóa Vùng 1, Vị trí trước đó Vùng 2, Xác nhận Xin Thua 2 chiều Vùng 3', () => {
  describe('Vùng 1: Xóa badge Level & Elo trên avatar của người chơi', () => {
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
  })

  describe('Vùng 2: Hiện vị trí trước đó của con cờ đã đi mới nhất', () => {
    it('XiangqiBoard tính toán effectiveLastMove từ cả nước đi online lẫn ván cục bộ/PvE', () => {
      expect(xiangqiBoardRaw).toContain('effectiveLastMove = useMemo(')
      expect(xiangqiBoardRaw).toContain('online.moves[online.moves.length - 1]')
    })

    it('XiangqiBoard render layer và marker vị trí trước đó (from) của nước đi mới nhất', () => {
      expect(xiangqiBoardRaw).toContain('id="last-move-indicator-layer"')
      expect(xiangqiBoardRaw).toContain('id="last-move-from-marker"')
      expect(xiangqiBoardRaw).toContain('border-dashed border-amber-400')
      expect(xiangqiBoardRaw).toContain('Vị trí xuất phát của nước cờ vừa đi')
    })

    it('XiangqiBoard highlight quân cờ ở ô đích (to) của nước đi mới nhất', () => {
      expect(xiangqiBoardRaw).toContain('isLastMoveDestination = effectiveLastMove?.to === sq')
      expect(xiangqiBoardRaw).toContain('isLastMoveDestination && !isSelected && \'ring-2 ring-amber-400')
    })
  })

  describe('Vùng 3: Logic xác nhận Xin Thua 2 chiều nhất quán', () => {
    it('handleResign không tự ý gọi online.surrender() hoặc setGameOver trước khi đối thủ xác nhận', () => {
      // Khi bấm Xin thua, chỉ gửi đề nghị resign_offer, không gọi online.surrender() ngay
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

    it('Lớp phủ backdrop của center-board-dialog trong suốt nhẹ bg-black/10 không che mờ xung quanh', () => {
      expect(xiangqiBoardRaw).toContain('id="center-board-dialog"')
      expect(xiangqiBoardRaw).toContain('bg-black/10 animate-in fade-in')
      expect(xiangqiBoardRaw).not.toContain('bg-black/60 backdrop-blur-[3px]')
    })
  })
})
