import type { GameMetaState, GameType } from '@shared/protocol/game'
import { SLUG_TIENG_VIET_GAME } from '@shared/protocol/game'
export { SLUG_TIENG_VIET_GAME }

/** Mẫu mã bàn máy chủ chấp nhận ở cổng `/ws/game/:maPhong` (worker/index.ts — vaoPhongGame). */
export const MAU_MA_BAN = /^[a-z0-9-]{1,64}$/

const CAC_TRO_CHOI_DON: readonly GameType[] = ['solo_memory', 'solo_snake']

export const laTroChoiDon = (gameType: GameType): boolean => CAC_TRO_CHOI_DON.includes(gameType)

/** Nhận diện loại game từ mã bàn (hỗ trợ cả mã tiếng Việt mới và mã cũ) */
export function doanGameTypeTuMaBan(maBan: string): GameType | undefined {
  if (maBan.startsWith('co-vua') || maBan.startsWith('chess') || maBan.startsWith('giai-dau-co-vua')) return 'chess'
  if (maBan.startsWith('co-tuong') || maBan.startsWith('xiangqi')) return 'xiangqi'
  if (maBan.startsWith('co-caro') || maBan.startsWith('caro')) return 'caro_15'
  if (maBan.startsWith('tri-nho') || maBan.startsWith('solo_memory') || maBan.startsWith('solo-memory')) return 'solo_memory'
  if (maBan.startsWith('ran-san-moi') || maBan.startsWith('solo_snake') || maBan.startsWith('solo-snake')) return 'solo_snake'
  return undefined
}

/**
 * Tạo mã bàn mới cho sảnh Game dùng 100% tiếng Việt không dấu (ví dụ: co-tuong-..., co-vua-...).
 * Tuyệt đối không dùng tiếng Trung (xiangqi) hay từ viết tắt khó hiểu.
 */
export function taoMaBan(gameType: GameType, now: number = Date.now(), random: number = Math.random()): string {
  const duoi = random.toString(36).slice(2, 6) || '0'
  const slug = SLUG_TIENG_VIET_GAME[gameType] || gameType.replace(/_/g, '-')
  return `${slug}-${now.toString(36)}-${duoi}`
}

/**
 * Người vừa tạo bàn từ sảnh có nên gửi `game.init` không: chỉ khi bàn còn nguyên (đang chờ, chưa ai ngồi).
 * `game.init` xếp người gửi vào ghế X, áp thời gian mỗi lượt đã chọn và đăng bàn lên sảnh — nên phải gửi
 * cả khi loại trò trùng mặc định (`caro_15`), nếu không chủ bàn Caro 15×15 không có ghế và bàn không hiện ở sảnh.
 */
export function nenKhoiTaoBan(meta: Pick<GameMetaState, 'status' | 'playerX' | 'playerO'>, intendedGameType?: GameType): boolean {
  return Boolean(intendedGameType) && meta.status === 'waiting' && !meta.playerX && !meta.playerO
}

/**
 * Người vào một bàn có sẵn có nên tự ngồi ghế không: chỉ khi đã đăng nhập, bàn đang chờ đối thủ và mình chưa có ghế.
 * Bàn chờ không có gì để xem, nên vào từ "Chơi ngay"/"Vào đấu" hay link mời đều là để chơi.
 */
export function nenTuVaoBan(meta: Pick<GameMetaState, 'status' | 'playerX' | 'playerO'> & { isPve?: boolean }, myActorKey?: string): boolean {
  if (meta.isPve) return false
  if (!myActorKey || meta.status !== 'waiting') return false
  if (meta.playerX === myActorKey || meta.playerO === myActorKey) return false
  return !meta.playerX || !meta.playerO
}
