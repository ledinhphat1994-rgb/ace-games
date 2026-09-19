import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoom } from '@/hooks/use-room'
import type { NguoiDung } from '@/lib/api'
import { SUPPORTED_PLAYBACK_RATES, type SupportedPlaybackRate } from '@shared/protocol/room'
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Calculator as CalcIcon,
  Crown,
  Eraser,
  FileText,
  Flag,
  GraduationCap,
  Loader2,
  Mic,
  MicOff,
  Pause,
  PenTool,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  UserX,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { usePhien } from '@/app/phien'
import { useCampusContext } from '@/app/CampusContext'
import { FriendsDrawer } from '@/components/social/FriendsDrawer'
import { UserAvatarMenu } from '@/components/UserAvatarMenu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChalkboardCanvas } from './ChalkboardCanvas'
import { FloatingCalculator } from './FloatingCalculator'
import { FloatingSlidePanel, PinnedSlideView } from './FloatingSlidePanel'
import { FloatingVideoPlayer } from './FloatingVideoPlayer'
import { SlideUploadModal } from './SlideUploadModal'
import {
  KickMemberDialog,
  ReportUserDialog,
  BannedMembersDialog,
} from './ModerationDialogs'
import {
  SessionPanel,
  SessionSummaryModal,
  SessionTimerWidget,
} from './LearningSession'

// ─── Constants ───────────────────────────────────────────────────────────────
const CHALK_COLORS = [
  { name: 'Trắng', color: '#FFFFFF' },
  { name: 'Vàng', color: '#FEF08A' },
  { name: 'Xanh lam', color: '#67E8F9' },
  { name: 'Hồng', color: '#F472B6' },
  { name: 'Lục nhạt', color: '#86EFAC' },
  { name: 'Cam', color: '#FDBA74' },
]
const CHALK_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 6 },
  { label: 'L', size: 12 },
  { label: 'XL', size: 22 },
]

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function dinhDangGiayPhut(s: number): string {
  const sec = Math.max(0, Math.floor(s))
  const m = Math.floor(sec / 60)
  const rem = sec % 60
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`
}

function trichXuatYoutubeId(linkHoacId: string): string {
  const trimmed = linkHoacId.trim()
  const khop = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  if (khop) return khop[1]
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  return ''
}

// ─── Window z-index manager ───────────────────────────────────────────────────
let zCounter = 40

function nextZIndex() {
  zCounter += 1
  return zCounter
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface StudyRoomViewProps {
  roomId: string
  nguoiDung: NguoiDung
  onLeaveRoom: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export function StudyRoomView({ roomId, nguoiDung, onLeaveRoom }: StudyRoomViewProps) {
  const {
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
    notesConflict,
    resolveNotesConflict,
    chatMessages,
    latencyMs,
    myMic,
    syncMedia,
    togglePomodoro,
    sendStroke,
    clearWhiteboard,
    updateNotes,
    sendRoomChat,
    toggleMic,
    forceMuteMember,
    kickMember,
    unbanMember,
    listBannedMembers,
    submitReport,
    voiceState,
    unblockVoiceAutoplay,
    setAudioInputDevice,
    setAudioOutputDevice,
    slideState,
    changeSlidePage,
    loadSlideDoc,
    closeSlideDoc,
    calculateTargetTime,
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
  } = useRoom(roomId, nguoiDung.actorKey)

  const { lamMoiPhien } = usePhien()

  // ── Learning Session v1 local UI state ──────────────────────────────────
  const [sessionPanelOpen, setSessionPanelOpen] = useState(false)
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false)

  // Auto-open summary modal when summary is received
  useEffect(() => {
    if (sessionSummary) {
      // oxlint-disable-next-line react/set-state-in-effect
      setSessionSummaryOpen(true)
    }
  }, [sessionSummary])

  // ── Moderation & Safety v1 state ──────────────────────────────────────────
  const [kickTarget, setKickTarget] = useState<{ actorKey: string; name: string } | null>(null)
  const [reportTarget, setReportTarget] = useState<{ accountId: number; name: string; contentSnippet?: string } | null>(null)
  const [showBannedModal, setShowBannedModal] = useState(false)

  const handleConfirmKick = useCallback(
    async (targetActorKey: string, reason: string, banFromRoom: boolean) => {
      const res = await kickMember(targetActorKey, reason, banFromRoom)
      if (res.ok) {
        if (res.absent) {
          toast.info(res.banned ? 'Đã cấm thành viên (thành viên hiện không có trong phòng).' : 'Thành viên không còn trong phòng.')
        } else if (res.partial) {
          toast.warning('Đã thiết lập cấm nhưng chưa thể ngắt kết nối trực tiếp khỏi phòng.')
        } else {
          toast.success(banFromRoom ? 'Đã mời và cấm thành viên vào phòng.' : 'Đã mời thành viên ra khỏi phòng.')
        }
      } else {
        toast.error(res.loi || 'Không thể mời thành viên ra.')
        throw new Error(res.loi)
      }
    },
    [kickMember],
  )

  const handleConfirmReport = useCallback(
    async (reportedAccountId: number, category: string, reason: string, contentSnippet?: string) => {
      const res = await submitReport({
        reportedAccountId,
        category,
        reason,
        contentSnippet,
      })
      if (res.ok) {
        toast.success('Báo cáo vi phạm đã được ghi nhận và chuyển tới ban quản lý.')
      } else {
        toast.error(res.loi || 'Không thể gửi báo cáo.')
        throw new Error(res.loi)
      }
    },
    [submitReport],
  )

  // ── Voice devices state & refresh ─────────────────────────────────────────
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([])
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([])
  const [isSinkIdSupported] = useState(() => {
    if (typeof window !== 'undefined') {
      return typeof (new Audio() as unknown as { setSinkId?: unknown }).setSinkId === 'function'
    }
    return false
  })
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)

  const refreshDevices = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices()
        setAudioInputs(devs.filter((d) => d.kind === 'audioinput'))
        setAudioOutputs(devs.filter((d) => d.kind === 'audiooutput'))
      } catch {}
    }
  }, [])

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices)
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices)
      }
    }
  }, [refreshDevices])

  // ── Chalk tool state (lifted from canvas, controlled by bottom dock) ──────
  const [selectedColor, setSelectedColor] = useState('#FFFFFF')
  const [selectedSize, setSelectedSize] = useState(6)
  const [isEraser, setIsEraser] = useState(false)
  const [showColorPopover, setShowColorPopover] = useState(false)
  const [showSizePopover, setShowSizePopover] = useState(false)

  // ── Window visibility & z-index ──────────────────────────────────────────
  const [youtubeZ, setYoutubeZ] = useState(41)
  const [slideZ, setSlideZ] = useState(40)
  const [calcZ, setCalcZ] = useState(39)

  const [showYoutube, setShowYoutube] = useState(false)
  const [showSlide, setShowSlide] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [isSlidePinned, setIsSlidePinned] = useState(false)

  // ── Drawers ──────────────────────────────────────────────────────────────
  const [showChat, setShowChat] = useState(false)
  const [showMembers, setShowMembers] = useState(false)

  // ── Popover panels above dock ────────────────────────────────────────────
  const [showYtPanel, setShowYtPanel] = useState(false)

  // ── Modals ───────────────────────────────────────────────────────────────
  const [showUploadModal, setShowUploadModal] = useState(false)

  // ── Video volume ─────────────────────────────────────────────────────────
  const [volume, setVolume] = useState(80)

  // ── Form state ───────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [directYtInput, setDirectYtInput] = useState('')
  const [localNotes, setLocalNotes] = useState(sharedNotes.content)

  // ── YouTube search state ──────────────────────────────────────────────────────
  const [ytTab, setYtTab] = useState<'paste' | 'search'>('paste')
  const [ytSearch, setYtSearch] = useState('')
  const [ytSearching, setYtSearching] = useState(false)
  const [ytResults, setYtResults] = useState<{ videoId: string; title: string; author: string }[]>([])

  // ── Pomodoro countdown (Server-Authoritative derived state, 0 render-time setState) ─
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    if (!pomodoroState.running || pomodoroState.endsAt <= 0) return
    const t = setInterval(() => setNowMs(Date.now()), 500)
    return () => clearInterval(t)
  }, [pomodoroState.running, pomodoroState.endsAt])

  const pomoRemaining = useMemo(() => {
    if (!pomodoroState.running || pomodoroState.endsAt <= 0) {
      return pomodoroState.remaining
    }
    const estimatedServerNow = nowMs + (serverClockOffset || 0)
    return Math.max(0, Math.round((pomodoroState.endsAt - estimatedServerNow) / 1000))
  }, [pomodoroState.running, pomodoroState.endsAt, pomodoroState.remaining, serverClockOffset, nowMs])

  // Toast notification when pomodoro mode switches on server
  const prevModeRef = useRef(pomodoroState.mode)
  useEffect(() => {
    if (pomodoroState.mode !== prevModeRef.current) {
      prevModeRef.current = pomodoroState.mode
      toast.info(pomodoroState.mode === 'focus' ? 'Bắt đầu phiên tập trung mới!' : 'Đến giờ nghỉ ngơi rồi!')
    }
  }, [pomodoroState.mode])

  // ── Sync notes (Safe useEffect, preserves local draft during conflict) ───
  const lastNotesRevRef = useRef(sharedNotes.revision)
  // Tracks content sent to server but not yet confirmed to guard against a
  // racing notes.sync broadcast overwriting localNotes before notes.conflict arrives.
  const notesInFlightContentRef = useRef<string | null>(null)
  useEffect(() => {
    if (sharedNotes.revision !== lastNotesRevRef.current) {
      lastNotesRevRef.current = sharedNotes.revision
      if (!notesConflict && notesInFlightContentRef.current === null) {
        // No conflict, no in-flight update: safe to sync textarea with server
        // oxlint-disable-next-line react/set-state-in-effect
        setLocalNotes(sharedNotes.content)
      } else if (notesInFlightContentRef.current !== null && !notesConflict) {
        // Our update is in-flight. If the server echoed back our exact content,
        // our save succeeded — clear the in-flight guard (no setLocalNotes needed,
        // textarea already shows that content). Otherwise keep the guard: a
        // different update arrived and notes.conflict will follow shortly.
        if (sharedNotes.content === notesInFlightContentRef.current) {
          notesInFlightContentRef.current = null
        }
      }
      // When notesConflict is active: never overwrite the preserved local draft.
    }
  }, [sharedNotes.revision, sharedNotes.content, notesConflict])

  // Clear the in-flight guard when conflict resolves (keep_server or force_client accepted)
  useEffect(() => {
    if (!notesConflict) {
      notesInFlightContentRef.current = null
    }
  }, [notesConflict])

  // ── Auto-show youtube & slide window safely on genuine remote change ─────
  const prevVideoIdRef = useRef(mediaState.videoId)
  useEffect(() => {
    if (mediaState.videoId && mediaState.videoId !== prevVideoIdRef.current) {
      prevVideoIdRef.current = mediaState.videoId
      setShowYoutube(true)
    }
  }, [mediaState.videoId])

  const prevSlideUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (slideState?.docUrl && slideState?.docUrl !== prevSlideUrlRef.current) {
      prevSlideUrlRef.current = slideState.docUrl
      setShowSlide(true)
    }
  }, [slideState?.docUrl])

  // ── Refs ─────────────────────────────────────────────────────────────────
  const chatRef = useRef<HTMLDivElement | null>(null)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editingBaseRevRef = useRef(sharedNotes.revision)

  useEffect(() => {
    if (!notesTimerRef.current) {
      editingBaseRevRef.current = sharedNotes.revision
    }
  }, [sharedNotes.revision])

  // When in conflict, abort any pending debounced timers to prevent accidental overwrite
  useEffect(() => {
    if (notesConflict && notesTimerRef.current) {
      clearTimeout(notesTimerRef.current)
      notesTimerRef.current = null
    }
  }, [notesConflict])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [chatMessages.length, showChat])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const tenChuPhong = useMemo(() => members.find((m) => m.key === hostKey)?.ten || 'Chủ phòng', [members, hostKey])

  // ── Social & Campus Presence Activity ──────────────────────────────────────
  const { setActivity } = useCampusContext()
  const numericRoomId = useMemo(() => {
    const num = parseInt(roomId.replace('phong-', ''), 10)
    return isNaN(num) ? undefined : num
  }, [roomId])

  useEffect(() => {
    if (numericRoomId) {
      setActivity({
        type: 'room',
        roomId: numericRoomId,
        roomTitle: tenChuPhong ? `Phòng của ${tenChuPhong}` : `Phòng học #${numericRoomId}`,
      })
    }
    return () => {
      setActivity(null)
    }
  }, [numericRoomId, tenChuPhong, setActivity])

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    sendRoomChat(text)
    setChatInput('')
  }

  const handleNotesChange = (text: string) => {
    setLocalNotes(text)
    if (notesConflict) return
    const baseRev = editingBaseRevRef.current
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => {
      notesTimerRef.current = null
      // Mark in-flight BEFORE sending so the racing notes.sync cannot
      // overwrite localNotes while we await server acknowledgement.
      notesInFlightContentRef.current = text
      updateNotes(text, baseRev)
    }, 600)
  }

  const handlePlayVideo = (e: React.FormEvent) => {
    e.preventDefault()
    const vid = trichXuatYoutubeId(directYtInput)
    if (!vid) { toast.error('Link YouTube không hợp lệ.'); return }
    syncMedia({ action: 'load', videoId: vid, title: `Bài giảng (${vid})` })
    syncMedia({ action: 'play' })
    setDirectYtInput('')
    setShowYtPanel(false)
    setShowYoutube(true)
    toast.success('Đã nạp video YouTube lên bảng học chung!')
  }

  const handleSyncMedia = (action: 'play' | 'pause' | 'seek' | 'rate', time?: number, rate?: number) => {
    if (action === 'play') {
      syncMedia({ action: 'play' })
    } else if (action === 'pause') {
      syncMedia({ action: 'pause' })
    } else if (action === 'seek') {
      syncMedia({ action: 'seek', time: Math.max(0, time || 0) })
    } else if (action === 'rate') {
      const validRate: SupportedPlaybackRate =
        rate && (SUPPORTED_PLAYBACK_RATES as readonly number[]).includes(rate)
          ? (rate as SupportedPlaybackRate)
          : 1
      syncMedia({ action: 'rate', rate: validRate })
    }
  }

  const handleLoadSlide = (docUrl: string, docName: string, fileType: 'pptx' | 'pdf' | 'image', totalPages: number) => {
    loadSlideDoc(docUrl, docName, fileType, totalPages)
    setShowSlide(true)
    setIsSlidePinned(false)
    setShowUploadModal(false)
  }

  const doYtSearch = async (q: string) => {
    if (!q.trim()) return
    setYtSearching(true)
    setYtResults([])
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(q.trim())}`)
      if (res.ok) {
        const data = await res.json() as { videoId: string; title: string; author: string }[]
        setYtResults(Array.isArray(data) ? data : [])
        if (!data.length) toast.error('Không tìm thấy kết quả. Thử từ khóa khác.')
      } else {
        toast.error('Không tìm được kết quả. Hãy dán link video trực tiếp.')
      }
    } catch {
      toast.error('Lỗi kết nối tìm kiếm. Hãy dán link video trực tiếp.')
    } finally {
      setYtSearching(false)
    }
  }

  const handlePickYtVideo = (videoId: string, title: string) => {
    syncMedia({ action: 'load', videoId, title })
    syncMedia({ action: 'play' })
    setShowYoutube(true)
    setShowYtPanel(false)
    setYtResults([])
    toast.success(`Đang phát: ${title.slice(0, 40)}…`)
  }

  const bringYoutubeToFront = () => setYoutubeZ(nextZIndex())
  const bringSlideToFront = () => setSlideZ(nextZIndex())
  const bringCalcToFront = () => setCalcZ(nextZIndex())

  const isOnline = trangThai === 'da_ket_noi'
  const [lastReadMessageId, setLastReadMessageId] = useState<number>(0)
  const hasInitializedReadRef = useRef(false)

  const highestMessageId = useMemo(() => {
    if (chatMessages.length === 0) return 0
    return Math.max(...chatMessages.map((m) => parseInt(m.id, 10) || 0))
  }, [chatMessages])

  useEffect(() => {
    if (!hasInitializedReadRef.current && chatMessages.length > 0) {
      hasInitializedReadRef.current = true
      setLastReadMessageId(Math.max(...chatMessages.map((m) => parseInt(m.id, 10) || 0)))
    }
  }, [chatMessages])

  const unreadChat = useMemo(() => {
    if (showChat) return 0
    return chatMessages.filter((m) => (parseInt(m.id, 10) || 0) > lastReadMessageId).length
  }, [chatMessages, showChat, lastReadMessageId])

  const handleToggleChat = () => {
    setShowChat((v) => {
      const next = !v
      if (next) {
        setShowMembers(false)
        setLastReadMessageId(highestMessageId)
      }
      return next
    })
  }

  const handleCloseChat = () => {
    setShowChat(false)
    setLastReadMessageId(highestMessageId)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-svh w-full overflow-hidden select-none">
      {/* ══ LAYER 0: Full-screen blackboard canvas with optional pinned slide layer ══ */}
      <div className="absolute inset-0">
        <ChalkboardCanvas
          strokes={whiteboardStrokes}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
          isEraser={isEraser}
          onSendStroke={sendStroke}
        >
          {showSlide && slideState && isSlidePinned && (
            <PinnedSlideView
              slideState={slideState}
              isHost={isHost}
              canModerate={canModerate}
              onUnpin={() => setIsSlidePinned(false)}
              onClose={() => {
                setIsSlidePinned(false)
                setShowSlide(false)
                if (isHost || canModerate) closeSlideDoc()
              }}
              onChangeSlidePage={changeSlidePage}
            />
          )}
        </ChalkboardCanvas>
      </div>

      {/* ══ LAYER 1: Top header bar ══ */}
      <header className="absolute inset-x-0 top-0 z-50 flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#090d16]/90 px-4 backdrop-blur-md">
        {/* Left: Leave + Room info */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={onLeaveRoom}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Rời phòng</span>
          </Button>

          <div className="hidden items-center gap-1.5 sm:flex">
            <Crown className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-bold text-white truncate max-w-[200px]">{tenChuPhong}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-red-400" />
            )}
            {latencyMs !== null && latencyMs > 0 && (
              <span className="text-[10px] font-mono text-slate-500">{latencyMs}ms</span>
            )}
          </div>
        </div>

        {/* Center: Pomodoro */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
              pomodoroState.mode === 'focus'
                ? 'border-emerald-500/40 bg-emerald-900/30'
                : 'border-sky-500/40 bg-sky-900/30'
            }`}
          >
            <button
              type="button"
              onClick={() => (isHost || canModerate) && togglePomodoro({ action: 'switch_mode', mode: pomodoroState.mode === 'focus' ? 'break' : 'focus' })}
              className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${
                (isHost || canModerate) ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'
              } ${
                pomodoroState.mode === 'focus' ? 'text-emerald-300' : 'text-sky-300'
              }`}
              title={(isHost || canModerate) ? 'Bấm để đổi chế độ Tập trung / Nghỉ ngơi' : undefined}
            >
              {pomodoroState.mode === 'focus' ? 'Tập trung' : 'Nghỉ ngơi'}
            </button>
            <span
              className={`font-mono text-base font-black tabular-nums ${
                pomodoroState.mode === 'focus' ? 'text-emerald-200' : 'text-sky-200'
              }`}
            >
              {dinhDangGiayPhut(pomoRemaining)}
            </span>
            {(isHost || canModerate) && (
              <div className="flex items-center gap-0.5 border-l border-white/10 pl-2">
                <button
                  onClick={() => togglePomodoro({ action: pomodoroState.running ? 'pause' : 'start' })}
                  className="rounded p-1 text-slate-400 hover:text-white transition-colors"
                  title={pomodoroState.running ? 'Dừng' : 'Bắt đầu'}
                >
                  {pomodoroState.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => togglePomodoro({ action: 'reset' })}
                  className="rounded p-1 text-slate-400 hover:text-white transition-colors"
                  title="Đặt lại"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Session + Members count + Mic + Host + Avatar Menu */}
        <div className="flex items-center gap-2">
          {/* Learning Session widget & trigger */}
          {sessionTimer.running && (
            <button
              type="button"
              onClick={() => setSessionPanelOpen(true)}
              title="Đồng hồ buổi học đang chạy. Nhấn để mở phiên học."
              className="cursor-pointer"
            >
              <SessionTimerWidget
                timer={sessionTimer}
                serverClockOffset={serverClockOffset}
                canControl={isHost || canModerate}
                onStart={startSessionTimer}
                onPause={pauseSessionTimer}
                onReset={resetSessionTimer}
                compact
              />
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSessionPanelOpen((v) => !v)}
            className={`h-8 gap-1.5 px-2.5 rounded-full border text-xs font-semibold transition-all ${
              sessionPanelOpen
                ? 'bg-primary/20 border-primary text-primary'
                : sessionStartedAt
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            }`}
            title="Mở phiên học nhóm (Nhiệm vụ, Mục tiêu, Khảo sát)"
          >
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline">Phiên học</span>
            {sessionTasks.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/30 px-1 text-[10px] font-bold text-primary-foreground">
                {sessionTasks.filter((t) => (sessionTaskCompletions[t.id] || []).includes(nguoiDung.accountId)).length}/
                {sessionTasks.length}
              </span>
            )}
          </Button>

          <button
            onClick={() => { setShowMembers(v => !v); handleCloseChat() }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold">{members.length}</span>
          </button>

          <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => {
                if (voiceState.blockedReason) {
                  toast.warning(voiceState.blockedReason)
                }
                toggleMic().catch((err) => {
                  toast.error(err.message || 'Lỗi bật/tắt micro.')
                })
              }}
              disabled={voiceState.isConnecting}
              className={`rounded-full p-2 transition-all ${
                myMic ? 'bg-emerald-600/80 text-white hover:bg-emerald-500' : 'text-slate-400 hover:bg-white/10'
              } ${voiceState.isConnecting ? 'opacity-60 cursor-wait' : ''} ${
                voiceState.speakingActors.includes('local') ? 'ring-2 ring-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.6)]' : ''
              }`}
              title={
                voiceState.isConnecting
                  ? 'Đang kết nối âm thanh...'
                  : voiceState.blockedReason
                  ? `Chưa cấu hình Realtime SFU: ${voiceState.blockedReason}`
                  : myMic
                  ? 'Micro đang bật. Nhấn để tắt'
                  : 'Micro đang tắt. Nhấn để bật'
              }
              aria-label={myMic ? 'Tắt micro' : 'Bật micro'}
            >
              {voiceState.isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              ) : myMic ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </button>

            <Popover open={showVoiceSettings} onOpenChange={(open) => { setShowVoiceSettings(open); if (open) refreshDevices() }}>
              <PopoverTrigger
                type="button"
                className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:outline-none"
                title="Cài đặt âm thanh"
                aria-label="Cài đặt âm thanh"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-72 border border-white/15 bg-[#0a0f1d]/95 p-3.5 text-slate-200 backdrop-blur-xl shadow-2xl rounded-2xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Cài đặt âm thanh</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {voiceState.connectionState === 'connected'
                        ? 'Đã kết nối'
                        : voiceState.connectionState === 'listening'
                        ? 'Đang nghe'
                        : voiceState.connectionState === 'reconnecting'
                        ? 'Đang kết nối lại'
                        : voiceState.connectionState === 'muted'
                        ? 'Đã tắt mic'
                        : 'Sẵn sàng'}
                    </span>
                  </div>

                  {/* Microphone selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="voice-mic-select" className="text-[11px] font-semibold text-slate-300">
                      Microphone
                    </label>
                    <select
                      id="voice-mic-select"
                      aria-label="Chọn thiết bị micro"
                      value={voiceState.currentInputDeviceId || ''}
                      onChange={(e) => {
                        setAudioInputDevice(e.target.value).catch(() => {})
                      }}
                      className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    >
                      {audioInputs.length === 0 ? (
                        <option value="" className="bg-slate-900 text-slate-300">
                          Mặc định hệ thống
                        </option>
                      ) : (
                        audioInputs.map((d, idx) => (
                          <option key={d.deviceId || idx} value={d.deviceId} className="bg-slate-900 text-white">
                            {d.label || `Microphone ${idx + 1}`}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Speaker selection (only if setSinkId is supported) */}
                  <div className="space-y-1.5">
                    <label htmlFor="voice-speaker-select" className="text-[11px] font-semibold text-slate-300">
                      Loa / Tai nghe
                    </label>
                    {isSinkIdSupported ? (
                      <select
                        id="voice-speaker-select"
                        aria-label="Chọn thiết bị phát loa"
                        value={voiceState.currentOutputDeviceId || ''}
                        onChange={(e) => {
                          setAudioOutputDevice(e.target.value).catch(() => {})
                        }}
                        className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        {audioOutputs.length === 0 ? (
                          <option value="" className="bg-slate-900 text-slate-300">
                            Mặc định hệ thống
                          </option>
                        ) : (
                          audioOutputs.map((d, idx) => (
                            <option key={d.deviceId || idx} value={d.deviceId} className="bg-slate-900 text-white">
                              {d.label || `Loa ${idx + 1}`}
                            </option>
                          ))
                        )}
                      </select>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">
                        Trình duyệt không hỗ trợ chọn đầu ra âm thanh riêng biệt.
                      </p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {isHost && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              HOST
            </span>
          )}

          <div className="border-l border-white/10 pl-2 flex items-center gap-1.5">
            <FriendsDrawer />
            <UserAvatarMenu
              nguoiDung={nguoiDung}
              onDangXuat={onLeaveRoom}
              onLamMoiPhien={lamMoiPhien}
            />
          </div>
        </div>
      </header>

      {/* ══ Autoplay unblock notification banner ══ */}
      {voiceState.isAudioAutoplayBlocked && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-[#0d1424]/95 px-4 py-2 shadow-2xl backdrop-blur-md">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium text-amber-200">
            Trình duyệt đang chặn âm thanh tự động của phòng học.
          </span>
          <Button
            size="sm"
            onClick={() => {
              unblockVoiceAutoplay().catch(() => {})
            }}
            className="h-7 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 rounded-xl shadow-md"
          >
            Bật âm thanh
          </Button>
        </div>
      )}

      {/* ══ LAYER 2: Floating windows ══ */}

      {/* YouTube floating player */}
      {showYoutube && mediaState.videoId ? (
        <div className="absolute" style={{ zIndex: youtubeZ, top: 70, left: 60 }} onClick={bringYoutubeToFront}>
          <FloatingVideoPlayer
            mediaState={mediaState}
            isHost={isHost}
            canModerate={canModerate}
            canControlMedia={canControlMedia}
            volume={volume}
            onVolumeChange={setVolume}
            onSyncMedia={handleSyncMedia}
            onOpenSearchQueue={() => setShowYtPanel(true)}
            onClose={() => setShowYoutube(false)}
            calculateTargetTime={calculateTargetTime}
          />
        </div>
      ) : null}

      {/* Slide floating panel (only shown if not pinned to background) */}
      {showSlide && slideState && !isSlidePinned ? (
        <FloatingSlidePanel
          slideState={slideState}
          isHost={isHost}
          canModerate={canModerate}
          zIndex={slideZ}
          onFocus={bringSlideToFront}
          onClose={() => {
            setShowSlide(false)
            if (isHost || canModerate) closeSlideDoc()
          }}
          onChangeSlidePage={changeSlidePage}
          onPin={() => setIsSlidePinned(true)}
        />
      ) : null}


      {/* Calculator floating window */}
      {showCalc ? (
        <FloatingCalculator
          zIndex={calcZ}
          onFocus={bringCalcToFront}
          onClose={() => setShowCalc(false)}
        />
      ) : null}

      {/* ══ LAYER 3: Chat drawer (slides in from right) ══ */}
      {showChat ? (
        <div className="absolute right-0 top-12 bottom-20 z-50 flex w-80 flex-col overflow-hidden border-l border-white/10 bg-[#090e18]/97 backdrop-blur-2xl shadow-2xl">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <span className="text-sm font-bold text-slate-200">💬 Chat phòng học</span>
            <button onClick={handleCloseChat} className="rounded p-1 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                Chưa có tin nhắn nào.
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.accountId === nguoiDung.accountId
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="mb-0.5 text-[10px] font-semibold text-slate-500">{msg.ten}</span>
                    )}
                    <div className="group/chatmsg relative flex items-center gap-1.5">
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                          isMe
                            ? 'rounded-tr-sm bg-indigo-600/90 text-white'
                            : 'rounded-tl-sm bg-white/8 text-slate-200'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportTarget({
                              accountId: msg.accountId,
                              name: msg.ten,
                              contentSnippet: msg.text,
                            })
                          }}
                          className="opacity-0 group-hover/chatmsg:opacity-100 transition-opacity p-1 text-slate-500 hover:text-amber-400"
                          title="Báo cáo tin nhắn này"
                          aria-label="Báo cáo tin nhắn này"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="relative">
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-1 z-10 w-72 rounded-xl border border-white/15 bg-[#0d1422]/98 p-2 shadow-2xl backdrop-blur-2xl">
                <div className="grid grid-cols-10 gap-0.5">
                  {[
                    '😊','😄','😆','🤣','😢','😭','😅','😍','😂','🙂',
                    '👍','👎','👋','🙌','🤝','💪','🤦','🙏','✌️','👏',
                    '❤️','💙','💚','💛','💜','🔥','⭐','🌟','💯','🎉',
                    '📚','📖','✏️','📝','🎯','💡','🏫','🎒','📊','🧩',
                    '😎','🤓','🥳','🎁','🏆','🥇','😜','🤔','😴','🤪',
                  ].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setChatInput((prev) => prev + em)}
                      className="rounded p-1 text-base leading-none hover:bg-white/10 transition-colors"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <form
              onSubmit={(e) => { handleSendChat(e); setShowEmoji(false) }}
              className="flex items-center gap-2 border-t border-white/10 p-3"
            >
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`h-8 w-8 shrink-0 rounded-lg text-lg leading-none transition-colors ${
                  showEmoji ? 'bg-indigo-600/60 ring-1 ring-indigo-500/50' : 'hover:bg-white/10'
                }`}
                title="Chèn emoji"
              >
                😊
              </button>
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin..."
                className="flex-1 h-8 border-white/15 bg-white/8 text-xs text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    // Use requestSubmit so form.onSubmit fires once (closes emoji too)
                    e.currentTarget.closest('form')?.requestSubmit()
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                className="h-8 w-8 shrink-0 p-0 bg-indigo-600 hover:bg-indigo-500"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      ) : null}

      {/* ══ Members drawer ══ */}
      {showMembers ? (
        <div className="absolute right-0 top-12 bottom-20 z-50 flex w-72 flex-col overflow-hidden border-l border-white/10 bg-[#090e18]/97 backdrop-blur-2xl shadow-2xl">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <span className="text-sm font-bold text-slate-200">👥 Thành viên ({members.length})</span>
            <div className="flex items-center gap-1.5">
              {(isHost || canModerate) && (
                <button
                  type="button"
                  onClick={() => setShowBannedModal(true)}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                  title="Xem và quản lý danh sách cấm"
                >
                  <Ban className="h-3 w-3" />
                  <span className="hidden sm:inline">DS Cấm</span>
                </button>
              )}
              <button onClick={() => setShowMembers(false)} className="rounded p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {members.map((m) => (
              <div key={m.key} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/60 text-sm font-bold text-white relative">
                  {m.ten.charAt(0).toUpperCase()}
                  {m.mic && (
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#090e18]">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">{m.ten}</p>
                  {m.key === hostKey && (
                    <p className="text-[10px] text-amber-400">Chủ phòng</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`rounded-full p-1 text-xs transition-all ${
                      m.mic ? 'text-emerald-400' : 'text-slate-500'
                    } ${
                      voiceState.speakingActors.includes(m.key) ||
                      (m.key === nguoiDung.actorKey && voiceState.speakingActors.includes('local'))
                        ? 'ring-2 ring-emerald-400 animate-pulse bg-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                        : ''
                    }`}
                    title={m.mic ? 'Đang bật micro' : 'Đang tắt micro'}
                  >
                    {m.mic ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                  </span>

                  {/* Force mute */}
                  {(isHost || canModerate) && m.key !== nguoiDung.actorKey && m.mic && (
                    <button
                      type="button"
                      onClick={() => {
                        forceMuteMember(m.key).catch((err) => toast.error(err.message))
                      }}
                      className="rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      title="Tắt micro của thành viên này"
                    >
                      <span className="text-[10px] font-bold text-red-400">Tắt mic</span>
                    </button>
                  )}

                  {/* Kick member */}
                  {(isHost || canModerate) && m.key !== nguoiDung.actorKey && (
                    <button
                      type="button"
                      onClick={() => setKickTarget({ actorKey: m.key, name: m.ten })}
                      className="rounded p-1 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                      title="Mời thành viên này ra khỏi phòng"
                      aria-label={`Mời ${m.ten} ra khỏi phòng`}
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Report user */}
                  {m.key !== nguoiDung.actorKey && (() => {
                    let accId = 0
                    if (m.key.startsWith('acc:')) accId = parseInt(m.key.slice(4), 10) || 0
                    if (!accId) return null
                    return (
                      <button
                        type="button"
                        onClick={() => setReportTarget({ accountId: accId, name: m.ten })}
                        className="rounded p-1 text-slate-500 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
                        title="Báo cáo vi phạm"
                        aria-label={`Báo cáo ${m.ten}`}
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>

          {/* Shared notes */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">📝 Ghi chú chung</p>
              {sharedNotes.lastEditedBy && (
                <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
                  Sửa bởi: {sharedNotes.lastEditedBy}
                </span>
              )}
            </div>

            {notesConflict && (
              <div data-testid="notes-conflict-banner" className="mb-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-300">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Xung đột chỉnh sửa!</span>
                </div>
                <p className="mt-1 text-[10px] text-amber-300/80 leading-snug">
                  Ghi chú đã được cập nhật bởi {notesConflict.currentNotes.lastEditedBy}. Nội dung bạn gõ không bị mất nhưng chưa được lưu vào văn bản chung.
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="notes-conflict-keep-server"
                    onClick={() => {
                      setLocalNotes(notesConflict.currentNotes.content)
                      resolveNotesConflict('keep_server')
                    }}
                    className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200 hover:bg-white/20 transition-colors"
                  >
                    Xem bản mới
                  </button>
                  <button
                    type="button"
                    data-testid="notes-conflict-retry"
                    onClick={() => resolveNotesConflict('force_client')}
                    className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-500 transition-colors"
                  >
                    Thử lưu bản của tôi
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Viết ghi chú chung cho cả lớp..."
              rows={4}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40"
            />
          </div>
        </div>
      ) : null}

      {/* ══ YouTube search/paste panel (above dock) ══ */}
      {showYtPanel ? (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 w-[460px] rounded-2xl border border-red-500/20 bg-[#0d1424]/97 shadow-2xl backdrop-blur-2xl ring-1 ring-red-500/10">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <YoutubeIcon className="h-5 w-5 text-red-500" />
              <span className="text-sm font-bold text-white">YouTube</span>
            </div>
            <button onClick={() => setShowYtPanel(false)} className="rounded p-1 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setYtTab('paste')}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                ytTab === 'paste' ? 'border-b-2 border-red-500 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              🔗 Dán link
            </button>
            <button
              onClick={() => setYtTab('search')}
              className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                ytTab === 'search' ? 'border-b-2 border-red-500 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              🔍 Tìm kiếm
            </button>
          </div>
          {/* Paste tab */}
          {ytTab === 'paste' && (
            <form onSubmit={handlePlayVideo} className="p-3 flex gap-2">
              <Input
                value={directYtInput}
                onChange={(e) => setDirectYtInput(e.target.value)}
                placeholder="Dán link YouTube hoặc mã video..."
                className="flex-1 h-9 border-white/15 bg-white/8 text-sm text-white placeholder:text-slate-600 focus-visible:ring-red-500/40"
              />
              <Button type="submit" className="h-9 bg-red-600 hover:bg-red-500 px-4 font-bold text-xs">
                Chèn
              </Button>
            </form>
          )}
          {/* Search tab */}
          {ytTab === 'search' && (
            <div className="p-3 space-y-2">
              <form
                onSubmit={(e) => { e.preventDefault(); doYtSearch(ytSearch) }}
                className="flex gap-2"
              >
                <Input
                  value={ytSearch}
                  onChange={(e) => setYtSearch(e.target.value)}
                  placeholder="Nhập từ khóa tìm bài giảng..."
                  className="flex-1 h-9 border-white/15 bg-white/8 text-sm text-white placeholder:text-slate-600 focus-visible:ring-red-500/40"
                />
                <Button type="submit" disabled={ytSearching} className="h-9 bg-red-600 hover:bg-red-500 px-3">
                  {ytSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </form>
              {ytSearching && (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm kiếm...
                </div>
              )}
              {!ytSearching && ytResults.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-0.5 pr-0.5">
                  {ytResults.map((v) => (
                    <button
                      key={v.videoId}
                      data-video-id={v.videoId}
                      onClick={() => handlePickYtVideo(v.videoId, v.title)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/8 text-left transition-colors"
                    >
                      <img
                        src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`}
                        alt=""
                        className="h-11 w-[78px] rounded object-cover shrink-0 bg-slate-800"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">{v.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{v.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!ytSearching && ytResults.length === 0 && ytSearch && (
                <p className="text-center text-xs text-slate-500 py-4">
                  Không có kết quả. Thử từ khóa khác hoặc dán link.
                </p>
              )}
              {!ytSearching && !ytSearch && (
                <p className="text-center text-xs text-slate-500 py-3">
                  Nhập từ khóa để tìm video bài giảng.
                </p>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* ══ LAYER 4: Bottom floating dock ══ */}
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#0b1020]/92 px-2 py-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/8">

          {/* Chalk Color Picker (Single control + Popover progressive disclosure) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowColorPopover((v) => !v)
                setShowSizePopover(false)
                if (isEraser) setIsEraser(false)
              }}
              className={`flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                !isEraser ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              aria-label="Màu phấn vẽ. Bấm để chọn màu khác."
              title="Màu phấn vẽ"
            >
              <span
                className="h-4 w-4 rounded-full border border-white/40 shadow-sm transition-transform hover:scale-110"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="hidden sm:inline text-[11px]">Màu</span>
            </button>

            {showColorPopover && (
              <div className="absolute bottom-full left-0 mb-3 flex items-center gap-1.5 rounded-2xl border border-white/15 bg-[#0b1020]/95 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 z-50 animate-in fade-in zoom-in-95 duration-150">
                {CHALK_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c.color)
                      setIsEraser(false)
                      setShowColorPopover(false)
                    }}
                    style={{ backgroundColor: c.color }}
                    className={`h-6 w-6 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                      !isEraser && selectedColor === c.color
                        ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#0b1020]'
                        : 'opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                    aria-label={`Chọn màu ${c.name}`}
                    title={c.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chalk Size Picker (Single control + Popover progressive disclosure) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowSizePopover((v) => !v)
                setShowColorPopover(false)
                if (isEraser) setIsEraser(false)
              }}
              className={`flex h-8 items-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                !isEraser ? 'text-emerald-300 hover:bg-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              aria-label="Cỡ nét vẽ. Bấm để đổi cỡ nét."
              title="Cỡ nét vẽ"
            >
              <PenTool className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold">Nét</span>
            </button>

            {showSizePopover && (
              <div className="absolute bottom-full left-0 mb-3 flex items-center gap-1 rounded-2xl border border-white/15 bg-[#0b1020]/95 p-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 z-50 animate-in fade-in zoom-in-95 duration-150">
                {CHALK_SIZES.map((s) => (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(s.size)
                      setIsEraser(false)
                      setShowSizePopover(false)
                    }}
                    className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      !isEraser && selectedSize === s.size
                        ? 'bg-emerald-500 text-black font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={`Chọn cỡ nét ${s.label}`}
                    title={`${s.label} (${s.size}px)`}
                  >
                    <span
                      className="rounded-full bg-current inline-block"
                      style={{ width: Math.max(3, Math.min(8, s.size)), height: Math.max(3, Math.min(8, s.size)) }}
                    />
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Eraser */}
          <button
            type="button"
            onClick={() => {
              setIsEraser((v) => !v)
              setShowColorPopover(false)
              setShowSizePopover(false)
            }}
            className={`flex h-8 items-center gap-1 rounded-xl px-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              isEraser ? 'bg-amber-500 text-black shadow-sm font-bold' : 'text-slate-400 hover:bg-white/8 hover:text-white'
            }`}
            aria-pressed={isEraser}
            aria-label="Tẩy phấn"
            title="Tẩy phấn"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tẩy</span>
          </button>

          {/* Clear board */}
          {(isHost || canModerate) && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ nét vẽ trên bảng đen không?')) {
                  clearWhiteboard()
                }
              }}
              className="flex h-8 items-center gap-1 rounded-xl px-2 text-xs text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              aria-label="Xóa toàn bộ bảng vẽ"
              title="Xóa toàn bộ bảng vẽ"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Separator */}
          <div className="mx-1 h-6 w-px bg-white/10" />

          {/* YouTube button */}
          <button
            onClick={() => { setShowYtPanel(v => !v) }}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              showYoutube ? 'bg-red-600/80 text-white' : 'text-red-400 hover:bg-red-600/20'
            }`}
            title="Chèn video YouTube"
          >
            <YoutubeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">YouTube</span>
          </button>

          {/* Slide button */}
          <button
            onClick={() => {
              if (slideState && !showSlide) {
                setShowSlide(true)
              } else if (isHost || canModerate) {
                setShowUploadModal(true)
              } else if (slideState) {
                setShowSlide((v) => !v)
              } else {
                toast.info('Chưa có bài giảng nào được tải lên.')
              }
            }}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              showSlide ? 'bg-orange-600/80 text-white' : 'text-orange-400 hover:bg-orange-600/20'
            }`}
            title={slideState ? (showSlide ? 'Đổi hoặc tải slide khác' : 'Hiện bài giảng slide') : (isHost || canModerate ? 'Tải bài giảng Slide / PDF' : 'Xem bài giảng slide')}
          >
            <Upload className="h-3.5 w-3.5" />
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Slide</span>
          </button>

          {/* Calculator button */}
          <button
            onClick={() => setShowCalc(v => !v)}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              showCalc ? 'bg-cyan-600/80 text-white' : 'text-cyan-400 hover:bg-cyan-600/20'
            }`}
            title="Máy tính khoa học FX"
          >
            <CalcIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Máy tính</span>
          </button>

          {/* Separator */}
          <div className="mx-1 h-6 w-px bg-white/10" />

          {/* Chat button */}
          <button
            onClick={handleToggleChat}
            className={`relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              showChat ? 'bg-indigo-600/80 text-white' : 'text-indigo-400 hover:bg-indigo-600/20'
            }`}
            title="Chat phòng học"
          >
            <span className="text-base leading-none">💬</span>
            {unreadChat > 0 && !showChat && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-black text-white">
                {Math.min(unreadChat, 99)}
              </span>
            )}
            <span className="hidden sm:inline">Chat</span>
          </button>

          {/* Members button */}
          <button
            onClick={() => { setShowMembers(v => !v); handleCloseChat() }}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              showMembers ? 'bg-violet-600/80 text-white' : 'text-violet-400 hover:bg-violet-600/20'
            }`}
            title="Thành viên"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="font-mono font-black">{members.length}</span>
          </button>
        </div>
      </div>

      {/* ══ Re-admission modal on password admission expiry ══ */}
      {trangThai === 'can_xac_thuc_lai' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-[#0d1422] p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Phiên vào phòng đã hết hạn.</h2>
            <p className="text-sm text-slate-400">
              Mã xác thực vào phòng có mật khẩu của bạn đã hết hạn hoặc không còn hiệu lực. Vui lòng quay lại sảnh để nhập lại mật khẩu.
            </p>
            <Button
              onClick={onLeaveRoom}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-indigo-500/20"
            >
              Quay lại sảnh để nhập lại mật khẩu
            </Button>
          </div>
        </div>
      )}

      {/* ══ Permanent room denial modal (banned / wrong class / room closed) ══ */}
      {trangThai === 'bi_tu_choi' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full rounded-2xl border border-orange-500/30 bg-[#0d1422] p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Không thể truy cập phòng học</h2>
            <p className="text-sm text-slate-400">
              {thongBaoLoiPhong || 'Bạn không có quyền truy cập vào phòng học này.'}
            </p>
            <Button
              onClick={onLeaveRoom}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-orange-500/20"
            >
              Quay lại Sảnh
            </Button>
          </div>
        </div>
      )}

      {/* ══ Slide upload modal ══ */}
      <SlideUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onLoadSlide={handleLoadSlide}
      />

      {/* ══ Moderation & Safety Dialogs ══ */}
      <KickMemberDialog
        open={Boolean(kickTarget)}
        onOpenChange={(open) => { if (!open) setKickTarget(null) }}
        target={kickTarget}
        onConfirmKick={handleConfirmKick}
      />

      <ReportUserDialog
        open={Boolean(reportTarget)}
        onOpenChange={(open) => { if (!open) setReportTarget(null) }}
        target={reportTarget}
        onConfirmReport={handleConfirmReport}
      />

      <BannedMembersDialog
        open={showBannedModal}
        onOpenChange={setShowBannedModal}
        onLoadBanned={listBannedMembers}
        onUnban={unbanMember}
      />

      {/* ══ Learning Session Panel & Summary Modal ══ */}
      <SessionPanel
        open={sessionPanelOpen}
        onOpenChange={setSessionPanelOpen}
        goal={sessionGoal}
        tasks={sessionTasks}
        completionMap={sessionTaskCompletions}
        timer={sessionTimer}
        serverClockOffset={serverClockOffset}
        poll={activePoll}
        voteCounts={pollVoteCounts}
        activeKeys={activeParticipantKeys}
        members={members}
        currentAccountId={nguoiDung.accountId}
        canControl={isHost || canModerate}
        sessionStartedAt={sessionStartedAt}
        onSetGoal={setGoal}
        onClearGoal={clearGoal}
        onAddTask={addTask}
        onRemoveTask={removeTask}
        onTickTask={tickTask}
        onUntickTask={untickTask}
        onStartTimer={startSessionTimer}
        onPauseTimer={pauseSessionTimer}
        onResetTimer={resetSessionTimer}
        onCreatePoll={createPoll}
        onVotePoll={votePoll}
        onClosePoll={closePoll}
        onStartSession={startSession}
        onEndSession={endSession}
      />

      <SessionSummaryModal
        summary={sessionSummary}
        open={sessionSummaryOpen}
        onOpenChange={setSessionSummaryOpen}
      />
    </div>
  )
}
