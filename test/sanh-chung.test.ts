// Mẫu sảnh chung (Platform Core — Discovery & Lobby) cho Học tập và từng trò chơi:
// Chơi ngay · Tạo phòng · Tìm phòng + danh sách phòng; vào phòng của bạn bè bằng link chia sẻ.
import { describe, expect, it } from 'vitest'
import sanhRaw from '../src/components/lobby/SanhHoatDong.tsx?raw'
import congRaw from '../src/components/lobby/CongLinkPhong.tsx?raw'
import gameLobbyPageRaw from '../src/features/games/GameLobbyPage.tsx?raw'
import gameCardRaw from '../src/features/games/GameCard.tsx?raw'
import gameRoomPageRaw from '../src/features/games/GameRoomPage.tsx?raw'
import roomPageRaw from '../src/features/study/RoomPage.tsx?raw'
import mainRaw from '../src/main.tsx?raw'
import learningPageRaw from '../src/features/hub/LearningPage.tsx?raw'

describe('Mẫu sảnh chung', () => {
  it('thanh tìm + Tạo phòng + Chơi ngay; không còn nút Vào phòng; danh sách cuộn trong khung cao bằng hai cột bên', () => {
    expect(sanhRaw).toContain('choiNgay && (')
    expect(sanhRaw).toContain('taoPhong && (')
    expect(sanhRaw).not.toContain('vaoPhong')
    expect(sanhRaw).toContain('data-testid={`${testId}-search-input`}')
    expect(sanhRaw).toContain('data-testid={`${testId}-lobby-loading`}')
    expect(sanhRaw).toContain('data-testid={`${testId}-lobby-reconnecting`}')
    expect(sanhRaw).toContain("const CAO_KHUNG = 'lg:h-[700px] xl:h-[720px] 2xl:h-[740px]'")
    expect(sanhRaw).toContain('min-h-0 flex-1 overflow-y-auto overscroll-contain')
  })

  it('Học tập và sảnh trò chơi cùng dùng mẫu; khung trống không lặp nút Tạo phòng', () => {
    expect(learningPageRaw).toContain('<SanhHoatDong')
    expect(gameLobbyPageRaw).toContain('<SanhHoatDong')
    expect(gameLobbyPageRaw).toContain('testId="game-lobby"')
    expect(learningPageRaw).not.toContain('Tạo phòng đầu tiên')
    expect(gameLobbyPageRaw).not.toContain('Tạo bàn đầu tiên')
    expect(gameLobbyPageRaw).not.toContain("nhan: 'Vào phòng'")
  })

  it('thống kê sảnh (vùng X) chỉ hiện với admin toàn quyền như ledinhphat; danh sách có đệm đỉnh chống khuất card khi hover', () => {
    expect(learningPageRaw).toContain('laAdminToanQuyen')
    expect(learningPageRaw).toContain("nguoiDung.username === 'ledinhphat'")
    expect(gameLobbyPageRaw).toContain('laAdminToanQuyen')
    expect(gameLobbyPageRaw).toContain("nguoiDung.username === 'ledinhphat'")
    // Khung cuộn danh sách có pt-1.5 và grid có pt-1 để thẻ phòng khi hover -translate-y-0.5 không bị khuất cạnh trên
    expect(sanhRaw).toContain('min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pt-1.5 pb-3')
    expect(sanhRaw).toContain('grid grid-cols-1 gap-3 pt-1')
  })
})

describe('Link phòng / bàn được chia sẻ', () => {
  it('chưa đăng nhập: ở lại đúng link, mời đăng nhập (không đẩy về trang chủ)', () => {
    expect(roomPageRaw).toContain('if (!nguoiDung) return <CongLinkPhong loai="phong" />')
    expect(roomPageRaw).not.toContain("navigate('/', { replace: true })")
    expect(gameRoomPageRaw).toContain('if (!nguoiDung && !intendedGameType) return <CongLinkPhong loai="ban" />')
    expect(congRaw).toContain("moAuthModal('dang_nhap')")
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

  it('danh sách bàn theo đúng trò (WebSocket sảnh riêng), khách không thấy số giả, sảnh các game đồng nhất', () => {
    expect(gameLobbyPageRaw).toContain('useGameRooms(gameType, coDanhSach)')
    expect(gameLobbyPageRaw).toContain('const coDanhSach = Boolean(nguoiDung)')
    expect(gameLobbyPageRaw).toContain('soLuong: coDanhSach ? banLoc.length : undefined')
    expect(gameLobbyPageRaw).toContain("tieuDe: 'Bàn đang mở'")
  })
})
