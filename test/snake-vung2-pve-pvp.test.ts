import { describe, it, expect } from 'vitest'
import snakeDuelContent from '../src/features/games/snake/SnakeDuel.tsx?raw'
import wormateContent from '../src/features/games/snake/Wormate3DArena.tsx?raw'
import toolbarContent from '../src/features/games/GamePlayToolbar.tsx?raw'

describe('Snake Vùng 2, PvE Auto-Replace, and Dedicated PvP Mechanism', () => {
  it('bỏ hoàn toàn biểu tượng cảm xúc nhanh trong SnakeDuel', () => {
    // Không còn GameQuickEmote hay DANH_SACH_THAI_DO_SNAKE
    expect(snakeDuelContent).not.toContain('GameQuickEmote')
    expect(snakeDuelContent).not.toContain('DANH_SACH_THAI_DO_SNAKE')
    expect(snakeDuelContent).not.toContain('rightSlot=')
  })

  it('GamePlayToolbar không render Hàng 2 khi hideCenterTurn và không có slot trung tâm nào', () => {
    expect(toolbarContent).toContain('(!hideCenterTurn || Boolean(opponentSlot || nutThoiGian || rightSlot || playerSlot || showRoomChat || showRankings))')
  })

  it('chế độ mặc định của Rắn Săn Mồi là PvE (ai)', () => {
    expect(snakeDuelContent).toContain("const [mode, setMode] = useState<PlayMode>('ai')")
  })

  it('trong PvE, mỗi người chơi thật vào sẽ thay thế 1 bot máy cho tới tối đa 6 người', () => {
    expect(snakeDuelContent).toContain('const MAX_CAPACITY = 6')
    expect(snakeDuelContent).toContain('const soBotPve = Math.max(0, MAX_CAPACITY - soNguoiThat)')
    expect(snakeDuelContent).toContain("const aiCount = mode === 'ai' ? soBotPve : 0")
  })

  it('PvP là chế độ riêng chỉ dành cho người chơi thật (0 bot)', () => {
    // Trong PvP, aiCount = 0
    expect(snakeDuelContent).toContain("const aiCount = mode === 'ai' ? soBotPve : 0")
    // Không còn phần chọn số bot ChonSoMay trong PvP
    expect(snakeDuelContent).not.toContain('ChonSoMay soMay={aiCount}')
  })

  it('PvP có cơ chế bắt đầu khi chủ phòng đủ số lượng mong muốn hoặc có xác nhận từ thành viên', () => {
    expect(snakeDuelContent).toContain('canStartPvp')
    expect(snakeDuelContent).toContain('soNguoiThat >= pvpTargetCount')
    expect(snakeDuelContent).toContain('cacThanhVienKhacSanSang')
    expect(wormateContent).toContain('canStartPvp')
    expect(wormateContent).toContain('pvpTargetCount')
    expect(wormateContent).toContain('onPvpTargetCountChange')
  })
})
