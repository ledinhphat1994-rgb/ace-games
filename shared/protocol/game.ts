import { z } from 'zod'
import type { ThanhVienPhong } from './room'

export type GameType =
  | 'caro_15'
  | 'chess'
  | 'xiangqi'
  | 'solo_memory'
  | 'solo_snake'

export type PlayerSide = 'X' | 'O'
export type GameStatus = 'waiting' | 'playing' | 'ended'
export type BoardCell = PlayerSide | null

/** Vì sao ván kết thúc: xếp đủ hàng / kín bàn (`normal`), một bên đầu hàng, hoặc bên tới lượt hết giờ. */
export type LyDoKetThucVan = 'normal' | 'surrender' | 'timeout'

export interface GameMetaState {
  gameType: GameType
  playerX: string | null
  playerXName: string | null
  playerO: string | null
  playerOName: string | null
  currentTurn: PlayerSide
  status: GameStatus
  winner: PlayerSide | 'draw' | null
  winLine: [number, number][] | null
  turnTimerSeconds: number
  /** Hạn chót của lượt hiện tại theo đồng hồ máy chủ — máy chủ xử thua bên tới lượt khi quá hạn. */
  turnTimerEndsAt: number
  /** Số ván thắng của mỗi bên tại bàn hoặc điểm số. */
  scoreX: number
  scoreO: number
  /** Chỉ có khi ván đã kết thúc. */
  endReason: LyDoKetThucVan | null
  /** Người chơi đã bấm "Đấu lại" và đang chờ người kia đồng ý; ván mới chỉ bắt đầu khi cả hai cùng muốn. */
  rematchBy: PlayerSide | null
  /** Bên đi trước của ván hiện tại — đổi luân phiên sau mỗi lần đấu lại cho công bằng. */
  firstTurn: PlayerSide
}

/** Trò chơi đối kháng 1v1 có bàn chơi thời gian thực và hiện trên sảnh. */
export const CAC_GAME_1V1 = ['caro_15', 'chess', 'xiangqi'] as const satisfies readonly GameType[]
export type GameType1v1 = (typeof CAC_GAME_1V1)[number]

/** Biểu cảm được gửi trong bàn đấu. Máy chủ chỉ phát lại đúng các giá trị này (không phải kênh chat tự do). */
export const CAC_BIEU_CAM = ['🔥', '👏', '😱', '🤔', '😎', 'GG', 'Nước hay!', 'Nhanh lên bạn ơi!'] as const
export type BieuCam = (typeof CAC_BIEU_CAM)[number]

export const LenhGame = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), t: z.number() }),
  z.object({
    type: z.literal('game.init'),
    gameType: z.enum(CAC_GAME_1V1),
    turnSeconds: z.number().int().min(10).max(120).optional(),
  }),
  z.object({
    type: z.literal('game.join'),
    side: z.enum(['X', 'O']).optional(),
  }),
  z.object({
    type: z.literal('game.move'),
    x: z.number().int().nonnegative().optional().default(0),
    y: z.number().int().nonnegative().optional().default(0),
    from: z.number().int().nonnegative().optional(),
    to: z.number().int().nonnegative().optional(),
    promo: z.number().int().optional(),
  }),
  z.object({ type: z.literal('game.surrender') }),
  z.object({ type: z.literal('game.rematch') }),
  z.object({ type: z.literal('game.emote'), emote: z.enum(CAC_BIEU_CAM) }),
])
export type LenhGame = z.infer<typeof LenhGame>

export type GoiGame =
  | {
      type: 'game.snapshot'
      meta: GameMetaState
      board: any
      spectators: number
      serverNow: number
    }
  | {
      type: 'game.sync'
      meta: GameMetaState
      board: any
      lastMove?: { player: PlayerSide; x?: number; y?: number; from?: number; to?: number }
      serverNow: number
    }
  | {
      type: 'game.emote'
      sender: string
      emote: BieuCam
    }
  /** Ai đang có mặt ở bàn (người chơi lẫn người xem) — RoomDO phát lại mỗi khi có người vào/rời. */
  | { type: 'presence'; members: ThanhVienPhong[] }
  | { type: 'pong'; t: number; serverNow: number }
  | { type: 'error'; message: string }

/** Một bàn đối kháng đang mở, hiển thị trên sảnh Đấu Trường Game (Real-time Active Tables Feed). */
export interface BanSanh {
  id: string
  gameType: GameType
  tenChu: string | null
  tenKhach: string | null
  trangThai: GameStatus
  soNguoiXem: number
  turnTimerSeconds: number
  capNhatLuc: number
}
