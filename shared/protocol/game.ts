import { z } from 'zod'
import type { RoomChatMessage, ThanhVienPhong } from './room'

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

/** Cờ vua / cờ tướng: bàn chơi là chuỗi nước đi (máy chủ làm trọng tài bằng engine của từng trò). */
export type GameTypeCoNuoc = 'chess' | 'xiangqi'
export const laCoNuoc = (gameType: GameType): gameType is GameTypeCoNuoc => gameType === 'chess' || gameType === 'xiangqi'

/** Một nước cờ vua / cờ tướng: chỉ số ô đi, ô đến theo engine của trò đó; `promo` là loại quân phong cấp (cờ vua). */
export interface NuocCo {
  from: number
  to: number
  promo?: number
}

/**
 * Màu quân của một ghế ở cờ vua / cờ tướng: bên đi trước của ván (`firstTurn`) cầm quân Trắng / Đỏ (0), bên kia
 * cầm Đen (1). `firstTurn` đổi sau mỗi lần đấu lại nên hai người luân phiên cầm quân đi trước.
 */
export const mauQuanCua = (firstTurn: PlayerSide, side: PlayerSide): 0 | 1 => (side === firstTurn ? 0 : 1)

/** Biểu cảm được gửi trong bàn đấu. Máy chủ chỉ phát lại đúng các giá trị này (không phải kênh chat tự do). */
export const CAC_BIEU_CAM = [
  '🔥',
  '👏',
  '😱',
  '🤔',
  '😎',
  'GG',
  'Nước hay!',
  'Nhanh lên bạn ơi!',
  '😂',
  '🤯',
  '💀',
  '💪',
  '☕',
  '🤫',
  '⚔️',
] as const
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
    /** Caro: toạ độ ô đặt quân. */
    x: z.number().int().nonnegative().optional().default(0),
    y: z.number().int().nonnegative().optional().default(0),
    /** Cờ vua / cờ tướng: ô đi, ô đến (và quân phong cấp của cờ vua). */
    from: z.number().int().nonnegative().max(89).optional(),
    to: z.number().int().nonnegative().max(89).optional(),
    promo: z.number().int().min(2).max(5).optional(),
  }),
  z.object({ type: z.literal('game.surrender') }),
  z.object({ type: z.literal('game.rematch') }),
  z.object({ type: z.literal('game.emote'), emote: z.enum(CAC_BIEU_CAM) }),
  z.object({
    type: z.literal('game.set_timer'),
    turnSeconds: z.number().int().min(10).max(180),
  }),
])
export type LenhGame = z.infer<typeof LenhGame>
/** Lệnh máy khách gửi đi (trước khi zod điền giá trị mặc định). */
export type LenhGameGui = z.input<typeof LenhGame>

/** Nước vừa đi: Caro dùng toạ độ x/y, cờ vua / cờ tướng dùng ô đi / ô đến. */
export interface NuocVuaDi {
  player: PlayerSide
  x?: number
  y?: number
  from?: number
  to?: number
}

export type GoiGame =
  | {
      type: 'game.snapshot'
      meta: GameMetaState
      board: BoardCell[][]
      /** Cờ vua / cờ tướng: toàn bộ nước đã đi của ván hiện tại (rỗng với Caro). */
      moves: NuocCo[]
      spectators: number
      /** Tin nhắn gần nhất của bàn (chat phòng game). */
      chat: RoomChatMessage[]
      serverNow: number
    }
  | {
      type: 'game.sync'
      meta: GameMetaState
      board: BoardCell[][]
      moves: NuocCo[]
      lastMove?: NuocVuaDi
      serverNow: number
    }
  | {
      type: 'game.emote'
      sender: string
      /** Khoá người gửi — để máy khách phân biệt biểu cảm của chính mình với của người khác. */
      senderKey: string
      emote: BieuCam
    }
  /** Tin nhắn chat phòng game (lệnh `chat.send` gửi qua cùng kết nối bàn). */
  | { type: 'room.chat'; message: RoomChatMessage }
  | { type: 'ack'; reqId: string }
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
