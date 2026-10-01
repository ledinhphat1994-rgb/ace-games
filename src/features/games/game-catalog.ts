import type { GameType } from '@shared/protocol/game'

export type GameCategory = '1v1' | 'solo'

export interface GameDefinition {
  id: GameType
  title: string
  shortTitle: string
  subtitle: string
  category: GameCategory
  badge: string
  badgeColor: string
  icon: string
  description: string
  /** Kích thước bàn hiển thị nhanh trên thẻ/bàn — chỉ có ở trò chơi đối kháng. */
  boardLabel: string | null
  cover: string
}

// 5 trò chơi duy nhất theo yêu cầu: Cờ vua, Cờ tướng, Caro, Trí nhớ, Rắn săn mồi
// Tất cả đều hỗ trợ: Người vs Người (PvP) & Người vs Máy (PvE AI)
export const GAME_CATALOG: GameDefinition[] = [
  {
    id: 'chess',
    title: 'Cờ Vua Quốc Tế',
    shortTitle: 'Cờ Vua',
    subtitle: 'Đấu trí đỉnh cao thế giới',
    category: '1v1',
    badge: '1v1 & Đấu AI',
    badgeColor: 'from-amber-500 to-yellow-600',
    icon: '♟️',
    description: 'Bàn cờ 8×8 tiêu chuẩn quốc tế. Thi đấu online 1v1 hoặc so tài với AI các cấp độ.',
    boardLabel: '8×8',
    cover: '/assets/games/cover_chess.webp',
  },
  {
    id: 'xiangqi',
    title: 'Cờ Tướng Đông Phương',
    shortTitle: 'Cờ Tướng',
    subtitle: 'Chiến thuật cung đình Á Đông',
    category: '1v1',
    badge: '1v1 & Đấu AI',
    badgeColor: 'from-rose-500 to-red-600',
    icon: '🏮',
    description: 'Bàn cờ 9×10, sông Sở Hà Hán Giới. Đấu trí chiến thuật 1v1 hoặc luyện tập với AI.',
    boardLabel: '9×10',
    cover: '/assets/games/cover_xiangqi.jpg',
  },
  {
    id: 'caro_15',
    title: 'Cờ Caro Đỉnh Cao',
    shortTitle: 'Cờ Caro',
    subtitle: '5 quân liên tiếp chiến thắng',
    category: '1v1',
    badge: '1v1 & Đấu AI',
    badgeColor: 'from-brand to-brand',
    icon: '⚔️',
    description: 'Bàn cờ 15×15 chuẩn thi đấu. 5 quân liên hoàn giành thắng lợi, thi đấu online hoặc đấu AI.',
    boardLabel: '15×15',
    cover: '/assets/games/cover_caro.webp',
  },
  {
    id: 'solo_memory',
    title: 'Lật Thẻ Trí Nhớ',
    shortTitle: 'Trí Nhớ',
    subtitle: 'Rèn luyện trí nhớ đỉnh cao',
    category: 'solo',
    badge: 'Đấu Điểm & Đấu AI',
    badgeColor: 'from-purple-500 to-indigo-600',
    icon: '🃏',
    description: 'Lật tìm các cặp biểu tượng khớp. Chế độ solo tính điểm hoặc thi tài so điểm cùng Máy.',
    boardLabel: '4×4',
    cover: '/assets/games/cover_memory.webp',
  },
  {
    id: 'solo_snake',
    title: 'Rắn Săn Mồi Cyberpunk',
    shortTitle: 'Rắn Săn Mồi',
    subtitle: 'Phản xạ tốc độ sinh tồn',
    category: 'solo',
    badge: 'Sinh Tồn & Đấu Rắn',
    badgeColor: 'from-emerald-500 to-teal-600',
    icon: '🐍',
    description: 'Điều khiển chú rắn neon ăn mồi phát sáng. Chơi tính điểm sinh tồn hoặc đấu đối đầu cùng Rắn AI.',
    boardLabel: '24×24',
    cover: '/assets/games/cover_snake.webp',
  },
]

export const GAME_CATALOG_BY_ID = Object.fromEntries(GAME_CATALOG.map((g) => [g.id, g])) as Record<
  GameType,
  GameDefinition
>

export const CAC_GAME_1V1 = GAME_CATALOG.filter((g) => g.category === '1v1')
export const CAC_GAME_SOLO = GAME_CATALOG.filter((g) => g.category === 'solo')
