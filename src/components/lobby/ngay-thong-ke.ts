/** '2026-09-29' → '29/9' (nhãn ngày ngắn cho biểu đồ / bảng thống kê). */
export function ngayNgan(ngay: string): string {
  const [, thang, ngayThang] = ngay.split('-')
  return `${Number(ngayThang)}/${Number(thang)}`
}

/** Nhãn một ngày trong thống kê: hôm nay hiện "Hôm nay". */
export const nhanNgay = (ngay: string, homNay?: string) => (ngay === homNay ? 'Hôm nay' : ngayNgan(ngay))
