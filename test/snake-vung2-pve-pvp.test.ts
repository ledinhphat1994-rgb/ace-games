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

  it('GamePlayToolbar hỗ trợ centerRowSlot và không render Hàng 2 khi hideCenterTurn', () => {
    expect(toolbarContent).toContain('centerRowSlot?: React.ReactNode')
    expect(toolbarContent).toContain('(!hideCenterTurn || Boolean(opponentSlot || nutThoiGian || rightSlot || playerSlot || showRoomChat || showRankings))')
  })

  it('xóa 2 nút pve và pvp gần card sảnh, thay vào đó tạo nút Chế độ chơi ở giữa cùng hàng', () => {
    expect(snakeDuelContent).toContain('hideModeSelector={true}')
    expect(snakeDuelContent).toContain('centerRowSlot=')
    expect(snakeDuelContent).toContain('<span>Chế độ chơi</span>')
    expect(snakeDuelContent).toContain('data-testid="nut-che-do-choi"')
  })

  it('chế độ mặc định của Rắn Săn Mồi là PvE (ai)', () => {
    expect(snakeDuelContent).toContain("const [mode, setMode] = useState<PlayMode>('ai')")
  })

  it('trong PvE, mỗi người chơi thật vào sẽ thay thế 1 bot máy cho tới tối đa số rắn (tối đa 50)', () => {
    expect(snakeDuelContent).toContain('const [pveCapacity, setPveCapacity] = useState<number>(MAX_CAPACITY)')
    expect(snakeDuelContent).toContain('const soBotPve = Math.max(0, pveCapacity - soNguoiThat)')
    expect(snakeDuelContent).toContain("const aiCount = mode === 'ai' ? soBotPve : 0")
    expect(wormateContent).toContain('pveCapacity >= 50')
  })

  it('PvP là chế độ riêng chỉ dành cho người chơi thật (0 bot)', () => {
    expect(snakeDuelContent).toContain("const aiCount = mode === 'ai' ? soBotPve : 0")
    expect(snakeDuelContent).not.toContain('ChonSoMay soMay={aiCount}')
    expect(wormateContent).toContain('pvpTargetCount >= 50')
  })

  it('PvP có cơ chế bắt đầu khi chủ phòng đủ số lượng mong muốn hoặc có xác nhận từ thành viên', () => {
    expect(snakeDuelContent).toContain('canStartPvp')
    expect(snakeDuelContent).toContain('soNguoiThat >= pvpTargetCount')
    expect(snakeDuelContent).toContain('cacThanhVienKhacSanSang')
    expect(wormateContent).toContain('canStartPvp')
    expect(wormateContent).toContain('pvpTargetCount')
    expect(wormateContent).toContain('onPvpTargetCountChange')
  })

  it('chế độ pve và pvp khi đã xác nhận chơi thành công thì không thay đổi được cho tới khi hủy phòng', () => {
    expect(snakeDuelContent).toContain('isSessionLocked')
    expect(snakeDuelContent).toContain('hasConfirmedPlay')
    expect(snakeDuelContent).toContain('handleHuyPhong')
    expect(wormateContent).toContain('isSessionLocked')
    expect(wormateContent).toContain('Hủy phòng')
  })
})
