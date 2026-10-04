import { describe, expect, it } from 'vitest'
import heroicBannerCode from '../src/features/games/GameHeroicBanner.tsx?raw'
import xiangqiBoardCode from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import campusChatSheetCode from '../src/components/layout/CampusChatSheet.tsx?raw'

describe('Fix Vùng 1 & Fix Vùng 2 Quality and Invariants', () => {
  describe('Vùng 1: CampusChatSheet Tab Switching & Layout Separation', () => {
    it('sử dụng lastAutoSwitchedRoomIdRef để chỉ tự động chuyển tab phòng một lần khi vào phòng, không cưỡng chế khi người dùng đổi tab', () => {
      expect(campusChatSheetCode).toContain('lastAutoSwitchedRoomIdRef')
      expect(campusChatSheetCode).toContain('lastAutoSwitchedRoomIdRef.current !== currentRoomId')
    })

    it('tách biệt SheetClose thành nút đóng riêng biệt ở bên phải, không đè lên tab Phòng (showCloseButton={false})', () => {
      expect(campusChatSheetCode).toContain('showCloseButton={false}')
      expect(campusChatSheetCode).toContain('SheetClose')
      expect(campusChatSheetCode).toContain('title="Đóng chat"')
    })

    it('lọc bỏ các gói tin hệ thống [SYS_ trong room chat để không rác khung trò chuyện', () => {
      expect(campusChatSheetCode).toContain(".filter((m) => !m.text.startsWith('[SYS_'))")
    })
  })

  describe('Vùng 2: GameHeroicBanner Auto-Dismiss & Non-Blocking Invariant', () => {
    it('GameHeroicBanner sử dụng onCloseRef để không bị clearTimeout liên tục khi đồng hồ tick gây re-render', () => {
      expect(heroicBannerCode).toContain('onCloseRef = useRef(onClose)')
      expect(heroicBannerCode).toContain('onCloseRef.current = onClose')
      expect(heroicBannerCode).toContain('onCloseRef.current?.()')
    })

    it('GameHeroicBanner có pointer-events-none để không chặn tương tác hay click lên bàn cờ', () => {
      expect(heroicBannerCode).toContain('pointer-events-none')
    })

    it('XiangqiBoard tắt banner BẮT ĐẦU ngay khi người chơi bấm vào ô cờ hoặc có nước đi mới', () => {
      expect(xiangqiBoardCode).toContain('if (heroicBanner) {')
      expect(xiangqiBoardCode).toContain('setHeroicBanner(null)')
      expect(xiangqiBoardCode).toContain("if (heroicBanner?.type === 'start') {")
    })
  })
})
