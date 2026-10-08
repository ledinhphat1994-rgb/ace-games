// Chế độ chơi gọi thống nhất PvE (đấu máy) · PvP (đấu người) ở mọi nơi có đấu máy / đấu người, dùng MỘT cụm chung
// (CumPvePvp) cho bốn bàn (Caro, Cờ vua, Cờ tướng, Trí Nhớ) và Rắn Săn Mồi (chỉ PvE — không có PvP giả).
import { describe, expect, it } from 'vitest'
import cumRaw from '../src/features/games/CumPvePvp.tsx?raw'
import toolbarRaw from '../src/features/games/GamePlayToolbar.tsx?raw'
import snakeRaw from '../src/features/games/snake/SnakeDuel.tsx?raw'
import banOnlineRaw from '../src/features/games/ban-online.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'
import { chuanHoaThietLap, THIET_LAP_MAC_DINH, SO_MAY_CHON } from '../src/features/games/snake/thiet-lap'

const CU = ['Chơi với máy', 'Chơi với người', 'Đấu online']

describe('PvE · PvP thống nhất', () => {
  it('không nơi nào còn gọi "Chơi với máy / Chơi với người / Đấu online"', () => {
    for (const [ten, raw] of Object.entries({ cumRaw, toolbarRaw, snakeRaw, banOnlineRaw, chessRaw, xiangqiRaw, caroRaw, memoryRaw })) {
      for (const cu of CU) expect(raw, `${ten}: ${cu}`).not.toContain(cu)
    }
  })

  it('một cụm chung: thanh công cụ dùng CumPvePvp, không còn bản sao nút PvE / PvP / bảng cấp độ trong thanh công cụ', () => {
    expect(toolbarRaw).toContain('<CumPvePvp')
    expect(toolbarRaw.match(/<CumPvePvp/g)).toHaveLength(1)
    for (const cu of ['<span>PvE</span>', '<span>PvP</span>', 'Cấp độ Máy AI', 'PopoverContent']) expect(toolbarRaw).not.toContain(cu)
    expect(cumRaw).toContain('<span className="game-control-label">PvE</span>')
    expect(cumRaw).toContain('<span className="game-control-label">PvP</span>')
    expect(cumRaw).toContain('bg-brand text-primary-foreground')
    expect(cumRaw).toContain('from-amber-500 to-rose-600')
    for (const raw of [chessRaw, xiangqiRaw, caroRaw, memoryRaw]) expect(raw).toContain('<GamePlayToolbar')
  })

  it('Rắn Săn Mồi hỗ trợ PvE và PvP kèm chọn số máy trong màn cấu hình', () => {
    expect(snakeRaw).toContain("mode === 'ai'")
    expect(snakeRaw).toContain('pveCapacity')
    expect(snakeRaw).toContain('pass_and_play')
  })
})

describe('Thiết lập Rắn Săn Mồi', () => {
  it('giá trị lạ / hỏng trong bộ nhớ trình duyệt quay về mặc định; giá trị hợp lệ được giữ', () => {
    expect(chuanHoaThietLap(null)).toEqual(THIET_LAP_MAC_DINH)
    expect(chuanHoaThietLap('xâu')).toEqual(THIET_LAP_MAC_DINH)
    expect(chuanHoaThietLap({ capDo: 'god', soMay: 9999 })).toEqual(THIET_LAP_MAC_DINH)
    expect(chuanHoaThietLap({ capDo: 'hard', soMay: 12 })).toEqual({ capDo: 'hard', soMay: 12 })
    expect(SO_MAY_CHON).toContain(THIET_LAP_MAC_DINH.soMay)
  })
})
