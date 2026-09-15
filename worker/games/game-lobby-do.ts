import { DurableObject } from 'cloudflare:workers'
import type { BanSanh } from '../../shared/protocol/game'

/** Một object duy nhất cho toàn trường, chỉ phục vụ RPC nội bộ từ RoomDO/Worker — không nhận WebSocket. */
export const TEN_GAME_LOBBY = 'lobby'

const BAN_TOI_DA_GUI = 100
// Bàn không được RoomDO cập nhật quá lâu (RoomDO lỗi/bị khởi động lại giữa chừng, không kịp báo gỡ)
// coi như đã bỏ hoang — dọn khi có ai đọc danh sách, không cần alarm riêng.
const BAN_HET_HAN_MS = 20 * 60 * 1000

// Danh bạ các bàn Cờ/Connect 4/Reversi đang mở của Đấu Trường Game. Vòng đời một bàn rất ngắn (vài phút)
// nên RoomDO báo trực tiếp qua RPC mỗi khi trạng thái đổi, khác với danh bạ phòng học (CampusDO) chỉ cần
// đối soát định kỳ với D1 vì phòng học tồn tại lâu hơn nhiều.
export class GameLobbyDO extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    ctx.storage.sql.exec(
      'CREATE TABLE IF NOT EXISTS ban (id TEXT PRIMARY KEY, du_lieu TEXT NOT NULL, cap_nhat_luc INTEGER NOT NULL)',
    )
  }

  /** RoomDO gọi mỗi khi bàn còn đang chờ/đang chơi (init, join, move, rematch làm bàn sống lại). */
  async capNhatBan(ban: BanSanh): Promise<void> {
    this.ctx.storage.sql.exec(
      `INSERT INTO ban (id, du_lieu, cap_nhat_luc) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET du_lieu = excluded.du_lieu, cap_nhat_luc = excluded.cap_nhat_luc`,
      ban.id,
      JSON.stringify(ban),
      ban.capNhatLuc,
    )
  }

  /** RoomDO gọi khi ván kết thúc hoặc phòng đã trống hẳn (mọi người rời) — gỡ khỏi sảnh. */
  async xoaBan(id: string): Promise<void> {
    this.ctx.storage.sql.exec('DELETE FROM ban WHERE id = ?', id)
  }

  async danhSach(): Promise<BanSanh[]> {
    this.ctx.storage.sql.exec('DELETE FROM ban WHERE cap_nhat_luc < ?', Date.now() - BAN_HET_HAN_MS)
    return this.ctx.storage.sql
      .exec<{ du_lieu: string }>('SELECT du_lieu FROM ban ORDER BY cap_nhat_luc DESC LIMIT ?', BAN_TOI_DA_GUI)
      .toArray()
      .map((r) => JSON.parse(r.du_lieu) as BanSanh)
  }
}
