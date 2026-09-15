import { z } from 'zod'

export interface MediaState {
  videoId: string
  title: string
  status: 'playing' | 'paused'
  /** Vị trí phát tính bằng giây */
  time: number
  /** Thời điểm cập nhật trạng thái theo giờ máy chủ (ms) */
  updatedAt: number
  playbackRate: number
  hostOnlyControl: boolean
}

export interface PomodoroState {
  running: boolean
  mode: 'focus' | 'break'
  /** Thời lượng tính bằng giây (vd: 1500 cho 25 phút) */
  duration: number
  /** Thời điểm kết thúc theo giờ máy chủ (ms), = 0 nếu đang dừng */
  endsAt: number
  /** Số giây còn lại khi tạm dừng */
  remaining: number
  round: number
}

export interface WhiteboardStroke {
  id: string
  points: [number, number][]
  color: string
  size: number
}

export interface SharedNotes {
  content: string
  lastEditedBy: string
  updatedAt: number
}

export interface QueueItem {
  id: string
  videoId: string
  title: string
  addedBy: string
  addedAt: number
}

export interface RoomChatMessage {
  id: string
  accountId: number
  ten: string
  text: string
  taoLuc: number
}

export interface ThanhVienPhong {
  key: string
  ten: string
  soKetNoi: number
  mic?: boolean
  isHost?: boolean
}

export const LenhPhongMedia = z.discriminatedUnion('action', [
  z.object({ action: z.literal('play'), time: z.number().nonnegative() }),
  z.object({ action: z.literal('pause'), time: z.number().nonnegative() }),
  z.object({ action: z.literal('seek'), time: z.number().nonnegative() }),
  z.object({ action: z.literal('rate'), rate: z.number().positive().max(3) }),
  z.object({ action: z.literal('load'), videoId: z.string().min(1).max(64), title: z.string().max(200).optional() }),
  z.object({ action: z.literal('set_host_only'), enabled: z.boolean() }),
])
export type LenhPhongMedia = z.infer<typeof LenhPhongMedia>

export const LenhPhongPomodoro = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start') }),
  z.object({ action: z.literal('pause') }),
  z.object({ action: z.literal('reset'), duration: z.number().int().positive().optional() }),
  z.object({ action: z.literal('switch_mode'), mode: z.enum(['focus', 'break']) }),
])
export type LenhPhongPomodoro = z.infer<typeof LenhPhongPomodoro>

export const LenhPhongWhiteboard = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('stroke.add'),
    stroke: z.object({
      id: z.string().min(1).max(64),
      points: z.array(z.tuple([z.number(), z.number()])).max(2000),
      color: z.string().max(30),
      size: z.number().positive().max(100),
    }),
  }),
  z.object({ action: z.literal('stroke.clear') }),
])
export type LenhPhongWhiteboard = z.infer<typeof LenhPhongWhiteboard>

export const LenhPhongNotes = z.object({
  action: z.literal('update'),
  content: z.string().max(20000),
})
export type LenhPhongNotes = z.infer<typeof LenhPhongNotes>

export const LenhPhongQueue = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), videoId: z.string().min(1).max(64), title: z.string().max(200) }),
  z.object({ action: z.literal('remove'), id: z.string().min(1).max(64) }),
  z.object({ action: z.literal('play'), id: z.string().min(1).max(64) }),
])
export type LenhPhongQueue = z.infer<typeof LenhPhongQueue>

export interface SlideState {
  docUrl: string
  docName: string
  fileType: 'pptx' | 'pdf' | 'image'
  currentPage: number
  totalPages: number
}

export const LenhPhongSlide = z.discriminatedUnion('action', [
  z.object({ action: z.literal('change_page'), page: z.number().int().positive() }),
  z.object({
    action: z.literal('load_doc'),
    docUrl: z.string().min(1),
    docName: z.string().max(200),
    fileType: z.enum(['pptx', 'pdf', 'image']),
    totalPages: z.number().int().positive().default(1),
  }),
  z.object({ action: z.literal('close_doc') }),
])
export type LenhPhongSlide = z.infer<typeof LenhPhongSlide>

export const LenhPhong = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), t: z.number() }),
  z.object({ type: z.literal('media.action'), data: LenhPhongMedia }),
  z.object({ type: z.literal('pomodoro.action'), data: LenhPhongPomodoro }),
  z.object({ type: z.literal('whiteboard.action'), data: LenhPhongWhiteboard }),
  z.object({ type: z.literal('notes.action'), data: LenhPhongNotes }),
  z.object({ type: z.literal('queue.action'), data: LenhPhongQueue }),
  z.object({ type: z.literal('slide.action'), data: LenhPhongSlide }),
  z.object({ type: z.literal('chat.send'), reqId: z.string().max(50).optional(), text: z.string().max(1000) }),
  z.object({ type: z.literal('voice.mic'), mic: z.boolean() }),
])
export type LenhPhong = z.infer<typeof LenhPhong>

export type GoiPhong =
  | {
      type: 'room.snapshot'
      roomId: string
      hostKey: string
      members: ThanhVienPhong[]
      media: MediaState
      pomodoro: PomodoroState
      notes: SharedNotes
      strokes: WhiteboardStroke[]
      queue: QueueItem[]
      chat: RoomChatMessage[]
      slide: SlideState | null
      serverNow: number
    }
  | { type: 'presence'; members: ThanhVienPhong[] }
  | { type: 'media.sync'; state: MediaState; serverNow: number }
  | { type: 'pomodoro.sync'; state: PomodoroState; serverNow: number }
  | {
      type: 'whiteboard.sync'
      action: 'stroke.add' | 'stroke.clear'
      stroke?: WhiteboardStroke
    }
  | { type: 'notes.sync'; notes: SharedNotes }
  | { type: 'queue.sync'; queue: QueueItem[] }
  | { type: 'slide.sync'; slide: SlideState | null }
  | { type: 'room.chat'; message: RoomChatMessage }
  | { type: 'pong'; t: number; serverNow: number }
  | { type: 'ack'; reqId?: string }
  | { type: 'error'; reqId?: string; message: string }
