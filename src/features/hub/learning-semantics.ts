// src/features/hub/learning-semantics.ts
// Digital Campus v2: Milestone U2 — Learning Metric Semantics (Data-Truth)

/**
 * Invariant:
 * aggregate sum(room.soNguoi) represents total room occupancy / seats occupied,
 * NOT unique online users. Therefore:
 * - prohibitedLabel: "Học sinh online"
 * - truthful labels: "Đang tham gia", "Lượt trong phòng"
 */
export const LEARNING_OCCUPANCY_METRIC_CONFIG = {
  headerLabel: 'Đang tham gia',
  subLabel: 'Lượt trong phòng',
  prohibitedLabel: 'Học sinh online',
} as const
