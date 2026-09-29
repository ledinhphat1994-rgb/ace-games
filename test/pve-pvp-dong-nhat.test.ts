// Chế độ chơi gọi thống nhất PvE (đấu máy) · PvP (đấu người) ở mọi nơi có đấu máy / đấu người: bốn bàn dùng thanh công cụ
// chung (Caro, Cờ vua, Cờ tướng, Trí Nhớ) và Rắn Săn Mồi có cụm riêng nhưng cùng tên, cùng dáng.
import { describe, expect, it } from 'vitest'
import toolbarRaw from '../src/features/games/GamePlayToolbar.tsx?raw'
import snakeRaw from '../src/features/games/snake/SnakeDuel.tsx?raw'
import banOnlineRaw from '../src/features/games/ban-online.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'

const CU = ['Chơi với máy', 'Chơi với người', 'Đấu online']

describe('PvE · PvP thống nhất', () => {
  it('không nơi nào còn gọi "Chơi với máy / Chơi với người / Đấu online"', () => {
    for (const [ten, raw] of Object.entries({ toolbarRaw, snakeRaw, banOnlineRaw, chessRaw, xiangqiRaw, caroRaw, memoryRaw })) {
      for (const cu of CU) expect(raw, `${ten}: ${cu}`).not.toContain(cu)
    }
  })

  it('bốn game dùng thanh công cụ chung, cụm giữa có PvE và PvP', () => {
    for (const raw of [chessRaw, xiangqiRaw, caroRaw, memoryRaw]) expect(raw).toContain('<GamePlayToolbar')
    expect(toolbarRaw).toContain('<span>PvE</span>')
    expect(toolbarRaw).toContain('<span>PvP</span>')
  })

  it('Rắn Săn Mồi: PvE (độ khó + số lượng máy) và PvP cùng dáng với thanh công cụ chung', () => {
    expect(snakeRaw).toContain('<span>PvE</span>')
    expect(snakeRaw).toContain('<span>PvP</span>')
    expect(snakeRaw).toContain('data-testid="che-do-pve"')
    expect(snakeRaw).toContain('data-testid="che-do-pvp"')
    expect(snakeRaw).toContain('Độ khó Máy AI')
    expect(snakeRaw).toContain('Số lượng máy tham gia')
    // Cùng màu nhấn: PvE xanh, PvP cam–hồng như thanh công cụ chung.
    expect(snakeRaw).toContain('from-cyan-500 to-blue-600')
    expect(snakeRaw).toContain('from-amber-500 to-rose-600')
    expect(toolbarRaw).toContain('from-amber-500 to-rose-600')
  })
})
