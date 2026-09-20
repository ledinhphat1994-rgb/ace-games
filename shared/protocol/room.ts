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
  revision: number
}

export interface WhiteboardStroke {
  id: string
  points: [number, number][]
  color: string
  size: number
  epoch: number
}

export interface SharedNotes {
  content: string
  lastEditedBy: string
  updatedAt: number
  revision: number
}

export interface QueueItem {
  id: string
  videoId: string
  title: string
  addedBy: string
  addedByKey?: string
  addedAt: number
}

export interface RoomChatMessage {
  id: string
  accountId: number
  ten: string
  text: string
  taoLuc: number
}

export const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

export function canonicalMediaPosition(state: MediaState | null | undefined, serverNow: number): number {
  if (!state || typeof state.time !== 'number' || !Number.isFinite(state.time)) return 0
  const baseTime = Math.max(0, state.time)
  if (state.status !== 'playing') {
    return baseTime
  }
  const updatedAt = typeof state.updatedAt === 'number' && Number.isFinite(state.updatedAt) ? state.updatedAt : serverNow
  const elapsedSec = Math.max(0, (serverNow - updatedAt) / 1000)
  const rate = typeof state.playbackRate === 'number' && Number.isFinite(state.playbackRate) && state.playbackRate > 0 ? state.playbackRate : 1
  return Math.max(0, baseTime + elapsedSec * rate)
}

export interface ThanhVienPhong {
  key: string
  ten: string
  soKetNoi: number
  mic?: boolean
  isHost?: boolean
  canModerate?: boolean
}

export const SUPPORTED_PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const
export type SupportedPlaybackRate = (typeof SUPPORTED_PLAYBACK_RATES)[number]

export const LenhPhongMedia = z.discriminatedUnion('action', [
  z.object({ action: z.literal('play') }),
  z.object({ action: z.literal('pause') }),
  z.object({ action: z.literal('seek'), time: z.number().finite().nonnegative().max(86400) }),
  z.object({
    action: z.literal('rate'),
    rate: z.number().refine(
      (r): r is SupportedPlaybackRate => (SUPPORTED_PLAYBACK_RATES as readonly number[]).includes(r),
      'Tốc độ phát không được YouTube hỗ trợ',
    ),
  }),
  z.object({ action: z.literal('load'), videoId: z.string().regex(YOUTUBE_VIDEO_ID_REGEX, 'ID video YouTube phải đúng 11 ký tự'), title: z.string().max(200).optional() }),
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
      points: z.array(z.tuple([z.number(), z.number()])).min(1).max(200),
      color: z.string().max(30),
      size: z.number().positive().max(100),
      epoch: z.number().int().nonnegative(),
    }),
  }),
  z.object({ action: z.literal('stroke.clear') }),
])
export type LenhPhongWhiteboard = z.infer<typeof LenhPhongWhiteboard>

export const LenhPhongNotes = z.object({
  action: z.literal('update'),
  content: z.string().max(20000),
  baseRevision: z.number().int().nonnegative(),
})
export type LenhPhongNotes = z.infer<typeof LenhPhongNotes>

export const LenhPhongQueue = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), videoId: z.string().min(1).max(64), title: z.string().max(200) }),
  z.object({ action: z.literal('remove'), id: z.string().min(1).max(64) }),
  z.object({ action: z.literal('play'), id: z.string().min(1).max(64) }),
])
export type LenhPhongQueue = z.infer<typeof LenhPhongQueue>

export interface SlideState {
  docId?: number
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
    docId: z.number().int().positive().optional(),
    docUrl: z.string().min(1),
    docName: z.string().max(200),
    fileType: z.enum(['pptx', 'pdf', 'image']),
    totalPages: z.number().int().positive().default(1),
  }),
  z.object({ action: z.literal('close_doc') }),
])
export type LenhPhongSlide = z.infer<typeof LenhPhongSlide>

export interface RoomDocumentItem {
  id: number
  roomId: number
  originalName: string
  mimeType: string
  sizeBytes: number
  pageCount: number
  fileType: 'pdf' | 'pptx' | 'image'
  uploadedByAccountId: number
  uploadedByName: string
  createdAt: number
  url: string
}

export const UPLOAD_ERROR_CODES = {
  FILE_TOO_LARGE: 'UPLOAD_FILE_TOO_LARGE',
  UNSUPPORTED_TYPE: 'UPLOAD_UNSUPPORTED_TYPE',
  EMPTY_FILE: 'UPLOAD_EMPTY_FILE',
  AUTH_REQUIRED: 'UPLOAD_AUTH_REQUIRED',
  ROOM_FORBIDDEN: 'UPLOAD_ROOM_FORBIDDEN',
  ROOM_CLOSED: 'UPLOAD_ROOM_CLOSED',
  STORAGE_UNAVAILABLE: 'UPLOAD_STORAGE_UNAVAILABLE',
  STORAGE_WRITE_FAILED: 'UPLOAD_STORAGE_WRITE_FAILED',
  METADATA_FAILED: 'UPLOAD_METADATA_FAILED',
  TIMEOUT: 'UPLOAD_TIMEOUT',
} as const
export type UploadErrorCode = (typeof UPLOAD_ERROR_CODES)[keyof typeof UPLOAD_ERROR_CODES]

// ── Learning Session v1 ──────────────────────────────────────────────────────

export interface SessionGoal {
  text: string
  setBy: string
  setAt: number
  revision: number
}

export interface SessionTask {
  id: string
  text: string
  createdBy: string
  createdAt: number
  order: number
}

export interface SessionTimerState {
  running: boolean
  durationSeconds: number
  startedAt: number
  endsAt: number
  remaining: number
  revision: number
}

export interface PollOption {
  id: string
  text: string
}

export interface ActivePoll {
  id: string
  question: string
  options: PollOption[]
  createdBy: string
  createdAt: number
  closed: boolean
}

export interface SessionSummary {
  sessionId: string
  roomId: number
  goal?: string | null
  startedAt: number
  endedAt: number
  durationSeconds: number
  taskCount: number
  /** taskId → completion rate 0–100 */
  taskCompletionRates: Record<string, number>
  activeMembers: string[]
  pollResults: Array<{
    question: string
    options: Array<{ text: string; count: number }>
  }>
}

export const LenhPhongSession = z.discriminatedUnion('action', [
  // Goal
  z.object({ action: z.literal('goal.set'), text: z.string().min(1).max(500) }),
  z.object({ action: z.literal('goal.clear') }),
  // Tasks
  z.object({ action: z.literal('task.add'), text: z.string().min(1).max(300) }),
  z.object({ action: z.literal('task.remove'), taskId: z.string().min(1).max(64) }),
  z.object({ action: z.literal('task.tick'), taskId: z.string().min(1).max(64) }),
  z.object({ action: z.literal('task.untick'), taskId: z.string().min(1).max(64) }),
  // Timer
  z.object({
    action: z.literal('timer.start'),
    durationSeconds: z.number().int().min(60).max(10800),
  }),
  z.object({ action: z.literal('timer.pause') }),
  z.object({ action: z.literal('timer.reset') }),
  // Poll
  z.object({
    action: z.literal('poll.create'),
    question: z.string().min(1).max(500),
    options: z.array(z.string().min(1).max(200)).min(2).max(4),
  }),
  z.object({
    action: z.literal('poll.vote'),
    pollId: z.string().min(1).max(64),
    optionId: z.string().min(1).max(64),
  }),
  z.object({ action: z.literal('poll.close') }),
  // Session lifecycle
  z.object({ action: z.literal('session.start') }),
  z.object({ action: z.literal('session.end') }),
])
export type LenhPhongSession = z.infer<typeof LenhPhongSession>

export interface VoiceParticipantState {
  actorKey: string
  ten: string
  status: 'live' | 'muted'
  sessionId: string
  audioTrackId: string
  mid?: string
  generation: number
  updatedAt: number
}

export interface VoiceTrackMetadata {
  location: 'local' | 'remote'
  mid?: string
  trackName?: string
  sessionId?: string
  status?: string
}

export const LenhPhong = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ping'), t: z.number() }),
  z.object({ type: z.literal('media.action'), data: LenhPhongMedia }),
  z.object({ type: z.literal('pomodoro.action'), data: LenhPhongPomodoro }),
  z.object({ type: z.literal('whiteboard.action'), data: LenhPhongWhiteboard }),
  z.object({ type: z.literal('notes.action'), data: LenhPhongNotes }),
  z.object({ type: z.literal('queue.action'), data: LenhPhongQueue }),
  z.object({ type: z.literal('slide.action'), data: LenhPhongSlide }),
  z.object({ type: z.literal('chat.send'), reqId: z.string().min(1).max(50), text: z.string().max(1000) }),
  z.object({
    type: z.literal('voice.self_state'),
    generation: z.number().int().positive(),
    muted: z.boolean(),
  }),
  z.object({ type: z.literal('session.action'), data: LenhPhongSession }),
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
      whiteboardEpoch?: number
      queue: QueueItem[]
      chat: RoomChatMessage[]
      slide: SlideState | null
      voiceRegistry?: VoiceParticipantState[]
      serverNow: number
      // Learning Session v1
      sessionGoal: SessionGoal | null
      sessionTasks: SessionTask[]
      /** taskId → accountId[] who completed */
      sessionTaskCompletions: Record<string, number[]>
      sessionTimer: SessionTimerState
      activePoll: ActivePoll | null
      /** poll votes — only optionId counts visible, keyed by optionId */
      pollVoteCounts: Record<string, number> | null
      sessionStartedAt: number | null
      activeParticipantKeys: string[]
    }
  | { type: 'presence'; members: ThanhVienPhong[] }
  | { type: 'media.sync'; state: MediaState; serverNow: number }
  | { type: 'pomodoro.sync'; state: PomodoroState; serverNow: number }
  | {
      type: 'whiteboard.sync'
      action: 'stroke.add' | 'stroke.clear'
      stroke?: WhiteboardStroke
      epoch?: number
    }
  | { type: 'notes.sync'; notes: SharedNotes }
  | {
      type: 'notes.conflict'
      currentNotes: SharedNotes
      rejectedContent: string
    }
  | { type: 'queue.sync'; queue: QueueItem[] }
  | { type: 'slide.sync'; slide: SlideState | null }
  | { type: 'room.chat'; message: RoomChatMessage }
  | { type: 'voice.registry'; registry: VoiceParticipantState[] }
  | { type: 'voice.updated'; participant: VoiceParticipantState }
  | { type: 'voice.removed'; actorKey: string }
  | { type: 'voice.force_muted'; targetKey: string; by: string }
  | { type: 'room.kicked'; targetKey: string; reason?: string; by: string }
  | { type: 'pong'; t: number; serverNow: number }
  | { type: 'ack'; reqId?: string }
  | { type: 'error'; reqId?: string; message: string }
  // Learning Session v1 server→client syncs
  | { type: 'session.goal.sync'; goal: SessionGoal | null }
  | {
      type: 'session.tasks.sync'
      tasks: SessionTask[]
      completionMap: Record<string, number[]>
    }
  | { type: 'session.timer.sync'; state: SessionTimerState; serverNow: number }
  | {
      type: 'session.poll.sync'
      poll: ActivePoll | null
      /** vote counts per optionId — only sent to host when poll is open, to all when closed */
      voteCounts: Record<string, number> | null
    }
  | { type: 'session.summary'; summary: SessionSummary }
  | { type: 'session.participation'; activeKeys: string[] }
  | {
      type: 'room.closed'
      reason: string
      message: string
    }

export interface VoiceSubscribeResponse {
  tracks: VoiceTrackMetadata[]
  sessionDescription?: { type: 'offer' | 'answer'; sdp: string }
  requiresImmediateRenegotiation?: boolean
}

export interface VoiceRenegotiateResponse {
  sessionDescription?: { type: 'offer' | 'answer'; sdp: string }
}

export interface VoiceForceMuteResponse {
  success: boolean
  targetKey: string
  audioTrackId: string
  generation: number
}

// ── Moderation & Safety v1 Schemas ──────────────────────────────────────────

export const REPORT_CATEGORIES = [
  'harassment',
  'spam',
  'inappropriate_content',
  'cheating',
  'disruptive',
  'other',
] as const
export type ReportCategory = (typeof REPORT_CATEGORIES)[number]

export const ReportPayloadSchema = z.object({
  reportedAccountId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional(),
  category: z.enum(REPORT_CATEGORIES),
  reason: z.string().trim().min(1, 'Vui lòng nhập lý do báo cáo').max(1000, 'Lý do tối đa 1000 ký tự'),
  contentSnippet: z.string().max(2000).optional(),
})
export type ReportPayload = z.infer<typeof ReportPayloadSchema>

export const RoomKickPayloadSchema = z.object({
  targetActorKey: z.string().min(1).max(64),
  reason: z.string().trim().max(200).optional(),
  banFromRoom: z.boolean().optional(),
})
export type RoomKickPayload = z.infer<typeof RoomKickPayloadSchema>

export const RoomBanPayloadSchema = z.object({
  targetAccountId: z.number().int().positive(),
  reason: z.string().trim().max(200).optional(),
  expectedBanId: z.number().int().positive().optional(),
  expectedRevision: z.number().int().positive().optional(),
})
export type RoomBanPayload = z.infer<typeof RoomBanPayloadSchema>

export const RoomUnbanPayloadSchema = z.object({
  targetAccountId: z.number().int().positive('ID tài khoản phải là số nguyên dương'),
  expectedBanId: z.number().int().positive().optional(),
  expectedRevision: z.number().int().positive().optional(),
  expectedCooldownId: z.string().trim().min(1).max(64).optional(),
})
export type RoomUnbanPayload = z.infer<typeof RoomUnbanPayloadSchema>

export type AuditLogAction =
  | 'kick'
  | 'ban'
  | 'unban'
  | 'voice_mute'
  | 'report_resolved'
  | 'admin_room_close'
  | 'system_room_close'
  | 'owner_room_close'
  | 'room_policy_update'
  | 'room_lifecycle_bootstrap_failed'

export interface BannedMemberItem {
  id: number
  accountId: number
  username: string
  displayName: string
  reason: string | null
  bannedBy: number | null
  bannedByName: string | null
  createdAt: string
  authorityRank?: number
  revision?: number
}

// ── Milestone A1: Room Lifecycle & Admin Control Plane Schemas ───────────────

export interface RoomLifecyclePolicy {
  id: number
  autoCloseEnabled: boolean
  neverJoinedTtlMinutes: number
  emptyRoomTtlMinutes: number
  maxRoomLifetimeMinutes: number
  updatedAt: number
  updatedBy?: number | null
  revision: number
}

export const UpdateRoomPolicyPayloadSchema = z.object({
  autoCloseEnabled: z.boolean(),
  neverJoinedTtlMinutes: z.number().int().min(1, 'Tối thiểu 1 phút').max(120, 'Tối đa 120 phút'),
  emptyRoomTtlMinutes: z.number().int().min(1, 'Tối thiểu 1 phút').max(1440, 'Tối đa 1440 phút (24 giờ)'),
  maxRoomLifetimeMinutes: z.number().int().min(15, 'Tối thiểu 15 phút').max(10080, 'Tối đa 10080 phút (7 ngày)'),
  expectedRevision: z.number().int().positive().optional(),
})
export type UpdateRoomPolicyPayload = z.infer<typeof UpdateRoomPolicyPayloadSchema>

export const CloseRoomPayloadSchema = z.object({
  reason: z.string().trim().max(500, 'Lý do tối đa 500 ký tự').optional(),
  note: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})
export type CloseRoomPayload = z.infer<typeof CloseRoomPayloadSchema>

export const CreateStudyRoomPayloadSchema = z.object({
  ten: z.string().trim().min(1, 'Vui lòng nhập tên phòng').max(100, 'Tên phòng tối đa 100 ký tự'),
  moTa: z.string().trim().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  phamVi: z.enum(['truong', 'lop']),
  lopId: z.number().int().positive().nullable().optional(),
  accessMode: z.enum(['public', 'password']).default('public'),
  password: z.string().min(4, 'Mật khẩu tối thiểu 4 ký tự').max(50, 'Mật khẩu tối đa 50 ký tự').optional(),
  sucChua: z.number().int().min(2, 'Tối thiểu 2 người').max(100, 'Tối đa 100 người').default(20),
})
export type CreateStudyRoomPayload = z.infer<typeof CreateStudyRoomPayloadSchema>

export interface AdminRoomItem {
  id: number
  name: string
  description: string | null
  ownerAccountId: number
  ownerKey: string
  ownerDisplayName: string
  scope: 'truong' | 'lop'
  classId: number | null
  accessMode: 'public' | 'password'
  capacity: number
  lifecycleStatus: 'open' | 'closing' | 'closed'
  rawStatus: string
  createdAt: number
  lastActivityAt: number | null
  lastJoinAt: number | null
  lastParticipantLeftAt: number | null
  everJoined: boolean
  closingAt: number | null
  closedAt: number | null
  closedBy: number | null
  closeReason: string | null
  lifecycleRevision: number
  roomAgeMinutes: number
  autoCloseDeadline: number | null
  liveParticipantCount?: number
  effectivePolicyRevision?: number
  effectiveNeverJoinedTtl?: number
  effectiveEmptyRoomTtl?: number
  effectiveMaxLifetime?: number
  effectiveAutoCloseEnabled?: boolean
}
