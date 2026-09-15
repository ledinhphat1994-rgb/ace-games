import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoom } from '@/hooks/use-room'
import type { NguoiDung } from '@/lib/api'
import {
  ArrowLeft,
  Calculator as CalcIcon,
  Crown,
  Eraser,
  FileText,
  Mic,
  MicOff,
  Pause,
  PenTool,
  Play,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChalkboardCanvas } from './ChalkboardCanvas'
import { FloatingCalculator } from './FloatingCalculator'
import { FloatingSlidePanel } from './FloatingSlidePanel'
import { FloatingVideoPlayer } from './FloatingVideoPlayer'
import { SlideUploadModal } from './SlideUploadModal'

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
    members,
    hostKey,
    isHost,
    mediaState,
    pomodoroState,
    whiteboardStrokes,
    sharedNotes,
    chatMessages,
    latencyMs,
    myMic,
    syncMedia,
    togglePomodoro,
    sendStroke,
    clearWhiteboard,
    updateNotes,
    addToQueue,
    playFromQueue,
    sendRoomChat,
    toggleMic,
    slideState,
    changeSlidePage,
    loadSlideDoc,
    closeSlideDoc,
    calculateTargetTime,
  } = useRoom(roomId, nguoiDung.actorKey)

  // ── Chalk tool state (lifted from canvas, controlled by bottom dock) ──────
  const [selectedColor, setSelectedColor] = useState('#FFFFFF')
  const [selectedSize, setSelectedSize] = useState(6)
  const [isEraser, setIsEraser] = useState(false)

  // ── Window visibility & z-index ──────────────────────────────────────────
  const [youtubeZ, setYoutubeZ] = useState(41)
  const [slideZ, setSlideZ] = useState(40)
  const [calcZ, setCalcZ] = useState(39)

  const [showYoutube, setShowYoutube] = useState(false)
  const [showSlide, setShowSlide] = useState(false)
  const [showCalc, setShowCalc] = useState(false)

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
  const [directYtInput, setDirectYtInput] = useState('')
  const [localNotes, setLocalNotes] = useState(sharedNotes.content)

  // ── Pomodoro countdown ───────────────────────────────────────────────────
  const [pomoRemaining, setPomoRemaining] = useState(pomodoroState.remaining)
  const [prevPomo, setPrevPomo] = useState(pomodoroState)
  if (
    pomodoroState.endsAt !== prevPomo.endsAt ||
    pomodoroState.remaining !== prevPomo.remaining ||
    pomodoroState.running !== prevPomo.running
  ) {
    setPrevPomo(pomodoroState)
    setPomoRemaining(pomodoroState.remaining)
  }

  // ── Sync notes ───────────────────────────────────────────────────────────
  const [prevNotesTime, setPrevNotesTime] = useState(sharedNotes.updatedAt)
  if (sharedNotes.updatedAt !== prevNotesTime) {
    setPrevNotesTime(sharedNotes.updatedAt)
    setLocalNotes(sharedNotes.content)
  }

  // ── Auto-show youtube window when a video starts ─────────────────────────
  const [prevVideoId, setPrevVideoId] = useState(mediaState.videoId)
  if (mediaState.videoId !== prevVideoId) {
    setPrevVideoId(mediaState.videoId)
    if (mediaState.videoId) setShowYoutube(true)
  }

  // ── Auto-show slide window when slide loads ───────────────────────────────
  const [prevSlideId, setPrevSlideId] = useState(slideState?.docUrl)
  if (slideState?.docUrl !== prevSlideId) {
    setPrevSlideId(slideState?.docUrl)
    if (slideState) setShowSlide(true)
  }

  // ── Refs ─────────────────────────────────────────────────────────────────
  const chatRef = useRef<HTMLDivElement | null>(null)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [chatMessages.length])

  useEffect(() => {
    if (!pomodoroState.running || pomodoroState.endsAt <= 0) return
    const update = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.round((pomodoroState.endsAt - now) / 1000))
      setPomoRemaining(remaining)
      if (remaining <= 0 && isHost) {
        const next = pomodoroState.mode === 'focus' ? 'break' : 'focus'
        togglePomodoro({ action: 'switch_mode', mode: next })
        toast.info(next === 'focus' ? 'Bắt đầu phiên tập trung mới!' : 'Đến giờ nghỉ ngơi rồi!')
      }
    }
    const t = setInterval(update, 500)
    return () => clearInterval(t)
  }, [pomodoroState.running, pomodoroState.endsAt, pomodoroState.mode, isHost, togglePomodoro])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const tenChuPhong = useMemo(() => members.find((m) => m.key === hostKey)?.ten || 'Chủ phòng', [members, hostKey])

  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    sendRoomChat(text)
    setChatInput('')
  }

  const handleNotesChange = (text: string) => {
    setLocalNotes(text)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => updateNotes(text), 600)
  }

  const handlePlayVideo = (e: React.FormEvent) => {
    e.preventDefault()
    const vid = trichXuatYoutubeId(directYtInput)
    if (!vid) { toast.error('Link YouTube không hợp lệ.'); return }
    addToQueue(vid, `Bài giảng (${vid})`)
    playFromQueue(`queue_${vid}`)
    syncMedia({ action: 'play', time: 0 })
    setDirectYtInput('')
    setShowYtPanel(false)
    setShowYoutube(true)
    toast.success('Đã mở video YouTube lên bảng đen!')
  }

  const handleSyncMedia = (action: 'play' | 'pause' | 'seek', time: number) => {
    syncMedia({ action, time })
  }

  const handleLoadSlide = (docUrl: string, docName: string, fileType: 'pptx' | 'pdf' | 'image', totalPages: number) => {
    loadSlideDoc(docUrl, docName, fileType, totalPages)
    setShowSlide(true)
    setShowUploadModal(false)
  }

  const bringYoutubeToFront = () => setYoutubeZ(nextZIndex())
  const bringSlideToFront = () => setSlideZ(nextZIndex())
  const bringCalcToFront = () => setCalcZ(nextZIndex())

  const isOnline = trangThai === 'da_ket_noi'
  const unreadChat = chatMessages.length > 0 ? chatMessages.length : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-svh w-full overflow-hidden select-none">
      {/* ══ LAYER 0: Full-screen blackboard canvas ══ */}
      <div className="absolute inset-0">
        <ChalkboardCanvas
          strokes={whiteboardStrokes}
          selectedColor={selectedColor}
          selectedSize={selectedSize}
          isEraser={isEraser}
          onSendStroke={sendStroke}
        />
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
            <span
              className={`text-[10px] font-bold uppercase tracking-widest ${
                pomodoroState.mode === 'focus' ? 'text-emerald-300' : 'text-sky-300'
              }`}
            >
              {pomodoroState.mode === 'focus' ? 'Tập trung' : 'Nghỉ ngơi'}
            </span>
            <span
              className={`font-mono text-base font-black tabular-nums ${
                pomodoroState.mode === 'focus' ? 'text-emerald-200' : 'text-sky-200'
              }`}
            >
              {dinhDangGiayPhut(pomoRemaining)}
            </span>
            {isHost && (
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

        {/* Right: Members count + Mic */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowMembers(v => !v); setShowChat(false) }}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300 hover:bg-white/10 transition-colors"
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold">{members.length}</span>
          </button>

          <button
            onClick={toggleMic}
            className={`rounded-full p-2 transition-colors ${
              myMic ? 'bg-emerald-600/80 text-white hover:bg-emerald-500' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
            title={myMic ? 'Tắt mic' : 'Bật mic'}
          >
            {myMic ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          {isHost && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              HOST
            </span>
          )}
        </div>
      </header>

      {/* ══ LAYER 2: Floating windows ══ */}

      {/* YouTube floating player */}
      {showYoutube && mediaState.videoId ? (
        <div className="absolute" style={{ zIndex: youtubeZ, top: 70, left: 60 }} onClick={bringYoutubeToFront}>
          <FloatingVideoPlayer
            mediaState={mediaState}
            isHost={isHost}
            volume={volume}
            onVolumeChange={setVolume}
            onSyncMedia={handleSyncMedia}
            onOpenSearchQueue={() => setShowYtPanel(true)}
            onClose={() => setShowYoutube(false)}
            calculateTargetTime={calculateTargetTime}
          />
        </div>
      ) : null}

      {/* Slide floating panel */}
      {showSlide && slideState ? (
        <FloatingSlidePanel
          slideState={slideState}
          isHost={isHost}
          zIndex={slideZ}
          onFocus={bringSlideToFront}
          onClose={() => { setShowSlide(false); closeSlideDoc() }}
          onChangeSlidePage={changeSlidePage}
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
            <button onClick={() => setShowChat(false)} className="rounded p-1 text-slate-400 hover:text-white">
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
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${
                        isMe
                          ? 'rounded-tr-sm bg-indigo-600/90 text-white'
                          : 'rounded-tl-sm bg-white/8 text-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form
            onSubmit={handleSendChat}
            className="flex items-center gap-2 border-t border-white/10 p-3"
          >
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Nhắn tin..."
              className="flex-1 h-8 border-white/15 bg-white/8 text-xs text-white placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat() } }}
            />
            <Button type="submit" size="sm" className="h-8 w-8 shrink-0 p-0 bg-indigo-600 hover:bg-indigo-500">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      ) : null}

      {/* ══ Members drawer ══ */}
      {showMembers ? (
        <div className="absolute right-0 top-12 bottom-20 z-50 flex w-72 flex-col overflow-hidden border-l border-white/10 bg-[#090e18]/97 backdrop-blur-2xl shadow-2xl">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <span className="text-sm font-bold text-slate-200">👥 Thành viên ({members.length})</span>
            <button onClick={() => setShowMembers(false)} className="rounded p-1 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {members.map((m) => (
              <div key={m.key} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/60 text-sm font-bold text-white">
                  {m.ten.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-200">{m.ten}</p>
                  {m.key === hostKey && (
                    <p className="text-[10px] text-amber-400">Chủ phòng</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Shared notes */}
          <div className="border-t border-white/10 p-3">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">📝 Ghi chú chung</p>
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

      {/* ══ YouTube URL panel (above dock) ══ */}
      {showYtPanel ? (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 w-96 rounded-2xl border border-white/15 bg-[#0d1424]/97 p-4 shadow-2xl backdrop-blur-2xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <YoutubeIcon className="h-5 w-5 text-red-500" />
              <span className="text-sm font-bold text-slate-200">Chèn Video YouTube</span>
            </div>
            <button onClick={() => setShowYtPanel(false)} className="rounded p-1 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handlePlayVideo} className="flex gap-2">
            <Input
              value={directYtInput}
              onChange={(e) => setDirectYtInput(e.target.value)}
              placeholder="Dán link YouTube hoặc mã video..."
              className="flex-1 h-9 border-white/15 bg-white/8 text-sm text-white placeholder:text-slate-600 focus-visible:ring-red-500/40"

            />
            <Button type="submit" className="h-9 bg-red-600 hover:bg-red-500 px-4 font-bold">
              Chèn
            </Button>
          </form>
          <p className="mt-2 text-[10px] text-slate-600">
            Video sẽ đồng bộ phát/dừng cho toàn bộ học sinh trong phòng.
          </p>
        </div>
      ) : null}

      {/* ══ LAYER 4: Bottom floating dock ══ */}
      <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[#0b1020]/92 px-2 py-1.5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/8">

          {/* Chalk tool indicator */}
          <div className="flex items-center gap-0.5 pr-1">
            <PenTool className={`h-4 w-4 ${isEraser ? 'text-slate-600' : 'text-emerald-400'}`} />
          </div>

          {/* Chalk colors */}
          {CHALK_COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => { setSelectedColor(c.color); setIsEraser(false) }}
              style={{ backgroundColor: c.color }}
              className={`h-5 w-5 rounded-full transition-all duration-150 ${
                !isEraser && selectedColor === c.color
                  ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-[#0b1020]'
                  : 'opacity-60 hover:opacity-90 hover:scale-110'
              }`}
              title={c.name}
            />
          ))}

          {/* Chalk sizes */}
          <div className="flex items-center gap-0.5 border-l border-white/10 pl-1 ml-0.5">
            {CHALK_SIZES.map((s) => (
              <button
                key={s.size}
                onClick={() => { setSelectedSize(s.size); setIsEraser(false) }}
                className={`h-7 min-w-[24px] rounded-lg px-1.5 text-[10px] font-bold transition-colors ${
                  !isEraser && selectedSize === s.size
                    ? 'bg-emerald-500/90 text-black'
                    : 'text-emerald-400 hover:bg-white/8'
                }`}
                title={s.label}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Eraser */}
          <button
            onClick={() => setIsEraser(v => !v)}
            className={`ml-0.5 flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors ${
              isEraser ? 'bg-amber-500 text-black' : 'text-slate-400 hover:bg-white/8 hover:text-white'
            }`}
            title="Tẩy phấn"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>

          {/* Clear board */}
          {isHost && (
            <button
              onClick={clearWhiteboard}
              className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Xóa toàn bộ bảng"
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
            onClick={() => setShowUploadModal(true)}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              showSlide ? 'bg-orange-600/80 text-white' : 'text-orange-400 hover:bg-orange-600/20'
            }`}
            title="Tải bài giảng Slide / PDF"
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
            onClick={() => { setShowChat(v => !v); setShowMembers(false) }}
            className={`relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              showChat ? 'bg-indigo-600/80 text-white' : 'text-indigo-400 hover:bg-indigo-600/20'
            }`}
            title="Chat phòng học"
          >
            <span className="text-base leading-none">💬</span>
            {chatMessages.length > 0 && !showChat && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-black text-white">
                {Math.min(unreadChat, 99)}
              </span>
            )}
            <span className="hidden sm:inline">Chat</span>
          </button>

          {/* Members button */}
          <button
            onClick={() => { setShowMembers(v => !v); setShowChat(false) }}
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

      {/* ══ Slide upload modal ══ */}
      <SlideUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onLoadSlide={handleLoadSlide}
      />
    </div>
  )
}
