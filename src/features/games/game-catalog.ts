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
}

// Nguồn sự thật DUY NHẤT cho tên/mô tả/màu từng trò chơi — dùng chung cho lưới trò chơi, thẻ bàn đang mở
// và khung thử nước cờ, để không lệch nhau giữa các nơi hiển thị.
export const GAME_CATALOG: GameDefinition[] = [
  {
    id: 'caro_15',
    title: 'Cờ Caro 15×15',
    shortTitle: 'Caro 15×15',
    subtitle: 'Đấu trí đỉnh cao',
    category: '1v1',
    badge: '1v1 Cổ Điển',
    badgeColor: 'from-cyan-500 to-blue-600',
    icon: '⚔️',
    description: 'Bàn cờ chuẩn 15×15, 5 quân thẳng hàng để chiến thắng.',
    boardLabel: '15×15',
  },
  {
    id: 'caro_9',
    title: 'Caro Nhanh 9×9',
    shortTitle: 'Caro Nhanh 9×9',
    subtitle: 'Tốc chiến tốc thắng',
    category: '1v1',
    badge: 'Siêu Tốc',
    badgeColor: 'from-amber-500 to-orange-600',
    icon: '⚡',
    description: 'Bàn cờ 9×9 nhịp độ cực nhanh, mỗi lượt đi chớp nhoáng.',
    boardLabel: '9×9',
  },
  {
    id: 'connect4',
    title: 'Connect 4',
    shortTitle: 'Connect 4',
    subtitle: 'Thả quân trọng lực',
    category: '1v1',
    badge: 'Chiến Thuật',
    badgeColor: 'from-rose-500 to-pink-600',
    icon: '🔴',
    description: 'Thả quân theo cột, xếp 4 quân đồng màu liên tiếp để thắng.',
    boardLabel: '7×6',
  },
  {
    id: 'reversi',
    title: 'Reversi (Othello)',
    shortTitle: 'Reversi',
    subtitle: 'Lật ngược thế cờ',
    category: '1v1',
    badge: 'Trí Tuệ',
    badgeColor: 'from-emerald-500 to-teal-600',
    icon: '⚪',
    description: 'Kẹp quân đối phương ở 8 hướng để lật cờ, ăn nhiều quân nhất khi kín bàn.',
    boardLabel: '8×8',
  },
  {
    id: 'solo_2048',
    title: '2048 Siêu Cấp',
    shortTitle: '2048',
    subtitle: 'Ghép số kinh điển',
    category: 'solo',
    badge: 'Solo Logic',
    badgeColor: 'from-yellow-500 to-amber-600',
    icon: '🔢',
    description: 'Trượt các ô để hợp nhất số bằng nhau, chinh phục mốc điểm 2048.',
    boardLabel: null,
  },
  {
    id: 'solo_memory',
    title: 'Lật Thẻ Trí Nhớ',
    shortTitle: 'Trí nhớ',
    subtitle: 'Thử thách trí nhớ',
    category: 'solo',
    badge: 'Solo Trí Nhớ',
    badgeColor: 'from-purple-500 to-indigo-600',
    icon: '🃏',
    description: 'Lật tìm các cặp biểu tượng tương ứng với số lượt ít nhất.',
    boardLabel: null,
  },
  {
    id: 'solo_snake',
    title: 'Rắn Săn Mồi Retro',
    shortTitle: 'Rắn săn mồi',
    subtitle: 'Vui nhộn giải lao',
    category: 'solo',
    badge: 'Solo Phản Xạ',
    badgeColor: 'from-green-500 to-emerald-600',
    icon: '🐍',
    description: 'Điều khiển chú rắn ăn táo, tránh va vào tường hoặc cắn vào thân mình.',
    boardLabel: null,
  },
]

export const GAME_CATALOG_BY_ID = Object.fromEntries(GAME_CATALOG.map((g) => [g.id, g])) as Record<
  GameType,
  GameDefinition
>

export const CAC_GAME_1V1 = GAME_CATALOG.filter((g) => g.category === '1v1')
export const CAC_GAME_SOLO = GAME_CATALOG.filter((g) => g.category === 'solo')
