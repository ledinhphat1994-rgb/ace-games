// Cấp độ máy và chế độ chơi dùng chung mọi game (dữ liệu thuần, không JSX — nên module .ts khác import được).

export type CapDoMay = 'easy' | 'medium' | 'hard'
/** Chế độ chơi: `ai` = PvE; `online` / `pass_and_play` = PvP. */
export type CheDoChoi = 'ai' | 'pass_and_play' | 'online'

export const CAC_CAP_DO_MAY: readonly CapDoMay[] = ['easy', 'medium', 'hard']

export const CAP_DO_MAY: Record<CapDoMay, { nhan: string; dai: string; chip: string; chon: string; cham: string }> = {
  easy: {
    nhan: 'Dễ',
    dai: 'Dễ (Cơ bản)',
    chip: 'bg-emerald-400 text-slate-950 border-emerald-300',
    chon: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm',
    cham: 'bg-emerald-400',
  },
  medium: {
    nhan: 'Vừa',
    dai: 'Vừa (Tiêu chuẩn)',
    chip: 'bg-amber-400 text-slate-950 border-amber-200',
    chon: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm',
    cham: 'bg-amber-400',
  },
  hard: {
    nhan: 'Khó',
    dai: 'Khó (Cao thủ)',
    chip: 'bg-rose-500 text-white border-rose-300',
    chon: 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm',
    cham: 'bg-rose-400',
  },
}
