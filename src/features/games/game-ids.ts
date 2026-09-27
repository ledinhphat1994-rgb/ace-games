import type { GameMetaState, GameType } from '@shared/protocol/game'

/** Mẫu mã bàn máy chủ chấp nhận ở cổng `/ws/game/:maPhong` (worker/index.ts — vaoPhongGame). */
export const MAU_MA_BAN = /^[a-z0-9-]{1,64}$/

const CAC_TRO_CHOI_DON: readonly GameType[] = ['solo_memory', 'solo_snake']

export const laTroChoiDon = (gameType: GameType): boolean => CAC_TRO_CHOI_DON.includes(gameType)

/**
 * Tạo mã bàn mới cho sảnh Game. Loại trò chơi có dấu gạch dưới (`caro_15`, `solo_2048`) nên phải đổi
 * sang gạch ngang: mã dạng `caro_15-…` bị máy chủ từ chối (400) nên bàn Caro không bao giờ kết nối được.
 */
export function taoMaBan(gameType: GameType, now: number = Date.now(), random: number = Math.random()): string {
  const duoi = random.toString(36).slice(2, 6) || '0'
  return `${gameType.replace(/_/g, '-')}-${now.toString(36)}-${duoi}`
}

/**
 * Người vừa tạo bàn từ sảnh có nên gửi `game.init` không: chỉ khi bàn còn nguyên (đang chờ, chưa ai ngồi).
 * `game.init` xếp người gửi vào ghế X, áp thời gian mỗi lượt đã chọn và đăng bàn lên sảnh — nên phải gửi
 * cả khi loại trò trùng mặc định (`caro_15`), nếu không chủ bàn Caro 15×15 không có ghế và bàn không hiện ở sảnh.
 */
export function nenKhoiTaoBan(meta: Pick<GameMetaState, 'status' | 'playerX' | 'playerO'>, intendedGameType?: GameType): boolean {
  return Boolean(intendedGameType) && meta.status === 'waiting' && !meta.playerX && !meta.playerO
}
