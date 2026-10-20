import { describe, it, expect } from 'vitest'
import dialogRaw from '../src/components/social/HoSoNguoiDungDialog.tsx?raw'
import xiangqiRaw from '../src/features/games/xiangqi/XiangqiBoard.tsx?raw'
import chessRaw from '../src/features/games/chess/ChessBoard.tsx?raw'
import caroRaw from '../src/features/games/caro/CaroBoard.tsx?raw'
import memoryRaw from '../src/features/games/memory/MemoryGame.tsx?raw'

describe('Fix hồ sơ đối thủ không hiển thị "★ BẠN"', () => {
  it('1. HoSoNguoiDungDialog: NguoiXem hỗ trợ isMe và NoiDungHoSoPop không gán isMe cho khách khác', () => {
    // NguoiXem có thuộc tính isMe?: boolean
    expect(dialogRaw).toContain('isMe?: boolean')

    // isMe được xác định an toàn, ưu tiên nguoi.isMe và không coi nguoi.id <= 0 là chính mình
    expect(dialogRaw).toContain('const isMe = nguoi.isMe !== undefined')
    expect(dialogRaw).toContain('? nguoi.isMe')
    expect(dialogRaw).not.toContain('? nguoi.id <= 0 : nguoi.id <= 0')
  })

  it('2. XiangqiBoard: Bấm avatar đối thủ truyền isMe: false, bấm thẻ người chơi truyền isMe: true', () => {
    // Desktop & mobile opponent avatar clicks explicitly pass isMe: false
    expect(xiangqiRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*oppAccountId\s*\|\|\s*0,[\s\S]*?isMe:\s*false/)
    // Settings modal player card explicitly passes isMe: true
    expect(xiangqiRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*myAccountId\s*\|\|\s*0,[\s\S]*?isMe:\s*true/)
  })

  it('3. ChessBoard: Bấm avatar đối thủ truyền isMe: false, bấm thẻ người chơi truyền isMe: true', () => {
    expect(chessRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*oppAccountId\s*\|\|\s*0,[\s\S]*?isMe:\s*false/)
    expect(chessRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*myAccountId\s*\|\|\s*0,[\s\S]*?isMe:\s*true/)
  })

  it('4. CaroBoard: Bấm avatar đối thủ truyền isMe: false, bấm thẻ người chơi truyền isMe: true', () => {
    expect(caroRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*oppAccountId\s*\|\|\s*0,[\s\S]*?isMe:\s*false/)
    expect(caroRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*myAccountId\s*\|\|\s*0,[\s\S]*?isMe:\s*true/)
  })

  it('5. MemoryGame: Bấm avatar đối thủ truyền isMe: false, bấm thẻ người chơi truyền isMe: true', () => {
    expect(memoryRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*0,[\s\S]*?isMe:\s*false/)
    expect(memoryRaw).toMatch(/setSelectedProfileUser\(\{\s*id:\s*myAccountId\s*\|\|\s*0,[\s\S]*?isMe:\s*true/)
  })
})
