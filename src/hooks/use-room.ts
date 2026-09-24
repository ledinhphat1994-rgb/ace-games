import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type GoiPhong,
  type LenhPhongMedia,
  type LenhPhongPomodoro,
  type MediaState,
  type PomodoroState,
  type QueueItem,
  type RoomChatMessage,
  type SharedNotes,
  type ThanhVienPhong,
  type WhiteboardStroke,
  type SlideState,
  type VoiceParticipantState,
  type BannedMemberItem,
  canonicalMediaPosition,
  type SessionGoal,
  type SessionTask,
  type SessionTimerState,
  type ActivePoll,
  type SessionSummary,
  type LenhPhongSession,
} from '@shared/protocol/room'
import { lamSachVanBan, MA_DONG_SOCKET } from '@shared/protocol/common'
import { ClockSyncManager } from '@/features/study/clock-sync'
import { VoiceClient, type VoiceClientState } from '@/lib/voice-client'
import { toast } from 'sonner'

export type TrangThaiKetNoiPhong =
  | 'dang_ket_noi'
  | 'da_ket_noi'
  | 'mat_ket_noi'
  | 'phien_bi_thay'
  | 'can_xac_thuc_lai'
  | 'bi_tu_choi'

const BACKOFF_KHOI_DAU_MS = 1000
const BACKOFF_TOI_DA_MS = 10000

const DEFAULT_SESSION_TIMER: SessionTimerState = {
  running: false,
  durationSeconds: 1800,
  startedAt: 0,
  endsAt: 0,
  remaining: 1800,
  revision: 1,
}

export const DEFAULT_MEDIA: MediaState = {
  videoId: '',
  title: '',
  status: 'paused',
  time: 0,
  updatedAt: 0,
  playbackRate: 1,
  hostOnlyControl: true,
}

const DEFAULT_POMODORO: PomodoroState = {
  running: false,
  mode: 'focus',
  duration: 1500,
  endsAt: 0,
  remaining: 1500,
  round: 1,
  revision: 1,
}

export const DEFAULT_NOTES: SharedNotes = {
  content: '',
  lastEditedBy: '',
  updatedAt: 0,
  revision: 1,
}

export function useRoom(roomId: string, myActorKey?: string) {
  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiPhong>('dang_ket_noi')
  const [members, setMembers] = useState<ThanhVienPhong[]>([])
  const [hostKey, setHostKey] = useState<string | null>(null)
  // Learning Session v1
  const [sessionGoal, setSessionGoal] = useState<SessionGoal | null>(null)
  const [sessionTasks, setSessionTasks] = useState<SessionTask[]>([])
  const [sessionTaskCompletions, setSessionTaskCompletions] = useState<Record<string, number[]>>({})
  const [sessionTimer, setSessionTimer] = useState<SessionTimerState>(DEFAULT_SESSION_TIMER)
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null)
  const [pollVoteCounts, setPollVoteCounts] = useState<Record<string, number> | null>(null)
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null)
  const [activeParticipantKeys, setActiveParticipantKeys] = useState<string[]>([])
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)
  const [mediaState, setMediaState] = useState<MediaState>(DEFAULT_MEDIA)
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(DEFAULT_POMODORO)
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([])
  const [whiteboardEpoch, setWhiteboardEpoch] = useState<number>(1)
  const [sharedNotes, setSharedNotes] = useState<SharedNotes>(DEFAULT_NOTES)
  const [notesConflict, setNotesConflict] = useState<{ currentNotes: SharedNotes; rejectedContent: string } | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([])
  const [slideState, setSlideState] = useState<SlideState | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [serverClockOffset, setServerClockOffset] = useState<number>(0)
  const [voiceRegistry, setVoiceRegistry] = useState<VoiceParticipantState[]>([])
  const [voiceState, setVoiceState] = useState<VoiceClientState>({
    isSupported: true,
    connectionState: 'idle',
    isConnecting: false,
    isPublishing: false,
    isMuted: false,
    hasError: false,
    errorMessage: null,
    blockedReason: null,
    activeSpeakers: [],
    speakingActors: [],
    isAudioAutoplayBlocked: false,
  })
  const myMic = Boolean(voiceState.isPublishing && !voiceState.isMuted)
  const [thongBaoLoiPhong, setThongBaoLoiPhong] = useState<string | null>(null)
  // A1: Room closed by admin/system — disables reconnect, shows modal
  const [roomClosedInfo, setRoomClosedInfo] = useState<{ reason: string; message: string } | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const voiceClientRef = useRef<VoiceClient | null>(null)
  const clockSyncRef = useRef<ClockSyncManager>(new ClockSyncManager())
  const serverClockOffsetRef = useRef<number>(0)
  const whiteboardEpochRef = useRef<number>(1)
  const sharedNotesRef = useRef<SharedNotes>(DEFAULT_NOTES)
  const membersRef = useRef<ThanhVienPhong[]>([])
  const soLanThuRef = useRef<number>(0)
  const henGioKetNoiLaiRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const daHuyRef = useRef<boolean>(false)
  const ketNoiRef = useRef<() => void>(() => {})

  const me = useMemo(() => {
    if (!myActorKey) return null
    return members.find((m) => m.key === myActorKey) || null
  }, [members, myActorKey])

  const isHost = useMemo(() => {
    if (!myActorKey || !hostKey) return false
    return myActorKey === hostKey
  }, [myActorKey, hostKey])

  const canModerate = useMemo(() => {
    return Boolean(me?.canModerate)
  }, [me])

  const canControlMedia = useMemo(() => {
    if (!mediaState.hostOnlyControl) return true
    return isHost || canModerate
  }, [mediaState.hostOnlyControl, isHost, canModerate])

  const ketNoi = useCallback(() => {
    if (daHuyRef.current || !roomId) return
    if (henGioKetNoiLaiRef.current) {
      clearTimeout(henGioKetNoiLaiRef.current)
      henGioKetNoiLaiRef.current = null
    }

    setTrangThai('dang_ket_noi')
    const giaoThuc = typeof location !== 'undefined' && location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = typeof location !== 'undefined' ? location.host : 'localhost'
    const canonicalMaPhong = roomId.startsWith('phong-') ? roomId : `phong-${roomId}`
    const ws = new WebSocket(`${giaoThuc}//${host}/ws/room/${encodeURIComponent(canonicalMaPhong)}`)
    wsRef.current = ws
    // Expose WebSocket and shared notes ref for E2E tests ONLY — never in normal production
    if (typeof window !== 'undefined' && (window as unknown as { __E2E_MODE__?: boolean }).__E2E_MODE__ === true) {
      ;(window as unknown as { __roomWs?: WebSocket }).__roomWs = ws
      ;(window as unknown as { __roomNotesRef?: typeof sharedNotesRef }).__roomNotesRef = sharedNotesRef
    }

    ws.onopen = () => {
      if (wsRef.current !== ws) return
      setTrangThai('da_ket_noi')
      soLanThuRef.current = 0
    }

    ws.onmessage = (e) => {
      if (wsRef.current !== ws) return
      let goi: GoiPhong
      try {
        const raw = JSON.parse(String(e.data)) as unknown
        if (!raw || typeof raw !== 'object' || !('type' in raw)) return
        goi = raw as GoiPhong
      } catch {
        return
      }

      switch (goi.type) {
        case 'room.snapshot':
          setHostKey(goi.hostKey)
          membersRef.current = goi.members
          setMembers(goi.members)
          setMediaState(goi.media)
          setPomodoroState(goi.pomodoro)
          sharedNotesRef.current = goi.notes
          setSharedNotes(goi.notes)
          setWhiteboardStrokes(goi.strokes)
          if (typeof goi.whiteboardEpoch === 'number') {
            setWhiteboardEpoch(goi.whiteboardEpoch)
            whiteboardEpochRef.current = goi.whiteboardEpoch
          }
          setQueue(goi.queue)
          setChatMessages(goi.chat)
          setSlideState(goi.slide ?? null)
          // Learning Session v1 snapshot
          setSessionGoal(goi.sessionGoal ?? null)
          setSessionTasks(goi.sessionTasks ?? [])
          setSessionTaskCompletions(goi.sessionTaskCompletions ?? {})
          setSessionTimer(goi.sessionTimer ?? DEFAULT_SESSION_TIMER)
          setActivePoll(goi.activePoll ?? null)
          setPollVoteCounts(goi.pollVoteCounts ?? null)
          setSessionStartedAt(goi.sessionStartedAt ?? null)
          setActiveParticipantKeys(goi.activeParticipantKeys ?? [])

          if (Array.isArray(goi.voiceRegistry)) {
            setVoiceRegistry(goi.voiceRegistry)
            voiceClientRef.current?.syncRegistry(goi.voiceRegistry)
          }
          if (clockSyncRef.current.getSamples().length === 0 && typeof goi.serverNow === 'number') {
            clockSyncRef.current = new ClockSyncManager([goi.serverNow - Date.now()])
            const initialOffset = clockSyncRef.current.getMedianOffset()
            serverClockOffsetRef.current = initialOffset
            setServerClockOffset(initialOffset)
          }
          break

        case 'session.goal.sync':
          setSessionGoal(goi.goal)
          break

        case 'session.tasks.sync':
          setSessionTasks(goi.tasks)
          setSessionTaskCompletions(goi.completionMap)
          break

        case 'session.timer.sync':
          setSessionTimer(goi.state)
          break

        case 'session.poll.sync':
          setActivePoll(goi.poll)
          setPollVoteCounts(goi.voteCounts)
          break

        case 'session.summary':
          setSessionSummary(goi.summary)
          break

        case 'session.participation':
          setActiveParticipantKeys(goi.activeKeys)
          break

        case 'presence':
          membersRef.current = goi.members
          setMembers(goi.members)
          break

        case 'media.sync':
          setMediaState(goi.state)
          break

        case 'pomodoro.sync':
          setPomodoroState(goi.state)
          break

        case 'whiteboard.sync':
          if (goi.action === 'stroke.add' && goi.stroke) {
            const st = goi.stroke
            if (typeof st.epoch === 'number' && st.epoch < whiteboardEpochRef.current) return
            setWhiteboardStrokes((prev) => {
              if (prev.some((s) => s.id === st.id)) return prev
              return [...prev, st].slice(-1000)
            })
          } else if (goi.action === 'stroke.clear') {
            if (typeof goi.epoch === 'number') {
              setWhiteboardEpoch(goi.epoch)
              whiteboardEpochRef.current = goi.epoch
            }
            setWhiteboardStrokes([])
          }
          break

        case 'notes.sync':
          sharedNotesRef.current = goi.notes
          setSharedNotes(goi.notes)
          setNotesConflict((prev) => {
            if (!prev) return null
            // If the incoming update was from THIS user successfully saving their content:
            if (goi.notes.content === prev.rejectedContent) {
              return null
            }
            // Otherwise, an unrelated update arrived: preserve rejectedContent!
            return {
              currentNotes: goi.notes,
              rejectedContent: prev.rejectedContent,
            }
          })
          break

        case 'notes.conflict':
          sharedNotesRef.current = goi.currentNotes
          setNotesConflict({
            currentNotes: goi.currentNotes,
            rejectedContent: goi.rejectedContent,
          })
          break

        case 'queue.sync':
          setQueue(goi.queue)
          break

        case 'slide.sync':
          setSlideState(goi.slide ?? null)
          break

        case 'voice.updated': {
          const p = goi.participant
          setVoiceRegistry((prev) => {
            const next = prev.filter((item) => item.actorKey !== p.actorKey)
            if (p.status === 'live') {
              next.push(p)
            }
            voiceClientRef.current?.syncRegistry(next)
            return next
          })
          setMembers((prev) =>
            prev.map((m) => (m.key === p.actorKey ? { ...m, mic: p.status === 'live' } : m))
          )
          break
        }

        case 'voice.removed': {
          setVoiceRegistry((prev) => {
            const next = prev.filter((item) => item.actorKey !== goi.actorKey)
            voiceClientRef.current?.syncRegistry(next)
            return next
          })
          setMembers((prev) =>
            prev.map((m) => (m.key === goi.actorKey ? { ...m, mic: false } : m))
          )
          break
        }

        case 'voice.force_muted': {
          if (goi.targetKey === myActorKey) {
            voiceClientRef.current?.handleForceMuted()
          }
          setMembers((prev) =>
            prev.map((m) => (m.key === goi.targetKey ? { ...m, mic: false } : m))
          )
          break
        }

        case 'room.chat': {
          const msg = goi.message
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg].slice(-100)
          })
          break
        }

        case 'room.kicked': {
          if (goi.targetKey === myActorKey) {
            const reasonText = goi.reason ? `: ${goi.reason}` : ''
            toast.error(`Bạn đã bị mời ra khỏi phòng${reasonText}`)
            setThongBaoLoiPhong(`Bạn đã bị mời ra khỏi phòng${reasonText}`)
            setTrangThai('bi_tu_choi')
          } else {
            const targetName = membersRef.current.find((m) => m.key === goi.targetKey)?.ten || 'Một thành viên'
            toast.info(`${targetName} đã bị mời ra khỏi phòng.`)
            setMembers((prev) => prev.filter((m) => m.key !== goi.targetKey))
          }
          break
        }

        case 'room.closed': {
          // Server-authoritative room close (admin / system timeout / owner)
          // Stop reconnect loop immediately — this is permanent, not a network glitch
          daHuyRef.current = true
          if (henGioKetNoiLaiRef.current) {
            clearTimeout(henGioKetNoiLaiRef.current)
            henGioKetNoiLaiRef.current = null
          }
          // Teardown voice/media tracks
          voiceClientRef.current?.destroy()
          voiceClientRef.current = null
          // Surface info to UI
          setRoomClosedInfo({ reason: goi.reason, message: goi.message })
          setTrangThai('bi_tu_choi')
          toast.info(goi.message || 'Phòng học đã bị đóng.')
          break
        }

        case 'pong': {
          const res = clockSyncRef.current.processPong(goi.t, goi.serverNow)
          if (res.accepted) {
            serverClockOffsetRef.current = res.medianOffset
            setServerClockOffset(res.medianOffset)
            if (typeof res.rtt === 'number') {
              setLatencyMs(Math.round(res.rtt))
            }
          }
          break
        }
      }
    }

    ws.onclose = async (e) => {
      if (wsRef.current !== ws) return
      wsRef.current = null
      clockSyncRef.current.reset()

      if (e.code === MA_DONG_SOCKET.PHIEN_BI_THAY || e.reason === 'da_dang_nhap_noi_khac') {
        setTrangThai('phien_bi_thay')
        return
      }

      if (e.code === MA_DONG_SOCKET.BI_CHAN || e.reason === 'bi_kick' || e.reason === 'bi_cam') {
        setThongBaoLoiPhong('Bạn đã bị mời ra khỏi phòng học này.')
        setTrangThai('bi_tu_choi')
        return
      }

      if (daHuyRef.current) return

      // Immediately signal transient connection loss so UI displays reconnect banner with zero latency
      setTrangThai('mat_ket_noi')

      // Classify disconnection reason against canonical admission status endpoint
      const idMatch = roomId.match(/(\d+)$/)
      if (idMatch) {
        try {
          const res = await fetch(`/api/rooms/${idMatch[1]}/admission-status`)
          if (res.status === 401) {
            // Campus session is invalid
            setTrangThai('phien_bi_thay')
            return
          }
          if (res.status === 403 || res.status === 404) {
            // Permanent room access denial: banned, wrong class, room closed/deleted, or invalid access mode
            const errData = (await res.json().catch(() => ({}))) as { error?: string }
            setThongBaoLoiPhong(errData.error || 'Bạn không có quyền truy cập vào phòng học này.')
            setTrangThai('bi_tu_choi')
            return
          }
          if (res.ok) {
            const statusData = (await res.json().catch(() => ({}))) as {
              accessMode?: string
              admitted?: boolean
              reason?: string
            }
            if (statusData.accessMode === 'password' && statusData.admitted === false) {
              // Password admission token expired or missing -> show re-admission UX, stop reconnect loop
              setTrangThai('can_xac_thuc_lai')
              return
            }
          }
          // Note: 5xx errors are treated as temporary server issues -> retry with backoff below
        } catch {
          // Network fetch error -> treat as temporary network failure -> retry with backoff below
        }
      }

      setTrangThai('mat_ket_noi')

      const soLan = soLanThuRef.current
      const delay = Math.min(
        BACKOFF_KHOI_DAU_MS * Math.pow(2, soLan) + Math.random() * 500,
        BACKOFF_TOI_DA_MS,
      )
      soLanThuRef.current = soLan + 1

      henGioKetNoiLaiRef.current = setTimeout(() => {
        if (!daHuyRef.current) ketNoiRef.current()
      }, delay)
    }

    ws.onerror = () => {}
  }, [roomId, myActorKey])

  useEffect(() => {
    const idMatch = roomId.match(/(\d+)$/)
    const numericRoomId = idMatch ? parseInt(idMatch[1], 10) : 0
    if (!numericRoomId || !myActorKey) return

    const client = new VoiceClient({
      roomId: numericRoomId,
      currentActorKey: myActorKey,
      onStateChange: (state) => {
        setVoiceState(state)
      },
      onError: (err) => {
        toast.error(err.message || 'Không thể bật micro.')
      },
    })
    voiceClientRef.current = client

    return () => {
      client.destroy()
      voiceClientRef.current = null
    }
  }, [roomId, myActorKey])

  useEffect(() => {
    ketNoiRef.current = ketNoi
  }, [ketNoi])

  useEffect(() => {
    membersRef.current = members
  }, [members])

  useEffect(() => {
    daHuyRef.current = false
    ketNoi()

    return () => {
      daHuyRef.current = true
      if (henGioKetNoiLaiRef.current) {
        clearTimeout(henGioKetNoiLaiRef.current)
        henGioKetNoiLaiRef.current = null
      }
      if (wsRef.current) {
        if (typeof window !== 'undefined' && (window as unknown as { __roomWs?: WebSocket }).__roomWs === wsRef.current) {
          ;(window as unknown as { __roomWs?: WebSocket }).__roomWs = undefined
        }
        wsRef.current.onclose = null
        wsRef.current.close(1000, 'roi_phong')
        wsRef.current = null
      }
    }
  }, [ketNoi])

  const doDoTre = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const pingT = clockSyncRef.current.createPing()
    ws.send(JSON.stringify({ type: 'ping', t: pingT }))
  }, [])

  // Auto refresh clock offset and latency every 10s
  useEffect(() => {
    if (trangThai !== 'da_ket_noi') return
    doDoTre()
    const timer = setInterval(() => {
      doDoTre()
    }, 10000)
    return () => clearInterval(timer)
  }, [trangThai, doDoTre])

  // Thuật toán Server-Authoritative tính toán vị trí video mục tiêu tại client với Server Clock Offset
  const calculateTargetTime = useCallback(() => {
    const estimatedServerNow = Date.now() + (serverClockOffsetRef.current || 0)
    return canonicalMediaPosition(mediaState, estimatedServerNow)
  }, [mediaState])

  // Kiểm tra độ lệch giữa player cục bộ và server
  const checkDrift = useCallback((localTime: number) => {
    const target = calculateTargetTime()
    const delta = target - localTime

    if (Math.abs(delta) < 0.35) {
      return { action: 'ok' as const, targetTime: target, rate: 1 }
    }
    if (Math.abs(delta) < 1.5) {
      return {
        action: delta > 0 ? ('nudge_up' as const) : ('nudge_down' as const),
        targetTime: target,
        rate: delta > 0 ? 1.25 : 0.75,
      }
    }
    // Độ lệch >= 1.5s -> bắt buộc nhảy seekTo
    return { action: 'seek' as const, targetTime: target, rate: 1 }
  }, [calculateTargetTime])

  // Actions
  const syncMedia = useCallback((data: LenhPhongMedia) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'media.action', data }))
  }, [])

  const togglePomodoro = useCallback((data: LenhPhongPomodoro) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'pomodoro.action', data }))
  }, [])

  const sendStroke = useCallback((stroke: Omit<WhiteboardStroke, 'epoch'> | WhiteboardStroke) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const strokeWithEpoch: WhiteboardStroke = {
      ...stroke,
      epoch: 'epoch' in stroke && typeof stroke.epoch === 'number' ? stroke.epoch : whiteboardEpochRef.current,
    }
    ws.send(JSON.stringify({ type: 'whiteboard.action', data: { action: 'stroke.add', stroke: strokeWithEpoch } }))
  }, [])

  const clearWhiteboard = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'whiteboard.action', data: { action: 'stroke.clear' } }))
  }, [])

  const updateNotes = useCallback((content: string, baseRevision?: number) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      type: 'notes.action',
      data: {
        action: 'update',
        content,
        baseRevision: typeof baseRevision === 'number' ? baseRevision : sharedNotesRef.current.revision,
      },
    }))
  }, [])

  const resolveNotesConflict = useCallback((choice: 'keep_server' | 'force_client') => {
    if (!notesConflict) return
    if (choice === 'keep_server') {
      setNotesConflict(null)
    } else if (choice === 'force_client') {
      // Do NOT clear conflict here prematurely.
      // The server will send notes.sync once it accepts the content, and the
      // existing notes.sync handler clears the conflict only when
      // goi.notes.content === prev.rejectedContent (line ~196).
      // If the WebSocket is offline, updateNotes returns without sending and
      // the conflict (including the rejected draft) remains preserved.
      updateNotes(notesConflict.rejectedContent, sharedNotesRef.current.revision)
    }
  }, [notesConflict, updateNotes])

  const addToQueue = useCallback((videoId: string, title: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'queue.action', data: { action: 'add', videoId, title } }))
  }, [])

  const removeFromQueue = useCallback((id: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'queue.action', data: { action: 'remove', id } }))
  }, [])

  const playFromQueue = useCallback((id: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'queue.action', data: { action: 'play', id } }))
  }, [])

  const sendRoomChat = useCallback((text: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    const cleaned = lamSachVanBan(text)
    if (!cleaned) return
    const reqId = `rc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    ws.send(JSON.stringify({ type: 'chat.send', reqId, text: cleaned }))
  }, [])

  const toggleMic = useCallback(async () => {
    if (!voiceClientRef.current) return
    const beforeState = voiceClientRef.current.state
    const nextActive = await voiceClientRef.current.toggleMic()
    const afterState = voiceClientRef.current.state
    if (!nextActive && afterState.errorMessage) {
      toast.error(afterState.errorMessage)
    }
    const ws = wsRef.current
    if (
      ws &&
      ws.readyState === WebSocket.OPEN &&
      beforeState.isPublishing &&
      afterState.isPublishing
    ) {
      ws.send(
        JSON.stringify({
          type: 'voice.self_state',
          generation: voiceClientRef.current.getGeneration() || 1,
          muted: afterState.isMuted,
        }),
      )
    }
  }, [])

  const unblockVoiceAutoplay = useCallback(async () => {
    return voiceClientRef.current?.unblockAutoplay() ?? false
  }, [])

  const setAudioInputDevice = useCallback(async (deviceId: string) => {
    return voiceClientRef.current?.setAudioInputDevice(deviceId) ?? false
  }, [])

  const setAudioOutputDevice = useCallback(async (deviceId: string) => {
    return voiceClientRef.current?.setAudioOutputDevice(deviceId) ?? false
  }, [])

  const forceMuteMember = useCallback(async (targetActorKey: string) => {
    const idMatch = roomId.match(/(\d+)$/)
    if (!idMatch) return
    const res = await fetch(`/api/rooms/${idMatch[1]}/voice/force-mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ targetActorKey }),
    })
    const json = (await res.json().catch(() => null)) as any
    if (!res.ok || !json?.ok) {
      throw new Error(json?.loi || 'Không thể tắt micro của thành viên.')
    }
  }, [roomId])

  const kickMember = useCallback(
    async (targetActorKey: string, reason?: string, banFromRoom = false) => {
      const idMatch = roomId.match(/(\d+)$/)
      if (!idMatch) return { ok: false, loi: 'ID phòng không hợp lệ.' }
      try {
        const res = await fetch(`/api/rooms/${idMatch[1]}/kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ targetActorKey, reason, banFromRoom }),
        })
        const json = (await res.json().catch(() => null)) as any
        if (!res.ok || !json?.ok) {
          return { ok: false, loi: json?.loi || 'Không thể mời thành viên ra khỏi phòng.' }
        }
        return {
          ok: true,
          kicked: json.kicked,
          absent: json.absent,
          banned: json.banned,
          partial: json.partial,
          liveRemovalError: json.liveRemovalError,
          message: json.message,
        }
      } catch (err: any) {
        return { ok: false, loi: err?.message || 'Lỗi mạng khi thực hiện thao tác.' }
      }
    },
    [roomId],
  )

  const banMember = useCallback(
    async (targetAccountId: number, reason?: string) => {
      const idMatch = roomId.match(/(\d+)$/)
      if (!idMatch) return { ok: false, loi: 'ID phòng không hợp lệ.' }
      try {
        const res = await fetch(`/api/rooms/${idMatch[1]}/ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ targetAccountId, reason }),
        })
        const json = (await res.json().catch(() => null)) as any
        if (!res.ok || !json?.ok) {
          return { ok: false, loi: json?.loi || 'Không thể cấm thành viên vào phòng.' }
        }
        return {
          ok: true,
          banned: json.banned,
          removedFromLiveSession: json.removedFromLiveSession,
          absent: json.absent,
          partial: json.partial,
          liveRemovalError: json.liveRemovalError,
        }
      } catch (err: any) {
        return { ok: false, loi: err?.message || 'Lỗi mạng khi thực hiện thao tác.' }
      }
    },
    [roomId],
  )

  const unbanMember = useCallback(
    async (
      targetAccountId: number,
      opts?: { expectedBanId?: number; expectedRevision?: number; expectedCooldownId?: string },
    ): Promise<{
      ok: boolean
      loi?: string
      unbanned?: boolean
      cooldownCleared?: boolean
      cooldownClearError?: string
      partial?: boolean
      message?: string
    }> => {
      const idMatch = roomId.match(/(\d+)$/)
      if (!idMatch) return { ok: false, loi: 'ID phòng không hợp lệ.' }
      try {
        const res = await fetch(`/api/rooms/${idMatch[1]}/unban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            targetAccountId,
            expectedBanId: opts?.expectedBanId,
            expectedRevision: opts?.expectedRevision,
            expectedCooldownId: opts?.expectedCooldownId,
          }),
        })
        const json = (await res.json().catch(() => null)) as any
        if (!res.ok || !json?.ok) {
          return { ok: false, loi: json?.loi || 'Không thể gỡ cấm thành viên.' }
        }
        return {
          ok: true,
          unbanned: Boolean(json.unbanned),
          cooldownCleared: Boolean(json.cooldownCleared),
          cooldownClearError: json.cooldownClearError,
          partial: Boolean(json.partial),
          message: json.message,
        }
      } catch (err: any) {
        return { ok: false, loi: err?.message || 'Lỗi mạng khi thực hiện thao tác.' }
      }
    },
    [roomId],
  )

  const listBannedMembers = useCallback(async (): Promise<{ bannedMembers: BannedMemberItem[] }> => {
    const idMatch = roomId.match(/(\d+)$/)
    if (!idMatch) return { bannedMembers: [] }
    try {
      const res = await fetch(`/api/rooms/${idMatch[1]}/banned-members`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      })
      const json = (await res.json().catch(() => null)) as any
      if (!res.ok || !Array.isArray(json?.bannedMembers)) {
        return { bannedMembers: [] }
      }
      return { bannedMembers: json.bannedMembers as BannedMemberItem[] }
    } catch {
      return { bannedMembers: [] }
    }
  }, [roomId])

  const submitReport = useCallback(
    async (payload: {
      reportedAccountId: number
      category: string
      reason: string
      contentSnippet?: string
    }) => {
      const idMatch = roomId.match(/(\d+)$/)
      const numericRoomId = idMatch ? parseInt(idMatch[1], 10) : undefined
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            reportedAccountId: payload.reportedAccountId,
            roomId: numericRoomId,
            category: payload.category,
            reason: payload.reason,
            contentSnippet: payload.contentSnippet,
          }),
        })
        const json = (await res.json().catch(() => null)) as any
        if (!res.ok || !json?.ok) {
          return { ok: false, loi: json?.loi || 'Không thể gửi báo cáo vi phạm.' }
        }
        return { ok: true, reportId: json.reportId }
      } catch (err: any) {
        return { ok: false, loi: err?.message || 'Lỗi kết nối khi gửi báo cáo.' }
      }
    },
    [roomId],
  )

  const changeSlidePage = useCallback((page: number) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'slide.action', data: { action: 'change_page', page } }))
  }, [])

  const loadSlideDoc = useCallback((docUrl: string, docName: string, fileType: 'pptx' | 'pdf' | 'image', totalPages = 1, docId?: number) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      type: 'slide.action',
      data: { action: 'load_doc', docId, docUrl, docName, fileType, totalPages }
    }))
  }, [])

  const closeSlideDoc = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'slide.action', data: { action: 'close_doc' } }))
  }, [])

  // ── Learning Session v1 Actions ─────────────────────────
  const sendSessionAction = useCallback((action: LenhPhongSession) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'session.action', data: action }))
  }, [])

  const setGoal = useCallback((text: string) => {
    sendSessionAction({ action: 'goal.set', text })
  }, [sendSessionAction])

  const clearGoal = useCallback(() => {
    sendSessionAction({ action: 'goal.clear' })
  }, [sendSessionAction])

  const addTask = useCallback((text: string) => {
    sendSessionAction({ action: 'task.add', text })
  }, [sendSessionAction])

  const removeTask = useCallback((taskId: string) => {
    sendSessionAction({ action: 'task.remove', taskId })
  }, [sendSessionAction])

  const tickTask = useCallback((taskId: string) => {
    sendSessionAction({ action: 'task.tick', taskId })
  }, [sendSessionAction])

  const untickTask = useCallback((taskId: string) => {
    sendSessionAction({ action: 'task.untick', taskId })
  }, [sendSessionAction])

  const startSessionTimer = useCallback((durationSeconds: number) => {
    sendSessionAction({ action: 'timer.start', durationSeconds })
  }, [sendSessionAction])

  const pauseSessionTimer = useCallback(() => {
    sendSessionAction({ action: 'timer.pause' })
  }, [sendSessionAction])

  const resetSessionTimer = useCallback(() => {
    sendSessionAction({ action: 'timer.reset' })
  }, [sendSessionAction])

  const createPoll = useCallback((question: string, options: string[]) => {
    sendSessionAction({ action: 'poll.create', question, options })
  }, [sendSessionAction])

  const votePoll = useCallback((pollId: string, optionId: string) => {
    sendSessionAction({ action: 'poll.vote', pollId, optionId })
  }, [sendSessionAction])

  const closePoll = useCallback(() => {
    sendSessionAction({ action: 'poll.close' })
  }, [sendSessionAction])

  const startSession = useCallback(() => {
    sendSessionAction({ action: 'session.start' })
  }, [sendSessionAction])

  const endSession = useCallback(() => {
    sendSessionAction({ action: 'session.end' })
  }, [sendSessionAction])

  return {
    trangThai,
    thongBaoLoiPhong,
    roomClosedInfo,
    members,
    hostKey,
    isHost,
    canModerate,
    canControlMedia,
    serverClockOffset,
    mediaState,
    pomodoroState,
    whiteboardStrokes,
    whiteboardEpoch,
    sharedNotes,
    notesConflict,
    resolveNotesConflict,
    queue,
    chatMessages,
    latencyMs,
    myMic,
    doDoTre,
    calculateTargetTime,
    checkDrift,
    syncMedia,
    togglePomodoro,
    sendStroke,
    clearWhiteboard,
    updateNotes,
    addToQueue,
    removeFromQueue,
    playFromQueue,
    sendRoomChat,
    toggleMic,
    forceMuteMember,
    kickMember,
    banMember,
    unbanMember,
    listBannedMembers,
    submitReport,
    voiceRegistry,
    voiceState,
    unblockVoiceAutoplay,
    setAudioInputDevice,
    setAudioOutputDevice,
    slideState,
    changeSlidePage,
    loadSlideDoc,
    closeSlideDoc,
    // Learning Session v1
    sessionGoal,
    sessionTasks,
    sessionTaskCompletions,
    sessionTimer,
    activePoll,
    pollVoteCounts,
    sessionStartedAt,
    activeParticipantKeys,
    sessionSummary,
    setGoal,
    clearGoal,
    addTask,
    removeTask,
    tickTask,
    untickTask,
    startSessionTimer,
    pauseSessionTimer,
    resetSessionTimer,
    createPoll,
    votePoll,
    closePoll,
    startSession,
    endSession,
  }
}
