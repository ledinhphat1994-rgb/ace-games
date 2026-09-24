import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoom } from '@/hooks/use-room'
import type { NguoiDung } from '@/lib/api'
import { SUPPORTED_PLAYBACK_RATES, type SupportedPlaybackRate } from '@shared/protocol/room'
import {
  AlertCircle,
  Loader2,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useCampusContext } from '@/app/CampusContext'
import { FloatingCalculator } from './FloatingCalculator'
import { SlideUploadModal } from './SlideUploadModal'
import {
  KickMemberDialog,
  ReportUserDialog,
  BannedMembersDialog,
} from './ModerationDialogs'
import {
  SessionPanel,
  SessionSummaryModal,
} from './LearningSession'
import { StudyInviteDialog } from '@/features/engagement/StudyInviteDialog'
import { ClassroomWorkspace } from './workspace/ClassroomWorkspace'

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
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
    sharedNotes,
    notesConflict,
    resolveNotesConflict,
    chatMessages,
    latencyMs,
    myMic,
    syncMedia,
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
  const [showInviteModal, setShowInviteModal] = useState(false)

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

  // ── Window visibility & z-index ──────────────────────────────────────────
  const [calcZ, setCalcZ] = useState(39)
  const [showCalc, setShowCalc] = useState(false)

  // ── Popover panels above dock ────────────────────────────────────────────
  const [showYtPanel, setShowYtPanel] = useState(false)

  // ── Modals ───────────────────────────────────────────────────────────────
  const [showUploadModal, setShowUploadModal] = useState(false)

  // ── Video volume ─────────────────────────────────────────────────────────
  const [volume, setVolume] = useState(80)

  // ── Form state ───────────────────────────────────────────────────────────
  const [directYtInput, setDirectYtInput] = useState('')
  const [localNotes, setLocalNotes] = useState(sharedNotes.content)

  // ── YouTube search state ──────────────────────────────────────────────────────
  const [ytTab, setYtTab] = useState<'paste' | 'search'>('paste')
  const [ytSearch, setYtSearch] = useState('')
  const [ytSearching, setYtSearching] = useState(false)
  const [ytResults, setYtResults] = useState<{ videoId: string; title: string; author: string }[]>([])

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

  // ── Refs ─────────────────────────────────────────────────────────────────
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

  const handleLoadSlide = (docUrl: string, docName: string, fileType: 'pptx' | 'pdf' | 'image', totalPages: number, docId?: number) => {
    loadSlideDoc(docUrl, docName, fileType, totalPages, docId)
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
    setShowYtPanel(false)
    setYtResults([])
    toast.success(`Đang phát: ${title.slice(0, 40)}…`)
  }

  const bringCalcToFront = () => setCalcZ(nextZIndex())

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-svh w-full overflow-hidden select-none">
      <ClassroomWorkspace
        roomId={roomId}
        roomTitle={tenChuPhong ? `Phòng của ${tenChuPhong}` : `Phòng học #${numericRoomId || roomId}`}
        nguoiDung={nguoiDung}
        isHost={isHost}
        canModerate={canModerate}
        hostKey={hostKey}
        members={members}
        trangThai={trangThai}
        latencyMs={latencyMs}
        slideState={slideState}
        onPageChange={changeSlidePage}
        onUploadSlide={() => setShowUploadModal(true)}
        onCloseDoc={isHost || canModerate ? closeSlideDoc : undefined}
        mediaState={mediaState}
        canControlMedia={canControlMedia}
        volume={volume}
        onVolumeChange={setVolume}
        onSyncMedia={handleSyncMedia}
        onOpenSearchQueue={() => setShowYtPanel(true)}
        calculateTargetTime={calculateTargetTime}
        whiteboardStrokes={whiteboardStrokes}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        selectedSize={selectedSize}
        onSelectSize={setSelectedSize}
        isEraser={isEraser}
        onToggleEraser={() => setIsEraser((v) => !v)}
        onSendStroke={sendStroke}
        onClearWhiteboard={clearWhiteboard}
        myMic={myMic}
        onToggleMic={() => {
          if (voiceState.blockedReason) {
            toast.warning(voiceState.blockedReason)
          }
          toggleMic().catch((err) => {
            toast.error(err.message || 'Lỗi bật/tắt micro.')
          })
        }}
        voiceState={voiceState}
        audioInputs={audioInputs}
        audioOutputs={audioOutputs}
        isSinkIdSupported={isSinkIdSupported}
        onSetAudioInput={(id) => setAudioInputDevice(id).catch(() => {})}
        onSetAudioOutput={(id) => setAudioOutputDevice(id).catch(() => {})}
        onRefreshDevices={refreshDevices}
        chatMessages={chatMessages}
        onSendChat={async (text) => {
          sendRoomChat(text)
          return true
        }}
        onReportMessage={(target) => setReportTarget(target)}
        onForceMute={(key) => forceMuteMember(key).catch((err) => toast.error(err.message))}
        onKickMember={(target) => setKickTarget(target)}
        onReportUser={(target) => setReportTarget(target)}
        onOpenInvite={() => setShowInviteModal(true)}
        onOpenBannedList={() => setShowBannedModal(true)}
        sharedNotes={sharedNotes}
        localNotes={localNotes}
        onChangeNotes={handleNotesChange}
        notesConflict={notesConflict}
        onResolveNotesConflict={resolveNotesConflict}
        onOpenCalculator={() => setShowCalc((v) => !v)}
        onOpenSessionPanel={() => setSessionPanelOpen((v) => !v)}
        onLeaveRoom={onLeaveRoom}
      />

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
            className="h-7 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 rounded-xl shadow-md cursor-pointer"
          >
            Bật âm thanh
          </Button>
        </div>
      )}

      {/* ══ Calculator floating window ══ */}
      {showCalc && (
        <FloatingCalculator
          zIndex={calcZ}
          onFocus={bringCalcToFront}
          onClose={() => setShowCalc(false)}
        />
      )}

      {/* ══ YouTube search/paste modal with clean backdrop ══ */}
      {showYtPanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0d1424]/98 shadow-2xl backdrop-blur-2xl ring-1 ring-red-500/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <YoutubeIcon className="h-5 w-5 text-red-500" />
                <span className="text-sm font-bold text-white">Chèn Video YouTube</span>
              </div>
              <button
                type="button"
                onClick={() => setShowYtPanel(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-slate-900/60">
              <button
                type="button"
                onClick={() => setYtTab('paste')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  ytTab === 'paste' ? 'border-b-2 border-red-500 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔗 Dán link
              </button>
              <button
                type="button"
                onClick={() => setYtTab('search')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  ytTab === 'search' ? 'border-b-2 border-red-500 text-white' : 'text-slate-400 hover:text-slate-200'
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
                <Button type="submit" className="h-9 bg-red-600 hover:bg-red-500 px-4 font-bold text-xs cursor-pointer">
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
                  <Button type="submit" disabled={ytSearching} className="h-9 bg-red-600 hover:bg-red-500 px-3 cursor-pointer">
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
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/8 text-left transition-colors cursor-pointer"
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
        </div>
      )}

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
          <div className={`max-w-md w-full rounded-2xl border p-6 shadow-2xl text-center space-y-4 ${
            roomClosedInfo
              ? 'border-amber-500/30 bg-[#0d1422]'
              : 'border-orange-500/30 bg-[#0d1422]'
          }`}>
            <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
              roomClosedInfo
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-orange-500/10 text-orange-400'
            }`}>
              <ShieldAlert className="h-6 w-6" />
            </div>
            {roomClosedInfo ? (
              <>
                <h2 className="text-lg font-bold text-white">Phòng học đã được đóng</h2>
                <p className="text-sm text-slate-400">{roomClosedInfo.message}</p>
                <p className="text-xs text-slate-500">
                  Lý do: {roomClosedInfo.reason === 'admin_closed' ? 'Quản trị viên đóng phòng'
                    : roomClosedInfo.reason === 'owner_closed' ? 'Chủ phòng đóng phòng'
                    : roomClosedInfo.reason === 'never_joined_timeout' ? 'Phòng không có ai tham gia'
                    : roomClosedInfo.reason === 'empty_room_timeout' ? 'Phòng đã trống quá lâu'
                    : roomClosedInfo.reason === 'max_lifetime_exceeded' ? 'Phòng quá thời gian hoạt động'
                    : roomClosedInfo.reason}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-white">Không thể truy cập phòng học</h2>
                <p className="text-sm text-slate-400">
                  {thongBaoLoiPhong || 'Bạn không có quyền truy cập vào phòng học này.'}
                </p>
              </>
            )}
            <Button
              onClick={onLeaveRoom}
              className={`w-full text-white font-semibold py-2.5 rounded-xl shadow-lg ${
                roomClosedInfo
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'
                  : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'
              }`}
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
        roomId={roomId}
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

      <StudyInviteDialog
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        roomId={numericRoomId || 1}
        roomTitle={tenChuPhong ? `Phòng của ${tenChuPhong}` : `Phòng học #${numericRoomId || 1}`}
      />
    </div>
  )
}
