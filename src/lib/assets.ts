/**
 * Bản đồ quản lý tài nguyên tĩnh tập trung (Centralized Static Assets Map)
 * Digital Campus v2
 *
 * Mọi đường dẫn hình ảnh Banner và Thumbnail được quản lý tại đây để:
 * 1. Không hardcode rải rác trong các component.
 * 2. Hỗ trợ fallback linh hoạt giữa cấu trúc mới và tài nguyên sẵn có.
 * 3. Cho phép thay đổi ảnh toàn hệ thống chỉ với một dòng cấu hình.
 */

export const ASSET_BANNERS = {
  home: {
    bg: '/assets/banners/home/hero_bg.webp',
    art: '/assets/banners/home/hero_art.webp',
  },
  learn: {
    bg: '/assets/banners/learn/hero_bg.webp',
    art: '/assets/banners/learn/hero_art.webp',
  },
  arena: {
    bg: '/assets/banners/arena/hero_bg.webp',
    art: '/assets/banners/arena/hero_art.webp',
  },
  community: {
    bg: '/assets/banners/community/hero_bg.webp',
    art: '/assets/banners/community/hero_art.webp',
  },
  leaderboard: {
    bg: '/assets/banners/leaderboard/hero_bg.webp',
    podium: '/assets/banners/leaderboard/podium_art.webp',
  },
  profile: {
    cover: '/assets/banners/profile/cover_default.webp',
  },
} as const

export const ASSET_THUMBNAILS = {
  games: {
    chess: '/assets/thumbnails/games/chess.webp',
    xiangqi: '/assets/thumbnails/games/xiangqi.webp',
    caro: '/assets/thumbnails/games/caro.webp',
    memory: '/assets/thumbnails/games/memory.webp',
    snake: '/assets/thumbnails/games/snake.webp',
    g2048: '/assets/thumbnails/games/2048.webp',
  },
  rooms: {
    study: '/assets/thumbnails/rooms/study.webp',
    math: '/assets/thumbnails/rooms/math.webp',
    physics: '/assets/thumbnails/rooms/physics.webp',
    tech: '/assets/thumbnails/rooms/tech.webp',
    security: '/assets/thumbnails/rooms/security.webp',
    youtube: '/assets/thumbnails/rooms/youtube.webp',
  },
  hub: {
    learn: '/assets/thumbnails/hub/learn.webp',
    arena: '/assets/thumbnails/hub/arena.webp',
    community: '/assets/thumbnails/hub/community.webp',
    leaderboard: '/assets/thumbnails/hub/leaderboard.webp',
  },
  activities: {
    study: '/assets/thumbnails/activities/study.webp',
    game: '/assets/thumbnails/activities/game.webp',
    community: '/assets/thumbnails/activities/community.webp',
  },
} as const

export const ASSET_AUDIO = {
  move: '/assets/audio/move.mp3',
  capture: '/assets/audio/capture.mp3',
  check: '/assets/audio/check.mp3',
  victory: '/assets/audio/victory.mp3',
  defeat: '/assets/audio/defeat.mp3',
} as const
