// Digital Campus: Gaming Level & Progression Engine (Level 1–100 RPG / Arcade Curve)

export interface GamingRankInfo {
  level: number
  title: string
  badgeVariant: 'novice' | 'apprentice' | 'warrior' | 'master' | 'grandmaster' | 'legend'
  currentXp: number
  nextLevelXp: number
  progressPercent: number
  totalXp: number
}

/**
 * Tính toán Cấp bậc và tiến trình dựa trên tổng số XP tích lũy
 * Công thức bậc thang: Mỗi level cần (level * 80) XP
 */
export function calculateGamingRank(totalXp: number): GamingRankInfo {
  const safeXp = Math.max(0, Math.floor(totalXp || 0))

  let level = 1
  let accumulatedXp = 0

  while (level < 100) {
    const xpNeededForThisLevel = level * 80
    if (accumulatedXp + xpNeededForThisLevel > safeXp) {
      break
    }
    accumulatedXp += xpNeededForThisLevel
    level++
  }

  const currentLevelBaseXp = accumulatedXp
  const xpNeededForNext = level < 100 ? level * 80 : 0
  const xpInCurrentLevel = safeXp - currentLevelBaseXp
  const progressPercent = level >= 100 ? 100 : Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100))

  let title = 'Tập sự'
  let badgeVariant: GamingRankInfo['badgeVariant'] = 'novice'

  if (level >= 90) {
    title = 'Huyền thoại'
    badgeVariant = 'legend'
  } else if (level >= 75) {
    title = 'Đại kiện tướng'
    badgeVariant = 'grandmaster'
  } else if (level >= 50) {
    title = 'Kiện tướng'
    badgeVariant = 'master'
  } else if (level >= 25) {
    title = 'Chiến binh'
    badgeVariant = 'warrior'
  } else if (level >= 10) {
    title = 'Tân binh'
    badgeVariant = 'apprentice'
  }

  return {
    level,
    title,
    badgeVariant,
    currentXp: xpInCurrentLevel,
    nextLevelXp: xpNeededForNext,
    progressPercent,
    totalXp: safeXp,
  }
}
