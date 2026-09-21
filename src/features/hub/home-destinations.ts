// src/features/hub/home-destinations.ts
// Digital Campus v2: Milestone U2 — Home Destinations Capability Truth Contract

export interface HomeDestinationConfig {
  id: 'learn' | 'arena' | 'community'
  title: string
  subtitle: string
  tags: string[]
  artwork: string
  href: string
  accentColor: 'blue' | 'green' | 'purple'
}

/**
 * Canonical destination cards displayed on HomePage.
 * Invariant: Must only advertise implemented capabilities and games.
 * Prohibits unsupported capabilities such as 'Cờ vua', 'Thảo luận', 'Sự kiện'.
 */
export const HOME_DESTINATION_CONFIGS: HomeDestinationConfig[] = [
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
    tags: ['Caro', '2048', 'Rắn'],
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
