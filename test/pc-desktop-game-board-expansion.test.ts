import { describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
const indexCssRaw = ((env as any).INDEX_CSS ?? '') as string
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'
import snakeRaw from '../src/features/games/snake/SnakeDeluxe.tsx?raw'
import boardSizeRaw from '../src/features/games/board-size.ts?raw'

describe('Mở rộng kích thước bàn cờ & game trên màn hình PC desktop (Tối ưu không gian, Zero CLS)', () => {
  it('CSS định nghĩa đầy đủ responsive classes với media query min-width 1280px cho cả 5 game', () => {
    expect(indexCssRaw).toContain('.game-board-xiangqi')
    expect(indexCssRaw).toContain('.game-board-chess')
    expect(indexCssRaw).toContain('.game-board-caro')
    expect(indexCssRaw).toContain('.game-board-memory')
    expect(indexCssRaw).toContain('.game-board-snake')

    // Media query mở rộng desktop
    expect(indexCssRaw).toContain('@media (min-width: 1280px)')
    expect(indexCssRaw).toContain('width: min(calc((100dvh - 84px) * 0.9), min(calc(100vw - 560px), 740px));')
    expect(indexCssRaw).toContain('max-height: min(calc(100dvh - 84px), 822px);')
  })

  it('XiangqiBoard: sử dụng class game-board-xiangqi, xóa width clamp 480px ở inline style', () => {
    expect(xiangqiRaw).toContain('className="game-board-xiangqi')
    expect(xiangqiRaw).not.toContain("width: 'min(calc(100vw - 20px), min(calc((100dvh - 215px) * 0.9), 480px))'")
    expect(xiangqiRaw).toContain('aspectRatio: \'9 / 10\'')
    expect(xiangqiRaw).toContain('xl:text-[38px]')
    expect(xiangqiRaw).toContain('xl:px-10')
  })

  it('ChessBoard: sử dụng class game-board-chess, xóa width clamp 480px ở inline style', () => {
    expect(chessRaw).toContain('className="game-board-chess')
    expect(chessRaw).not.toContain("width: 'min(calc(100vw - 20px), min(calc(100dvh - 215px), 480px))'")
    expect(chessRaw).toContain('aspectRatio: \'1 / 1\'')
    expect(chessRaw).toContain('xl:text-xs')
  })

  it('CaroBoard: sử dụng class game-board-caro, xóa width clamp 480px ở inline style', () => {
    expect(caroRaw).toContain('className="game-board-caro')
    expect(caroRaw).not.toContain("width: 'min(calc(100vw - 20px), min(calc(100dvh - 215px), 480px))'")
    expect(caroRaw).toContain('aspectRatio: \'1 / 1\'')
    expect(caroRaw).toContain('xl:px-10')
  })

  it('MemoryGame: sử dụng class game-board-memory, xóa width clamp 520px ở inline style', () => {
    expect(memoryRaw).toContain('className="game-board-memory')
    expect(memoryRaw).not.toContain("width: 'min(calc(100vw - 32px), min(70vh, 520px))'")
    expect(memoryRaw).toContain('aspectRatio: \'1 / 1\'')
    expect(memoryRaw).toContain('xl:text-5xl')
  })

  it('SnakeDeluxe & board-size: hỗ trợ kích thước mở rộng trên desktop', () => {
    expect(snakeRaw).toContain('game-board-snake')
    expect(boardSizeRaw).toContain("width: 'min(100%, 720px, calc(100svh - 10rem))'")
    expect(boardSizeRaw).toContain("width: 'min(100%, 640px)'")
  })
})
