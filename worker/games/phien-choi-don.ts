// Tiện ích cho cổng game chơi đơn. Để ở module riêng: file entry (worker/index.ts) chỉ được export handler/class —
// workerd từ chối khởi động nếu entry export hằng số.

/** Ván chơi đơn quá 6 giờ vẫn 'active' là ván bỏ dở (đóng tab, mất mạng giữa chừng). */
export const PHIEN_CHOI_BO_DO_SAU_MS = 6 * 60 * 60 * 1000

/** Cron hằng ngày: đánh dấu 'abandoned' cho ván bỏ dở. Hàng vẫn giữ lại (bằng chứng chống gian lận), chỉ thôi treo 'active'. */
export async function danhDauPhienChoiBoDo(db: D1Database, nowMs = Date.now()): Promise<number> {
  const kq = await db
    .prepare("UPDATE game_sessions SET status = 'abandoned', ended_at = ?1 WHERE status = 'active' AND started_at < ?2")
    .bind(nowMs, nowMs - PHIEN_CHOI_BO_DO_SAU_MS)
    .run()
  return kq.meta?.changes ?? 0
}

/** Họ tên rút gọn cho khách chưa đăng nhập: giữ tên (từ cuối), các từ còn lại chỉ giữ chữ cái đầu — "Lê Đình Phát" → "L. Đ. Phát". */
export function rutGonHoTen(ten: string): string {
  const tu = ten.trim().split(/\s+/).filter(Boolean)
  if (tu.length <= 1) return tu[0] ?? ''
  return [...tu.slice(0, -1).map((t) => `${Array.from(t)[0]}.`), tu[tu.length - 1]].join(' ')
}

/** Chặn gọi dồn dập ở cổng game không có bước xác thực (mỗi tài khoản, mỗi cổng). Lỗi binding thì cho qua như các limiter khác. */
export async function vuotGioiHanGame(env: Env, cong: string, accountId: number): Promise<boolean> {
  if (!env.GAME_LIMITER) return false
  try {
    return !(await env.GAME_LIMITER.limit({ key: `${cong}:${accountId}` })).success
  } catch (err) {
    console.warn(`[game] Lỗi GAME_LIMITER (${cong}):`, err)
    return false
  }
}
