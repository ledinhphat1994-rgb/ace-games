import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useRoom } from '@/hooks/use-room'
import type { NguoiDung } from '@/lib/api'
import { SUPPORTED_PLAYBACK_RATES, type SupportedPlaybackRate } from '@shared/protocol/room'
import {
  AlertCircle,
  DoorClosed,
  Loader2,
  Lock,
  Play,
  Search,
  ShieldAlert,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
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
import { useScreenWakeLock } from '@/lib/web-experience'

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

/** Lý do đóng phòng máy chủ gửi về (giữ cả tên cũ để phòng cũ vẫn hiển thị đúng). */
const LY_DO_DONG_PHONG: Record<string, string> = {
  admin_closed: 'Quản trị viên đã đóng phòng.',
  owner_closed: 'Chủ phòng đã đóng phòng.',
  never_joined_timeout: 'Không có ai vào phòng trong thời gian quy định.',
  empty_timeout: 'Phòng đã trống quá lâu.',
  empty_room_timeout: 'Phòng đã trống quá lâu.',
  max_lifetime: 'Phòng đã mở quá thời lượng tối đa.',
  max_lifetime_exceeded: 'Phòng đã mở quá thời lượng tối đa.',
}

/** Màn chặn giữa màn hình khi không thể ở lại phòng (đã đóng, bị từ chối, cần nhập lại mật khẩu). */
function ManChanPhong({
  icon: Icon,
  tone,
  title,
  text,
  onLeave,
}: {
  icon: ComponentType<{ className?: string }>
  tone: 'warning' | 'destructive' | 'muted'
  title: string
  text: string
  onLeave: () => void
}) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[3px]">
      <div
        role="alertdialog"
        aria-labelledby="man-chan-phong-tieu-de"
        className="w-full max-w-sm rounded-2xl border border-border-default bg-surface p-6 text-center shadow-2xl"
      >
        <span
          className={
            tone === 'warning'
              ? 'mx-auto flex size-11 items-center justify-center rounded-2xl bg-warning/12 text-warning'
              : tone === 'destructive'
                ? 'mx-auto flex size-11 items-center justify-center rounded-2xl bg-destructive/12 text-destructive'
                : 'mx-auto flex size-11 items-center justify-center rounded-2xl bg-surface-overlay text-text-secondary'
          }
        >
          <Icon className="size-5" />
        </span>
        <h2 id="man-chan-phong-tieu-de" className="mt-4 text-base font-semibold text-text-primary">
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed break-words text-text-secondary">{text}</p>
        <Button className="mt-5 w-full" onClick={onLeave}>
          Về danh sách phòng
        </Button>
      </div>
    </div>
  )
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
    removeStroke,
    stageLayout,
    daNhanAnhChup,
    sendStageLayout,
    stageLasers,
    sendStageLaser,
    quyenCongCu,
    sendToolGrants,
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
    slideAnnotations,
    slideLasers,
    changeSlidePage,
    setSlideTotalPages,
    loadSlideDoc,
    closeSlideDoc,
    sendSlideAnnotation,
    clearSlideAnnotations,
    removeSlideAnnotation,
    sendSlideLaser,
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

  // Giữ màn hình sáng trong suốt buổi học tập / thuyết trình / xem video
  useScreenWakeLock(trangThai === 'da_ket_noi' && !roomClosedInfo)

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
  const [localNotes, setLocalNotes] = useState(sharedNotes.content)

  // ── YouTube unified search / link state ──────────────────────────────────────
  const [ytSearch, setYtSearch] = useState('')
  const detectedVideoId = useMemo(() => trichXuatYoutubeId(ytSearch), [ytSearch])
  const [ytSearching, setYtSearching] = useState(false)
  const [ytResults, setYtResults] = useState<{ videoId: string; title: string; author: string; duration?: string }[]>([])
  const [ytDaTim, setYtDaTim] = useState('')
  const [ytLoi, setYtLoi] = useState<string | null>(null)

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
  const { setActivity, rooms: phongTrenSanh } = useCampusContext()
  const numericRoomId = useMemo(() => {
    const num = parseInt(roomId.replace('phong-', ''), 10)
    return isNaN(num) ? undefined : num
  }, [roomId])

  // Tên thật của phòng lấy từ danh sách phòng trên sảnh (snapshot RoomDO không kèm tên);
  // chỉ khi sảnh chưa có phòng này mới tạm gọi theo tên chủ phòng.
  const tieuDePhong = useMemo(() => {
    const tenThat = numericRoomId ? phongTrenSanh.find((p) => p.id === numericRoomId)?.ten?.trim() : undefined
    if (tenThat) return tenThat
    return tenChuPhong ? `Phòng của ${tenChuPhong}` : `Phòng học #${numericRoomId ?? roomId}`
  }, [phongTrenSanh, numericRoomId, tenChuPhong, roomId])

  useEffect(() => {
    if (numericRoomId) {
      setActivity({
        type: 'room',
        roomId: numericRoomId,
        roomTitle: tieuDePhong,
      })
    }
    return () => {
      setActivity(null)
    }
  }, [numericRoomId, tieuDePhong, setActivity])

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

  // Nhiều video (MV, nội dung có bản quyền) bị chủ sở hữu tắt phát trên trang khác: hỏi máy chủ trước khi chèn.
  const [ytDangKiemTra, setYtDangKiemTra] = useState(false)
  const choPhepNhung = async (vid: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/yt-check?id=${encodeURIComponent(vid)}`, { credentials: 'same-origin' })
      if (!res.ok) return true
      const { nhung } = (await res.json()) as { nhung?: string }
      return nhung !== 'khong'
    } catch {
      return true
    }
  }

  const handlePlayVideo = async (e?: React.FormEvent, customVid?: string) => {
    if (e) e.preventDefault()
    const vid = customVid || trichXuatYoutubeId(ytSearch)
    if (!vid) {
      if (ytSearch.trim()) void doYtSearch(ytSearch)
      return
    }
    setYtDangKiemTra(true)
    const duoc = await choPhepNhung(vid)
    setYtDangKiemTra(false)
    if (!duoc) {
      toast.error('Chủ sở hữu video này chặn phát trên trang khác (chỉ xem được trên YouTube). Hãy chọn video khác.')
      return
    }
    syncMedia({ action: 'load', videoId: vid, title: `Bài giảng (${vid})` })
    syncMedia({ action: 'play' })
    setYtSearch('')
    setYtResults([])
    setYtDaTim('')
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

  // Kết quả / lỗi hiển thị ngay trong hộp thoại (trước đây vừa toast vừa báo "không có kết quả" khi mới gõ chưa tìm)
  const doYtSearch = async (q: string) => {
    const tuKhoa = q.trim()
    if (!tuKhoa) return
    setYtSearching(true)
    setYtLoi(null)
    setYtResults([])
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(tuKhoa)}`)
      if (res.ok) {
        const data = await res.json() as { videoId: string; title: string; author: string; duration?: string }[]
        setYtResults(Array.isArray(data) ? data : [])
      } else {
        setYtLoi('Chưa tìm được lúc này. Hãy dán link video trực tiếp.')
      }
    } catch {
      setYtLoi('Lỗi kết nối khi tìm. Hãy dán link video trực tiếp.')
    } finally {
      setYtDaTim(tuKhoa)
      setYtSearching(false)
    }
  }

  const handlePickYtVideo = (videoId: string, title: string) => {
    syncMedia({ action: 'load', videoId, title })
    syncMedia({ action: 'play' })
    setShowYtPanel(false)
    setYtResults([])
    setYtDaTim('')
    toast.success(`Đang phát: ${title}`)
  }

  const bringCalcToFront = () => setCalcZ(nextZIndex())

  const handleCloseRoom = useCallback(async () => {
    const cleanRoomId = roomId ? roomId.replace('phong-', '') : ''
    if (!cleanRoomId) return
    const res = await fetch(`/api/rooms/${cleanRoomId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ reason: 'owner_closed' }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      loi?: string
      error?: string
      message?: string
    }
    if (res.ok && data.ok) {
      toast.success('Đã hủy phòng học.')
      onLeaveRoom()
    } else {
      const msg = data.loi || data.error || data.message || 'Không thể hủy phòng học.'
      toast.error(msg)
      throw new Error(msg)
    }
  }, [roomId, onLeaveRoom])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-svh w-full overflow-hidden select-none">
      <ClassroomWorkspace
        roomId={roomId}
        roomTitle={tieuDePhong}
        nguoiDung={nguoiDung}
        isHost={isHost}
        canModerate={canModerate}
        hostKey={hostKey}
        members={members}
        trangThai={trangThai}
        latencyMs={latencyMs}
        stageLayout={stageLayout}
        daNhanAnhChup={daNhanAnhChup}
        onSendStageLayout={isHost || canModerate ? sendStageLayout : undefined}
        stageLasers={stageLasers}
        onSendStageLaser={sendStageLaser}
        quyenCongCu={quyenCongCu}
        onGrantTools={sendToolGrants}
        slideState={slideState}
        onPageChange={changeSlidePage}
        onUploadSlide={() => setShowUploadModal(true)}
        onCloseDoc={isHost || canModerate ? closeSlideDoc : undefined}
        onSetTotalPages={isHost || canModerate ? setSlideTotalPages : undefined}
        slideAnnotations={slideAnnotations}
        onSendSlideAnnotation={sendSlideAnnotation}
        onClearSlideAnnotations={isHost || canModerate ? clearSlideAnnotations : undefined}
        onRemoveSlideAnnotation={removeSlideAnnotation}
        slideLasers={slideLasers}
        onSendSlideLaser={sendSlideLaser}
        mediaState={mediaState}
        canControlMedia={canControlMedia}
        volume={volume}
        onVolumeChange={setVolume}
        onSyncMedia={handleSyncMedia}
        onOpenSearchQueue={() => setShowYtPanel(true)}
        calculateTargetTime={calculateTargetTime}
        whiteboardStrokes={whiteboardStrokes}
        onSendStroke={sendStroke}
        onRemoveStroke={removeStroke}
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
        onCloseRoom={isHost || canModerate ? handleCloseRoom : undefined}
      />

      {/* ══ Autoplay unblock notification banner ══ */}
      {voiceState.isAudioAutoplayBlocked && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-[#1c1a14]/95 px-4 py-2 shadow-2xl backdrop-blur-md">
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

      {/* ══ YouTube: tìm bài giảng hoặc dán link trực tiếp ══ */}
      <Dialog open={showYtPanel} onOpenChange={setShowYtPanel}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl max-w-[96vw] w-full p-5 sm:p-7">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-3 text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              <YoutubeIcon className="size-8 sm:size-9 shrink-0 text-red-500" />
              Chèn video YouTube
            </DialogTitle>
          </DialogHeader>

          {/* Thanh tìm kiếm hợp nhất: tìm bài giảng hoặc dán link video */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (detectedVideoId) {
                void handlePlayVideo(undefined, detectedVideoId)
              } else {
                void doYtSearch(ytSearch)
              }
            }}
            className="flex gap-2.5 pt-1"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-tertiary" />
              <Input
                value={ytSearch}
                onChange={(e) => setYtSearch(e.target.value)}
                placeholder="Tìm kiếm bài giảng hoặc dán link YouTube..."
                aria-label="Tìm kiếm hoặc dán link YouTube"
                autoComplete="off"
                enterKeyHint="search"
                className="h-12 pl-11 pr-4 text-sm sm:text-base bg-surface-overlay/80 border-border-default rounded-xl focus:border-brand"
              />
            </div>
            <Button
              type="submit"
              className="h-12 px-6 rounded-xl font-semibold gap-2 shrink-0 bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-md transition-all"
              disabled={!ytSearch.trim() || ytSearching || ytDangKiemTra}
              aria-label={detectedVideoId ? 'Chèn video' : 'Tìm kiếm'}
            >
              {ytDangKiemTra || ytSearching ? (
                <Loader2 className="animate-spin size-4" />
              ) : detectedVideoId ? (
                <Play className="size-4 fill-white" />
              ) : (
                <Search className="size-4" />
              )}
              <span>
                {ytDangKiemTra
                  ? 'Đang kiểm tra...'
                  : ytSearching
                    ? 'Đang tìm...'
                    : detectedVideoId
                      ? 'Chèn video'
                      : 'Tìm kiếm'}
              </span>
            </Button>
          </form>

          {/* Vùng nội dung: Xem trước khi dán link, hoặc danh sách kết quả dạng lưới */}
          <div className="h-[58vh] min-h-[360px] max-h-[560px] flex flex-col min-h-0" data-testid="yt-dialog-body">
            {detectedVideoId ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-xl border border-white/10 group">
                  <img
                    src={`https://i.ytimg.com/vi/${detectedVideoId}/mqdefault.jpg`}
                    alt="Xem trước video"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-all">
                    <button
                      type="button"
                      onClick={() => void handlePlayVideo(undefined, detectedVideoId)}
                      className="size-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      title="Phát ngay"
                    >
                      <Play className="size-6 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>
                <h4 className="mt-4 text-base font-bold text-text-primary">
                  Mã video: {detectedVideoId}
                </h4>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => void handlePlayVideo(undefined, detectedVideoId)}
                    disabled={ytDangKiemTra}
                    className="h-10 px-6 rounded-xl font-semibold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-md"
                  >
                    {ytDangKiemTra ? <Loader2 className="animate-spin size-4" /> : <Play className="size-4 fill-white" />}
                    <span>Phát video ngay</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setYtSearch('')}
                    className="h-10 px-4 rounded-xl cursor-pointer"
                  >
                    Xoá
                  </Button>
                </div>
              </div>
            ) : ytSearching ? (
              <div className="flex h-full flex-col items-center justify-center gap-2.5 text-sm text-text-tertiary">
                <Loader2 className="size-6 animate-spin text-red-500" />
                <span>Đang tìm kiếm…</span>
              </div>
            ) : ytLoi ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <AlertCircle className="size-7 text-destructive" />
                <p className="mt-2 text-sm font-medium text-text-primary">{ytLoi}</p>
              </div>
            ) : ytResults.length > 0 ? (
              <div className="flex flex-col h-full min-h-0 pt-2">
                <ul className="min-h-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto overscroll-contain pr-1.5 py-1">
                  {ytResults.map((v) => (
                    <li key={v.videoId}>
                      <button
                        type="button"
                        data-video-id={v.videoId}
                        onClick={() => handlePickYtVideo(v.videoId, v.title)}
                        className="group flex w-full flex-col sm:flex-row items-start gap-3 rounded-xl p-2.5 text-left border border-border-default/60 bg-surface-raised/40 hover:bg-surface-raised hover:border-brand/40 hover:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        <div className="relative aspect-video w-full sm:w-44 shrink-0 overflow-hidden rounded-lg bg-surface-overlay group-hover:brightness-105 transition-all">
                          <img
                            src={`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`}
                            alt=""
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {v.duration && (
                            <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/85 backdrop-blur-sm px-1.5 py-0.5 text-[11px] font-semibold text-white shadow">
                              {v.duration}
                            </span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="size-9 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                              <Play className="size-4 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-between h-full py-0.5">
                          <h4 className="text-xs sm:text-[13px] leading-snug font-semibold text-text-primary line-clamp-2 group-hover:text-brand transition-colors">
                            {v.title}
                          </h4>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-text-tertiary">
                            <span className="truncate font-medium">{v.author || 'YouTube'}</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : ytDaTim ? (
              <p className="flex h-full items-center justify-center px-4 text-center text-sm text-text-tertiary">
                Không tìm thấy video nào cho “{ytDaTim}”.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ Re-admission modal on password admission expiry ══ */}
      {trangThai === 'can_xac_thuc_lai' && (
        <ManChanPhong
          icon={Lock}
          tone="warning"
          title="Cần nhập lại mật khẩu phòng"
          text="Quyền vào phòng có mật khẩu của bạn đã hết hạn. Hãy quay lại danh sách phòng và nhập mật khẩu để vào tiếp."
          onLeave={onLeaveRoom}
        />
      )}

      {/* ══ Permanent room denial modal (banned / wrong class / room closed) ══ */}
      {trangThai === 'bi_tu_choi' &&
        (roomClosedInfo ? (
          <ManChanPhong
            icon={DoorClosed}
            tone="muted"
            title="Phòng học đã đóng"
            // Thông điệp máy chủ đã nêu lý do; chỉ khi thiếu mới dịch mã lý do (trước đây hiện nguyên mã như "empty_timeout")
            text={
              roomClosedInfo.message ||
              LY_DO_DONG_PHONG[roomClosedInfo.reason] ||
              'Phòng này không còn hoạt động.'
            }
            onLeave={onLeaveRoom}
          />
        ) : (
          <ManChanPhong
            icon={ShieldAlert}
            tone="destructive"
            title="Không vào được phòng học"
            text={thongBaoLoiPhong || 'Bạn không có quyền vào phòng học này.'}
            onLeave={onLeaveRoom}
          />
        ))}

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
        roomTitle={tieuDePhong}
      />
    </div>
  )
}
