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
  canonicalMediaPosition,
} from '@shared/protocol/room'
import { lamSachVanBan, MA_DONG_SOCKET } from '@shared/protocol/common'
import { ClockSyncManager } from '@/features/study/clock-sync'

export type TrangThaiKetNoiPhong =
  | 'dang_ket_noi'
  | 'da_ket_noi'
  | 'mat_ket_noi'
  | 'phien_bi_thay'
  | 'can_xac_thuc_lai'
  | 'bi_tu_choi'

const BACKOFF_KHOI_DAU_MS = 1000
const BACKOFF_TOI_DA_MS = 10000

const DEFAULT_MEDIA: MediaState = {
  videoId: 'dQw4w9WgXcQ',
  title: 'Video học tập chung',
  status: 'paused',
  time: 0,
  updatedAt: Date.now(),
  playbackRate: 1,
  hostOnlyControl: false,
}

const DEFAULT_POMODORO: PomodoroState = {
  running: false,
  mode: 'focus',
  duration: 1500,
  endsAt: 0,
  remaining: 1500,
  round: 1,
}

const DEFAULT_NOTES: SharedNotes = {
  content: '# Ghi chú bài học 📝\n\n- Thảo luận và ghi lại các công thức quan trọng tại đây.',
  lastEditedBy: 'Hệ thống',
  updatedAt: Date.now(),
}

export function useRoom(roomId: string, myActorKey?: string) {
  const [trangThai, setTrangThai] = useState<TrangThaiKetNoiPhong>('dang_ket_noi')
  const [members, setMembers] = useState<ThanhVienPhong[]>([])
  const [hostKey, setHostKey] = useState<string | null>(null)
  const [mediaState, setMediaState] = useState<MediaState>(DEFAULT_MEDIA)
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(DEFAULT_POMODORO)
  const [whiteboardStrokes, setWhiteboardStrokes] = useState<WhiteboardStroke[]>([])
  const [sharedNotes, setSharedNotes] = useState<SharedNotes>(DEFAULT_NOTES)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([])
  const [slideState, setSlideState] = useState<SlideState | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [serverClockOffset, setServerClockOffset] = useState<number>(0)
  const [myMic, setMyMic] = useState(false)
  const [thongBaoLoiPhong, setThongBaoLoiPhong] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const clockSyncRef = useRef<ClockSyncManager>(new ClockSyncManager())
  const serverClockOffsetRef = useRef<number>(0)
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
    const ws = new WebSocket(`${giaoThuc}//${host}/ws/room/${encodeURIComponent(roomId)}`)
    wsRef.current = ws

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
          setMembers(goi.members)
          setMediaState(goi.media)
          setPomodoroState(goi.pomodoro)
          setSharedNotes(goi.notes)
          setWhiteboardStrokes(goi.strokes)
          setQueue(goi.queue)
          setChatMessages(goi.chat)
          setSlideState(goi.slide ?? null)
          if (clockSyncRef.current.getSamples().length === 0 && typeof goi.serverNow === 'number') {
            clockSyncRef.current = new ClockSyncManager([goi.serverNow - Date.now()])
            const initialOffset = clockSyncRef.current.getMedianOffset()
            serverClockOffsetRef.current = initialOffset
            setServerClockOffset(initialOffset)
          }
          break

        case 'presence':
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
            setWhiteboardStrokes((prev) => {
              if (prev.some((s) => s.id === st.id)) return prev
              return [...prev, st].slice(-1000)
            })
          } else if (goi.action === 'stroke.clear') {
            setWhiteboardStrokes([])
          }
          break

        case 'notes.sync':
          setSharedNotes(goi.notes)
          break

        case 'queue.sync':
          setQueue(goi.queue)
          break

        case 'slide.sync':
          setSlideState(goi.slide ?? null)
          break

        case 'room.chat': {
          const msg = goi.message
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg].slice(-100)
          })
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

      if (daHuyRef.current) return

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
  }, [roomId])

  useEffect(() => {
    ketNoiRef.current = ketNoi
  }, [ketNoi])

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

  const sendStroke = useCallback((stroke: WhiteboardStroke) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'whiteboard.action', data: { action: 'stroke.add', stroke } }))
  }, [])

  const clearWhiteboard = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'whiteboard.action', data: { action: 'stroke.clear' } }))
  }, [])

  const updateNotes = useCallback((content: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'notes.action', data: { action: 'update', content } }))
  }, [])

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

  const toggleMic = useCallback(() => {
    const next = !myMic
    setMyMic(next)
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'voice.mic', mic: next }))
  }, [myMic])

  const changeSlidePage = useCallback((page: number) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'slide.action', data: { action: 'change_page', page } }))
  }, [])

  const loadSlideDoc = useCallback((docUrl: string, docName: string, fileType: 'pptx' | 'pdf' | 'image', totalPages = 1) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({
      type: 'slide.action',
      data: { action: 'load_doc', docUrl, docName, fileType, totalPages }
    }))
  }, [])

  const closeSlideDoc = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'slide.action', data: { action: 'close_doc' } }))
  }, [])

  return {
    trangThai,
    thongBaoLoiPhong,
    members,
    hostKey,
    isHost,
    canModerate,
    canControlMedia,
    serverClockOffset,
    mediaState,
    pomodoroState,
    whiteboardStrokes,
    sharedNotes,
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
    slideState,
    changeSlidePage,
    loadSlideDoc,
    closeSlideDoc,
  }
}
