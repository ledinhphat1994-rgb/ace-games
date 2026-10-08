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

  it('không còn Vùng 1 trên đỉnh, nút Chế độ chơi được tích hợp vào cụm thao tác nhanh và phím tắt', () => {
    expect(snakeDuelContent).toContain('data-testid="nut-che-do-choi"')
    expect(snakeDuelContent).toContain('handleToggleFullscreen')
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

  it('Bảng xếp hạng TOP 10 (Vùng 1) hiển thị và cập nhật số người còn lại aliveCount thời gian thực', () => {
    expect(wormateContent).toContain('const [aliveCount, setAliveCount] = useState')
    expect(wormateContent).toContain('{aliveCount} còn lại')
    expect(wormateContent).toContain('setLeaderboard(')
    expect(wormateContent).toContain('setPlayerRank(')
    expect(wormateContent).toContain('setAliveCount(livingCount)')
  })

  it('Vòng tròn thu hẹp sân đấu: đi vào vùng cấm ngoài vòng bo sẽ bị xử thua ngay lập tức', () => {
    expect(wormateContent).toContain('distFromSafeCenter > sz.currentRadius')
    expect(wormateContent).toContain("reason: 'Đi vào vùng cấm ngoài vòng bo!'")
    expect(wormateContent).toContain("finishGame(false, 'Đi vào vùng cấm ngoài vòng bo!')")
    expect(wormateContent).toContain('aiDistFromSafe > sz.currentRadius')
    expect(wormateContent).toContain('p2DistFromSafe > sz.currentRadius')
  })
})
