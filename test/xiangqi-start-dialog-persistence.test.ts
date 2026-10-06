import { describe, expect, it } from 'vitest'
import xiangqiBoardRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'

describe('Kiểm tra sửa lỗi popup Bắt đầu trận đấu: Chống hiện lại khi Chưa sẵn sàng và Chống giật khựng khi Sẵn sàng ngay', () => {
  it('Khai báo các ref kiểm soát vòng đời dialog: declinedRematchSideRef, hasAcceptedStartRef, handledStartProposalMsgIdsRef', () => {
    expect(xiangqiBoardRaw).toContain('declinedRematchSideRef = useRef<string | null>(null)')
    expect(xiangqiBoardRaw).toContain('hasAcceptedStartRef = useRef<boolean>(false)')
    expect(xiangqiBoardRaw).toContain('handledStartProposalMsgIdsRef = useRef<Set<string>>(new Set())')
  })

  it('Khi người chơi bấm Chưa sẵn sàng hoặc đóng dialog, lưu phía đối thủ vào declinedRematchSideRef và gọi declineRematch', () => {
    expect(xiangqiBoardRaw).toContain('declinedRematchSideRef.current = online.meta.rematchBy || null')
    expect(xiangqiBoardRaw).toContain('online.declineRematch?.()')
    expect(xiangqiBoardRaw).toContain("online.guiChat(`${PROPOSAL_PREFIX}start_decline`)")
  })

  it('Khi lời mời từ đối thủ trùng với phía đã từ chối, effect TUYỆT ĐỐI không mở lại dialog', () => {
    expect(xiangqiBoardRaw).toContain('if (online.meta.rematchBy && declinedRematchSideRef.current === online.meta.rematchBy)')
    expect(xiangqiBoardRaw).toContain('if (hasAcceptedStartRef.current)')
  })

  it('Khi người chơi bấm Sẵn sàng ngay, hasAcceptedStartRef được bật để ngăn popup nháy kép/flicker trong lúc chờ máy chủ đổi trạng thái', () => {
    expect(xiangqiBoardRaw).toContain('hasAcceptedStartRef.current = true')
  })

  it('Khi ván bắt đầu (meta.status === playing), reset toàn bộ declinedRematchSideRef và hasAcceptedStartRef', () => {
    expect(xiangqiBoardRaw).toContain("if (online?.meta.status === 'playing') {")
    expect(xiangqiBoardRaw).toContain('declinedRematchSideRef.current = null')
    expect(xiangqiBoardRaw).toContain('hasAcceptedStartRef.current = false')
  })

  it('Các nút trong dialog chuyển sang transition-colors duration-150 và loại bỏ active:scale-95 để tránh giật khung hình', () => {
    expect(xiangqiBoardRaw).toContain('id="dialog-confirm-btn"')
    expect(xiangqiBoardRaw).toContain('transition-colors duration-150 shadow-lg cursor-pointer')
    expect(xiangqiBoardRaw).toContain('id="dialog-cancel-btn"')
    expect(xiangqiBoardRaw).toContain('transition-colors duration-150 cursor-pointer')
    expect(xiangqiBoardRaw).not.toContain('id="dialog-confirm-btn"\n                    onClick={activeDlg.onConfirm}\n                    className={cn(\n                      \'w-full py-2.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer active:scale-95\',')
  })
})
