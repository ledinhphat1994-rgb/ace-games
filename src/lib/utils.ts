export { cn } from "cn"

/**
 * Tên lớp để hiển thị, không lặp chữ "Lớp": dữ liệu có nơi lưu "10A7", có nơi lưu "Lớp 10A7".
 * tenLop('10A7') → 'Lớp 10A7' · tenLop('Lớp 10A7') → 'Lớp 10A7'
 */
export function tenLop(ten: string): string {
  const gon = ten.trim()
  return /^lớp\s/i.test(gon) ? gon : `Lớp ${gon}`
}

/**
 * Chữ cái đầu cho ảnh đại diện chưa có hình: chữ đầu của từ đầu và từ cuối.
 * getInitials('Lê Hoàng Long') → 'LL' · getInitials('Nguyễn') → 'NG' · getInitials('') → 'HS'
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return 'HS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
