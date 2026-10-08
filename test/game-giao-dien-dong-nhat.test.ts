// Sảnh và màn chơi các game dùng chung một thiết kế: nút quay lại to, thẻ đồng hồ không bị cắt, chữ BẮT ĐẦU đủ dấu,
// bảng chọn cấp độ máy một kiểu, Rắn Săn Mồi có sảnh thiết lập + màn chơi cùng khung với bàn cờ.
import { describe, expect, it } from 'vitest'
import sanhRaw from '../src/components/lobby/SanhHoatDong.tsx?raw'
import bannerRaw from '../src/features/games/GameHeroicBanner.tsx?raw'
import lobbyRaw from '../src/features/games/GameLobbyPage.tsx?raw'
import snakeRaw from '../src/features/games/snake/SnakeDuel.tsx?raw'
import arenaRaw from '../src/features/games/snake/Wormate3DArena.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'
import toolbarRaw from '../src/features/games/GamePlayToolbar.tsx?raw'
import cumRaw from '../src/features/games/CumPvePvp.tsx?raw'

describe('Sảnh: nút quay lại to, dễ bấm', () => {
  it('nút quay lại 48px, mũi tên đậm 24px; ô tìm và hai nút cùng cao 48px', () => {
    expect(sanhRaw).toContain('flex size-12 shrink-0 items-center justify-center')
    expect(sanhRaw).toContain('<ArrowLeft className="size-6" strokeWidth={2.4} />')
    expect(sanhRaw).toContain('h-12 rounded-xl border-white/10')
    expect(sanhRaw.match(/className="h-12 flex-1 rounded-xl/g)).toHaveLength(2)
  })
})

describe('Thẻ đồng hồ không bị cắt khi khung hẹp', () => {
  it('cột hai bên bàn cờ co lại (shrink + min-w) thay vì tràn và bị cắt ở mép', () => {
    for (const [ten, raw] of Object.entries({ caroRaw, chessRaw, xiangqiRaw })) {
      expect(raw, ten).toContain('shrink min-w-[150px] w-[180px] xl:w-[200px] 2xl:w-[215px]')
      expect(raw, ten).not.toContain('shrink-0 w-[180px] xl:w-[200px] 2xl:w-[215px]')
    }
  })
})

describe('Chữ BẮT ĐẦU đủ dấu', () => {
  it('chữ tô gradient có chiều cao dòng + đệm để dấu (Ắ, Ầ) không bị cắt', () => {
    expect(bannerRaw).toContain('leading-[1.4] py-3 px-1')
    expect(bannerRaw).toContain("defaultTitle: 'BẮT ĐẦU'")
  })
})

describe('Bảng chọn cấp độ máy — một kiểu cho mọi game', () => {
  it('Cờ Vua, Cờ Tướng, Caro và Trí Nhớ cùng GamePlayToolbar → CumPvePvp → BangChonCapDo', () => {
    for (const raw of [caroRaw, chessRaw, xiangqiRaw, memoryRaw]) expect(raw).toContain('<GamePlayToolbar')
    expect(toolbarRaw).toContain('<CumPvePvp')
    expect(cumRaw).toContain('<BangChonCapDo')
    expect(cumRaw).toContain('data-testid="bang-chon-cap-do"')
    expect(snakeRaw).not.toContain('Độ khó Máy AI')
    expect(snakeRaw).toContain('pveCapacity')
  })
})

describe('Lobby các game đồng nhất: mọi game cùng dùng chung sảnh Bàn đang mở', () => {
  it('sảnh mọi game (bao gồm trò chơi đơn) có danh sách bàn, ô tìm kiếm, nút Tạo phòng và Chơi ngay', () => {
    expect(lobbyRaw).toContain("tieuDe: 'Bàn đang mở'")
    expect(lobbyRaw).toContain("testId: 'game-lobby-create'")
    expect(lobbyRaw).toContain("testId: 'game-lobby-play-now'")
    expect(lobbyRaw).not.toContain('game-lobby-solo')
  })

  it('màn chơi: thanh công cụ chung (Bắt đầu nổi bật · Toàn màn hình), màn sẵn sàng / kết thúc không có nút thứ hai', () => {
    expect(snakeRaw).toContain('data-testid="nut-nhanh-choi-lai"')
    expect(toolbarRaw).toContain('aria-label="Toàn màn hình"')
    expect(arenaRaw).toContain('data-testid="ran-man-san-sang"')
    expect(arenaRaw).toContain('data-testid="ran-man-ket-thuc"')
    expect(arenaRaw).toContain('BẮT ĐẦU NGAY')
    expect(arenaRaw).toContain('CHƠI LẠI NGAY')
    expect(arenaRaw).not.toContain('<Button')
  })
})
