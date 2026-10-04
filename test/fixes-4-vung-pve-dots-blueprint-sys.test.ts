import { describe, expect, it } from 'vitest'
import gameBoardViewCode from '../src/features/games/GameBoardView.tsx?raw'
import xiangqiBoardCode from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import chessBoardCode from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroBoardCode from '../src/features/games/caro/CaroBoard.tsx?raw'
import campusChatDrawerCode from '../src/features/hub/CampusChatDrawer.tsx?raw'
import directMessageThreadCode from '../src/components/chat/DirectMessageThread.tsx?raw'
import campusChatSheetCode from '../src/components/layout/CampusChatSheet.tsx?raw'
import roomDoCode from '../worker/room-do.ts?raw'
import { nenTuVaoBan } from '../src/features/games/game-ids'

describe('Fixes 4 Vùng: PVE Eviction, 3-Dots Hover Timer, Blueprint Watermark, System Message Filtering', () => {
  describe('Vùng 1: PVE Mode Eviction & AI Opponent Display', () => {
    it('nenTuVaoBan trả về false khi bàn đang ở chế độ isPve để người thật không thể nhảy vào ghế', () => {
      const meta = { status: 'waiting' as const, playerX: 'host_key', playerO: null, isPve: true }
      expect(nenTuVaoBan(meta, 'guest_key')).toBe(false)
    })

    it('room-do.ts xử lý game.set_pve, đẩy playerO văng ra khi bật PVE và chặn người khác tham gia ghế', () => {
      expect(roomDoCode).toContain("case 'game.set_pve':")
      expect(roomDoCode).toContain('expelledPlayerO = isPve ? this.gameMeta.playerO : null')
      expect(roomDoCode).toContain('this.gameMeta.isPve && att.key !== this.gameMeta.playerX')
      expect(roomDoCode).toContain('Bàn đang ở chế độ Đấu Máy (PvE). Bạn chỉ có thể theo dõi.')
    })

    it('XiangqiBoard hiển thị Người chơi AI và icon Bot khi ở chế độ PVE', () => {
      expect(xiangqiBoardCode).toContain('opponentName = isPveMode')
      expect(xiangqiBoardCode).toContain("? 'Người chơi AI'")
      expect(xiangqiBoardCode).toContain('title="Người chơi AI"')
      expect(xiangqiBoardCode).toContain("online.datPve(newMode === 'ai')")
    })

    it('ChessBoard và CaroBoard cũng hiển thị Người chơi AI khi ở chế độ PVE', () => {
      expect(chessBoardCode).toContain("mode === 'ai' || Boolean(online?.meta.isPve)")
      expect(chessBoardCode).toContain("? 'Người chơi AI'")
      expect(caroBoardCode).toContain("mode === 'ai' || Boolean(online?.meta.isPve)")
      expect(caroBoardCode).toContain("? 'Người chơi AI'")
    })
  })

  describe('Vùng 2: Ẩn dấu 3 chấm, hover 1s hiện 3s', () => {
    it('CampusChatDrawer ẩn dấu 3 chấm nếu không hover, hiện trong 3s nếu hover vào tin nhắn 1s', () => {
      expect(campusChatDrawerCode).toContain('handleMessageMouseEnter')
      expect(campusChatDrawerCode).toContain('handleMessageMouseLeave')
      expect(campusChatDrawerCode).toContain('1000')
      expect(campusChatDrawerCode).toContain('3000')
      expect(campusChatDrawerCode).toContain("isDotsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'")
    })

    it('DirectMessageThread ẩn dấu 3 chấm nếu không hover, hiện trong 3s nếu hover vào tin nhắn 1s', () => {
      expect(directMessageThreadCode).toContain('handleMessageMouseEnter')
      expect(directMessageThreadCode).toContain('handleMessageMouseLeave')
      expect(directMessageThreadCode).toContain('1000')
      expect(directMessageThreadCode).toContain('3000')
      expect(directMessageThreadCode).toContain("isDotsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'")
    })
  })

  describe('Vùng 3: Họa tiết mờ background Blueprint', () => {
    it('GameBoardView tích hợp BlueprintArcadePattern vào game-stage với độ mờ tinh tế không gây rối mắt', () => {
      expect(gameBoardViewCode).toContain("import { BlueprintArcadePattern } from '@/components/ui/blueprint-patterns'")
      expect(gameBoardViewCode).toContain('<BlueprintArcadePattern className="opacity-20 pointer-events-none" />')
    })
  })

  describe('Vùng 4: Xóa nội dung tin nhắn hệ thống không cần thiết', () => {
    it('CampusChatDrawer lọc bỏ toàn bộ tin nhắn [SYS_ để không rác khung trò chuyện', () => {
      expect(campusChatDrawerCode).toContain("!m.noiDung.trim().startsWith('[SYS_')")
    })

    it('DirectMessageThread lọc bỏ tin nhắn [SYS_', () => {
      expect(directMessageThreadCode).toContain("!m.noiDung.trim().startsWith('[SYS_')")
    })

    it('CampusChatSheet lọc bỏ tin nhắn [SYS_', () => {
      expect(campusChatSheetCode).toContain("!m.text.startsWith('[SYS_')")
      expect(campusChatSheetCode).toContain("!m.noiDung.trim().startsWith('[SYS_')")
    })

    it('GameBoardView chat bridge lọc bỏ tin nhắn [SYS_', () => {
      expect(gameBoardViewCode).toContain("!m.text.startsWith('[SYS_')")
    })
  })
})
