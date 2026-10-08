// src/features/hub/home-destinations.ts
// Digital Campus v2: Destinations Capability Truth Contract

export interface LegacyHomeDestinationConfig {
  id: 'learn' | 'arena' | 'community'
  title: string
  subtitle: string
  tags: string[]
  artwork: string
  href: string
  accentColor: 'blue' | 'green' | 'purple'
}

/**
 * U2 Capability Truth Contract: Must only advertise implemented capabilities and games.
 * Prohibits unsupported capabilities such as 'Cờ vua', 'Thảo luận', 'Sự kiện'.
 */
export const HOME_DESTINATION_CONFIGS: LegacyHomeDestinationConfig[] = [
  {
    id: 'learn',
    title: 'Học tập',
    subtitle: 'Khám phá kiến thức',
    tags: ['Phòng học', 'Tài liệu', 'Trao đổi'],
    artwork: '/assets/learning/card_learning.webp',
    href: '/learning',
    accentColor: 'blue',
  },
  {
    id: 'arena',
    title: 'Đấu trường Game',
    subtitle: 'Thư giãn & thử thách',
    tags: ['Cờ Vua', 'Cờ Tướng', 'Caro', 'Rắn', 'Trí Nhớ'],
    artwork: '/assets/games/card_game.webp',
    href: '/arena',
    accentColor: 'green',
  },
  {
    id: 'community',
    title: 'Cộng đồng',
    subtitle: 'Kết nối, cùng phát triển',
    tags: ['Bạn bè', 'Trực tuyến', 'Kết nối'],
    artwork: '/assets/community/card_community.webp',
    href: '/community',
    accentColor: 'purple',
  },
]

export interface HomeDestinationConfig {
  id: 'learn' | 'arena' | 'community' | 'rooms'
  title: string
  subtitle?: string
  artwork: string
  href: string
  badge?: string
}

/**
 * V3 Quick Launch Destinations on HomePage.
 * 4 active destinations: learn, arena, community, rooms.
 * Invariant: Label-first, no explanatory subtitles, no decorative HOT badges, no per-tile rainbow accent colors.
 */
export const HOME_DESTINATIONS: readonly HomeDestinationConfig[] = [
  {
    id: 'learn',
    title: 'Học tập',
    artwork: '/assets/learning/card_learning.webp',
    href: '/learning',
  },
  {
    id: 'arena',
    title: 'Game',
    artwork: '/assets/games/card_game.webp',
    href: '/arena',
  },
  {
    id: 'community',
    title: 'Cộng đồng',
    artwork: '/assets/community/card_community.webp',
    href: '/community',
  },
  {
    id: 'rooms',
    title: 'Phòng học',
    artwork: '/assets/banners/learning_hero_cyber.jpg',
    href: '/learn',
  },
]
