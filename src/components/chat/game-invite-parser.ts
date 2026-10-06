export interface GameInviteData {
  roomName: string
  gamePath: string
  fullUrl: string
  isPrivate: boolean
  gameType: 'xiangqi' | 'chess' | 'caro' | 'general'
}

/**
 * Phân tích nội dung tin nhắn chat để nhận diện lời mời tham gia bàn đấu game
 */
export function parseGameInvite(text: string): GameInviteData | null {
  if (!text || typeof text !== 'string') return null

  // Kiểm tra từ khóa hoặc đường dẫn game
  const hasGameLink = text.includes('/game/')
  const hasInviteKeyword =
    text.toLowerCase().includes('lời mời tham gia bàn đấu') ||
    text.toLowerCase().includes('mời chơi') ||
    text.toLowerCase().includes('mời bạn vào bàn')

  if (!hasGameLink && !hasInviteKeyword) return null

  // Bắt URL dạng https?://.../game/... hoặc tương đối /game/...
  const urlMatch = text.match(/(https?:\/\/[^\s]+)?(\/game\/[a-zA-Z0-9_\-%]+(\?[^\s]*)?)/i)
  if (!urlMatch) {
    const fullMatch = text.match(/https?:\/\/[^\s/]+\/game\/[^\s]+/i)
    if (!fullMatch) return null
    try {
      const parsed = new URL(fullMatch[0])
      const pathWithQuery = parsed.pathname + parsed.search
      return buildInviteData(text, pathWithQuery, fullMatch[0])
    } catch {
      return null
    }
  }

  const fullUrl = urlMatch[1] ? urlMatch[1] + urlMatch[2] : urlMatch[2]
  const gamePath = urlMatch[2]
  return buildInviteData(text, gamePath, fullUrl)
}

function buildInviteData(text: string, gamePath: string, fullUrl: string): GameInviteData {
  const isPrivate = gamePath.includes('pass=') || text.toLowerCase().includes('riêng tư')

  // Trích xuất tên phòng
  let roomName = 'Bàn thi đấu'
  const prefixMatch = text.match(/Lời mời tham gia bàn đấu\s+([^:]+):/i)
  if (prefixMatch && prefixMatch[1]) {
    roomName = prefixMatch[1].trim()
  } else if (
    text.toLowerCase().includes('cờ tướng') ||
    gamePath.toLowerCase().includes('co-tuong') ||
    gamePath.toLowerCase().includes('xiangqi')
  ) {
    roomName = 'Phòng Cờ Tướng'
  } else if (text.toLowerCase().includes('cờ vua') || gamePath.toLowerCase().includes('chess')) {
    roomName = 'Phòng Cờ Vua'
  } else if (text.toLowerCase().includes('caro') || gamePath.toLowerCase().includes('caro')) {
    roomName = 'Phòng Cờ Caro'
  }

  // Xác định thể loại game
  let gameType: GameInviteData['gameType'] = 'general'
  const lowerAll = `${text} ${gamePath}`.toLowerCase()
  if (lowerAll.includes('cờ tướng') || lowerAll.includes('co-tuong') || lowerAll.includes('xiangqi')) {
    gameType = 'xiangqi'
  } else if (lowerAll.includes('cờ vua') || lowerAll.includes('chess')) {
    gameType = 'chess'
  } else if (lowerAll.includes('caro')) {
    gameType = 'caro'
  }

  return {
    roomName,
    gamePath,
    fullUrl,
    isPrivate,
    gameType,
  }
}
