// D1 lưu CURRENT_TIMESTAMP dạng 'YYYY-MM-DD HH:MM:SS' theo UTC nhưng không ghi múi giờ.
export function msTuD1(giaTri: string | null | undefined): number {
  if (!giaTri) return 0
  const ms = Date.parse(giaTri.includes('T') ? giaTri : `${giaTri.replace(' ', 'T')}Z`)
  return Number.isFinite(ms) ? ms : 0
}
