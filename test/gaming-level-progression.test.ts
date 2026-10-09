// test/gaming-level-progression.test.ts
// Digital Campus: Gaming Level Progression & Dopamine Engine Tests

import { describe, expect, it } from 'vitest'
import { calculateGamingRank } from '../src/features/games/gaming-level'

describe('Gaming Level Progression Engine', () => {
  it('calculates initial rank correctly at 0 XP', () => {
    const rank = calculateGamingRank(0)
    expect(rank.level).toBe(1)
    expect(rank.title).toBe('Tập sự')
    expect(rank.badgeVariant).toBe('novice')
    expect(rank.currentXp).toBe(0)
    expect(rank.nextLevelXp).toBe(80)
    expect(rank.progressPercent).toBe(0)
  })

  it('promotes to Level 2 when XP reaches threshold', () => {
    const rank = calculateGamingRank(80)
    expect(rank.level).toBe(2)
    expect(rank.currentXp).toBe(0)
    expect(rank.nextLevelXp).toBe(160)
  })

  it('promotes to higher titles according to level curves', () => {
    // Level 10: Tân binh (needs 80*1 + 80*2 + ... + 80*9 = 80 * 45 = 3600 XP)
    const rankApprentice = calculateGamingRank(3600)
    expect(rankApprentice.level).toBe(10)
    expect(rankApprentice.title).toBe('Tân binh')
    expect(rankApprentice.badgeVariant).toBe('apprentice')

    // High level title test
    const rankLegend = calculateGamingRank(500_000)
    expect(rankLegend.level).toBeGreaterThanOrEqual(90)
    expect(rankLegend.title).toBe('Huyền thoại')
    expect(rankLegend.badgeVariant).toBe('legend')
  })

  it('caps at Level 100 max', () => {
    const rankMax = calculateGamingRank(999_999_999)
    expect(rankMax.level).toBe(100)
    expect(rankMax.progressPercent).toBe(100)
    expect(rankMax.title).toBe('Huyền thoại')
  })
})
