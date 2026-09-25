export { cn } from "cn"

/**
 * Tên lớp để hiển thị, không lặp chữ "Lớp": dữ liệu có nơi lưu "10A7", có nơi lưu "Lớp 10A7".
 * tenLop('10A7') → 'Lớp 10A7' · tenLop('Lớp 10A7') → 'Lớp 10A7'
 */
export function tenLop(ten: string): string {
  const gon = ten.trim()
  return /^lớp\s/i.test(gon) ? gon : `Lớp ${gon}`
}
