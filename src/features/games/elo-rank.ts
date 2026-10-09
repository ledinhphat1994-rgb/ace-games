/**
 * Cấu trúc thông tin cấp bậc Elo
 */
export interface EloRankTier {
  tier: number
  title: string
  minElo: number
  maxElo: number
  textColor: string
  borderClass: string
  ringClass: string
  shadowClass: string
  gradientBorder: string
  icon?: 'crown' | 'flame' | 'sparkles' | 'shield'
}

/**
 * Hàm phân loại cấp bậc Elo chuẩn xác
 */
export function getEloRankTier(elo: number = 1000, isBot: boolean = false): EloRankTier {
  if (isBot) {
    return {
      tier: 3,
      title: 'AI Cấp Cao',
      minElo: 1500,
      maxElo: 1500,
      textColor: 'text-sky-300',
      borderClass: 'border-sky-400',
      ringClass: 'ring-2 ring-sky-400/40',
      shadowClass: 'shadow-[0_0_14px_rgba(56,189,248,0.55)]',
      gradientBorder: 'from-sky-400 to-blue-600',
      icon: 'shield',
    }
  }

  if (elo >= 2200) {
    return {
      tier: 7,
      title: 'Thần Thoại',
      minElo: 2200,
      maxElo: 9999,
      textColor: 'text-amber-200',
      borderClass: 'border-amber-300',
      ringClass: 'ring-2 ring-white/90',
      shadowClass: 'shadow-[0_0_30px_rgba(251,191,36,0.95),0_0_16px_rgba(244,63,94,0.8)]',
      gradientBorder: 'from-amber-300 via-rose-500 to-cyan-400',
      icon: 'crown',
    }
  }
  if (elo >= 2000) {
    return {
      tier: 6,
      title: 'Đại Kiện Tướng',
      minElo: 2000,
      maxElo: 2199,
      textColor: 'text-rose-300',
      borderClass: 'border-rose-500',
      ringClass: 'ring-2 ring-amber-400/80',
      shadowClass: 'shadow-[0_0_24px_rgba(244,63,94,0.85),0_0_12px_rgba(251,191,36,0.6)]',
      gradientBorder: 'from-rose-500 via-red-500 to-amber-400',
      icon: 'flame',
    }
  }
  if (elo >= 1800) {
    return {
      tier: 5,
      title: 'Kiện Tướng',
      minElo: 1800,
      maxElo: 1999,
      textColor: 'text-violet-300',
      borderClass: 'border-indigo-400',
      ringClass: 'ring-2 ring-violet-400/70',
      shadowClass: 'shadow-[0_0_20px_rgba(129,140,248,0.8)]',
      gradientBorder: 'from-indigo-400 via-purple-500 to-pink-500',
      icon: 'sparkles',
    }
  }
  if (elo >= 1600) {
    return {
      tier: 4,
      title: 'Cao Thủ',
      minElo: 1600,
      maxElo: 1799,
      textColor: 'text-cyan-300',
      borderClass: 'border-cyan-400',
      ringClass: 'ring-2 ring-cyan-300/60',
      shadowClass: 'shadow-[0_0_16px_rgba(6,182,212,0.7)]',
      gradientBorder: 'from-cyan-400 to-teal-500',
      icon: 'shield',
    }
  }
  if (elo >= 1400) {
    return {
      tier: 3,
      title: 'Tinh Anh',
      minElo: 1400,
      maxElo: 1599,
      textColor: 'text-amber-300',
      borderClass: 'border-amber-400',
      ringClass: 'ring-2 ring-yellow-300/50',
      shadowClass: 'shadow-[0_0_14px_rgba(245,158,11,0.6)]',
      gradientBorder: 'from-amber-400 to-yellow-600',
    }
  }
  if (elo >= 1200) {
    return {
      tier: 2,
      title: 'Chiến Binh',
      minElo: 1200,
      maxElo: 1399,
      textColor: 'text-slate-200',
      borderClass: 'border-slate-300',
      ringClass: 'ring-2 ring-slate-400/40',
      shadowClass: 'shadow-[0_0_10px_rgba(203,213,225,0.45)]',
      gradientBorder: 'from-slate-300 to-slate-500',
    }
  }
  return {
    tier: 1,
    title: 'Tân Thủ',
    minElo: 0,
    maxElo: 1199,
    textColor: 'text-amber-400',
    borderClass: 'border-amber-700/90',
    ringClass: 'ring-1 ring-amber-600/30',
    shadowClass: 'shadow-[0_0_8px_rgba(180,83,9,0.35)]',
    gradientBorder: 'from-amber-700 to-amber-900',
  }
}
