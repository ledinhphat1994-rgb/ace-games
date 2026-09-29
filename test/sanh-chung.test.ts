// Mẫu sảnh chung (Platform Core — Discovery & Lobby) cho Học tập và từng trò chơi:
// Chơi ngay · Tạo phòng · Vào phòng · Tìm phòng + danh sách phòng đang mở, bố cục 3 cột như nhau.
import { describe, expect, it } from 'vitest'
import { phanTichMaBan } from '../src/features/games/game-ids'
import sanhRaw from '../src/components/lobby/SanhHoatDong.tsx?raw'
import gameLobbyPageRaw from '../src/features/games/GameLobbyPage.tsx?raw'
import gameCardRaw from '../src/features/games/GameCard.tsx?raw'
import gameRoomPageRaw from '../src/features/games/GameRoomPage.tsx?raw'
import mainRaw from '../src/main.tsx?raw'
import learningPageRaw from '../src/features/hub/LearningPage.tsx?raw'

const GOC = 'https://gdtxdinhquan.com'

describe('Vào phòng bằng mã / link bàn', () => {
  it('nhận mã bàn và link bàn cùng tên miền', () => {
    expect(phanTichMaBan('chess-mabc123-x1y2', GOC)).toEqual({ ok: true, maBan: 'chess-mabc123-x1y2' })
    expect(phanTichMaBan('  CARO-15-K2-AB  ', GOC)).toEqual({ ok: true, maBan: 'caro-15-k2-ab' })
    expect(phanTichMaBan(`${GOC}/game/xiangqi-m1-zz`, GOC)).toEqual({ ok: true, maBan: 'xiangqi-m1-zz' })
    expect(phanTichMaBan(`${GOC}/game/xiangqi-m1-zz?sanh=xiangqi`, GOC)).toEqual({ ok: true, maBan: 'xiangqi-m1-zz' })
  })

  it('từ chối link trang khác, link không phải bàn, mã sai định dạng, ô trống', () => {
    expect(phanTichMaBan('https://ke-gian.example/game/chess-1', GOC).ok).toBe(false)
    expect(phanTichMaBan(`${GOC}/room/phong-3`, GOC).ok).toBe(false)
    expect(phanTichMaBan('chess_1 <script>', GOC).ok).toBe(false)
    expect(phanTichMaBan('   ', GOC).ok).toBe(false)
  })
})

describe('Mẫu sảnh chung', () => {
  it('có đủ Chơi ngay · Tạo phòng · Vào phòng · Tìm phòng và trạng thái đang tải / kết nối lại / trống', () => {
    expect(sanhRaw).toContain('choiNgay && (')
    expect(sanhRaw).toContain('taoPhong && (')
    expect(sanhRaw).toContain('vaoPhong && (')
    expect(sanhRaw).toContain('data-testid={`${testId}-search-input`}')
    expect(sanhRaw).toContain('data-testid={`${testId}-lobby-loading`}')
    expect(sanhRaw).toContain('data-testid={`${testId}-lobby-reconnecting`}')
    expect(sanhRaw).toContain("trangThai === 'san_sang' && (rong ? noiDungRong : children)")
    // Zero CLS: vùng danh sách giữ chiều cao tối thiểu khi đổi trạng thái.
    expect(sanhRaw).toContain('min-h-[320px]')
  })

  it('Học tập và sảnh trò chơi cùng dùng mẫu', () => {
    expect(learningPageRaw).toContain('<SanhHoatDong')
    expect(gameLobbyPageRaw).toContain('<SanhHoatDong')
    expect(gameLobbyPageRaw).toContain('testId="game-lobby"')
  })
})

describe('Sảnh từng trò chơi', () => {
  it('bấm thẻ trò chơi mở sảnh /arena/:gameType; rời bàn quay về đúng sảnh', () => {
    expect(mainRaw).toContain("{ path: 'arena/:gameType', element: <GameLobbyPage /> }")
    expect(gameCardRaw).toContain('onClick={onMoSanh}')
    expect(gameCardRaw).toContain('Vào sảnh')
    expect(gameLobbyPageRaw).toContain('?sanh=${gameType}')
    expect(gameRoomPageRaw).toContain("navigate(sanhVe ? `/arena/${sanhVe}` : '/arena')")
  })

  it('danh sách bàn theo đúng trò (WebSocket sảnh riêng), khách không thấy số giả, trò đơn không có bàn', () => {
    expect(gameLobbyPageRaw).toContain('useGameRooms(gameType, coDanhSach)')
    expect(gameLobbyPageRaw).toContain('const coDanhSach = Boolean(nguoiDung) && !laDon')
    expect(gameLobbyPageRaw).toContain('soLuong: coDanhSach ? banLoc.length : undefined')
    expect(gameLobbyPageRaw).toContain('laDon ? undefined')
  })
})
