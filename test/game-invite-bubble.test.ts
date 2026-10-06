import { describe, it, expect } from 'vitest'
import { parseGameInvite } from '../src/components/chat/game-invite-parser'
import gameSocialSidebarRaw from '../src/features/games/GameSocialSidebar.tsx?raw'
import dmThreadRaw from '../src/components/chat/DirectMessageThread.tsx?raw'
import campusChatRaw from '../src/features/hub/CampusChatDrawer.tsx?raw'

describe('GameInviteBubble & Lời mời bàn đấu dạng nút bấm', () => {
  it('phân tích chính xác tin nhắn lời mời cờ tướng kèm link mật khẩu như ảnh chụp người dùng', () => {
    const rawMsg =
      'Lời mời tham gia bàn đấu Phòng Cờ Tướng:\nhttp://localhost:5173/game/co-tuong-rieng-tu-phong-55?pass=1234'
    const result = parseGameInvite(rawMsg)

    expect(result).not.toBeNull()
    expect(result?.roomName).toBe('Phòng Cờ Tướng')
    expect(result?.gamePath).toBe('/game/co-tuong-rieng-tu-phong-55?pass=1234')
    expect(result?.isPrivate).toBe(true)
    expect(result?.gameType).toBe('xiangqi')
  })

  it('phân tích chính xác tin nhắn cờ vua và cờ caro không có mật khẩu', () => {
    const rawMsgChess = 'Lời mời tham gia bàn đấu Bàn Cờ Vua VIP: https://campus.edu.vn/game/chess-vip-1'
    const resChess = parseGameInvite(rawMsgChess)
    expect(resChess).not.toBeNull()
    expect(resChess?.roomName).toBe('Bàn Cờ Vua VIP')
    expect(resChess?.gameType).toBe('chess')
    expect(resChess?.isPrivate).toBe(false)

    const rawMsgCaro = 'Mời bạn vào bàn /game/caro_15-999'
    const resCaro = parseGameInvite(rawMsgCaro)
    expect(resCaro).not.toBeNull()
    expect(resCaro?.gameType).toBe('caro')
    expect(resCaro?.gamePath).toBe('/game/caro_15-999')
  })

  it('bỏ qua tin nhắn trò chuyện thông thường không có link game', () => {
    expect(parseGameInvite('chào cu')).toBeNull()
    expect(parseGameInvite('hôm nay có bài tập gì không')).toBeNull()
    expect(parseGameInvite('')).toBeNull()
  })

  it('GameSocialSidebar tích hợp GameInviteBubble để hiển thị nút bấm Vào Bàn Ngay thay vì text thô', () => {
    expect(gameSocialSidebarRaw).toContain("import { GameInviteBubble, parseGameInvite } from '@/components/chat/GameInviteBubble'")
    expect(gameSocialSidebarRaw).toContain('const invite = parseGameInvite(m.noiDung)')
    expect(gameSocialSidebarRaw).toContain('<GameInviteBubble invite={invite} isMe={isMe} />')
  })

  it('DirectMessageThread và CampusChatDrawer cũng đồng bộ hiển thị thẻ lời mời game', () => {
    expect(dmThreadRaw).toContain('GameInviteBubble')
    expect(dmThreadRaw).toContain('parseGameInvite')

    expect(campusChatRaw).toContain('GameInviteBubble')
    expect(campusChatRaw).toContain('parseGameInvite')
  })
})
