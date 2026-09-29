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

/**
 * Người vào một bàn có sẵn có nên tự ngồi ghế không: chỉ khi đã đăng nhập, bàn đang chờ đối thủ và mình chưa có ghế.
 * Bàn chờ không có gì để xem, nên vào từ "Chơi ngay"/"Vào đấu" hay link mời đều là để chơi.
 */
export function nenTuVaoBan(meta: Pick<GameMetaState, 'status' | 'playerX' | 'playerO'>, myActorKey?: string): boolean {
  if (!myActorKey || meta.status !== 'waiting') return false
  return meta.playerX !== myActorKey && meta.playerO !== myActorKey
}

/**
 * "Vào phòng" ở sảnh trò chơi: nhận mã bàn hoặc link bàn (`…/game/<mã>`) cùng tên miền.
 * Không nhận link trang khác, không nhận mã sai định dạng máy chủ (MAU_MA_BAN).
 */
export function phanTichMaBan(
  input: string,
  goc: string = typeof window !== 'undefined' ? window.location.origin : '',
): { ok: true; maBan: string } | { ok: false; loi: string } {
  const tho = input.trim()
  if (!tho) return { ok: false, loi: 'Nhập mã bàn hoặc link bàn.' }
  let ma = tho
  if (/^https?:\/\//i.test(tho)) {
    let url: URL
    try {
      url = new URL(tho)
    } catch {
      return { ok: false, loi: 'Link không hợp lệ.' }
    }
    if (!goc || url.origin.toLowerCase() !== goc.toLowerCase()) {
      return { ok: false, loi: 'Chỉ nhận link bàn của trang này.' }
    }
    const khop = url.pathname.match(/^\/game\/([^/]+)\/?$/)
    if (!khop) return { ok: false, loi: 'Link này không phải link bàn.' }
    ma = decodeURIComponent(khop[1])
  }
  ma = ma.toLowerCase()
  if (!MAU_MA_BAN.test(ma)) return { ok: false, loi: 'Mã bàn không đúng.' }
  return { ok: true, maBan: ma }
}
