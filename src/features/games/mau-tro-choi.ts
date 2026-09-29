import type { GameType } from '@shared/protocol/game'

/** Màu nhận diện riêng từng trò (hào quang ảnh bìa, khung trống sảnh…) — giúp phân biệt nhanh khi lướt danh sách. */
const MAU_NHAN: Record<GameType, string> = {
  chess: '#f59e0b',
  xiangqi: '#ef4444',
  caro_15: '#22d3ee',
  solo_memory: '#8b5cf6',
  solo_snake: '#10b981',
}

export const mauNhanTroChoi = (gameType: GameType): string => MAU_NHAN[gameType] || '#22d3ee'
