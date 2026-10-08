export interface SizeTierInfo {
  tier: number
  name: string
  minScore: number
  color: string
}

export const SIZE_TIERS: readonly SizeTierInfo[] = [
  { tier: 1, name: 'Bé Bỏng', minScore: 0, color: '#38bdf8' },
  { tier: 2, name: 'Trưởng Thành', minScore: 250, color: '#34d399' },
  { tier: 3, name: 'Dũng Mãnh', minScore: 800, color: '#fbbf24' },
  { tier: 4, name: 'Khổng Lồ', minScore: 2000, color: '#fb923c' },
  { tier: 5, name: 'Cự Thú', minScore: 5000, color: '#f43f5e' },
  { tier: 6, name: 'CHÚA TỂ TITAN', minScore: 10000, color: '#c084fc' },
]

export function getWormSizeTier(score: number): SizeTierInfo {
  for (let i = SIZE_TIERS.length - 1; i >= 0; i--) {
    if (score >= SIZE_TIERS[i].minScore) return SIZE_TIERS[i]
  }
  return SIZE_TIERS[0]
}
