import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRoom } from '@/hooks/use-room'
import type { NguoiDung } from '@/lib/api'
import {
  ArrowLeft,
  Calculator as CalcIcon,
  Crown,
  FileSpreadsheet,
  FileText,
  ListVideo,
  MessageSquare,
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
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}
import { ChalkboardCanvas } from './ChalkboardCanvas'
import { FloatingVideoPlayer } from './FloatingVideoPlayer'
import { SlideUploadModal } from './SlideUploadModal'
import { StudyCalculatorModal } from './StudyCalculatorModal'

interface StudyRoomViewProps {
  roomId: string
  nguoiDung: NguoiDung
  onLeaveRoom: () => void
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

export type RightRailTab = 'chat' | 'members' | 'youtube' | 'slides' | 'notes' | 'queue'

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
    queue,
    chatMessages,
    latencyMs,
    myMic,
    doDoTre,
    calculateTargetTime,
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
  } = useRoom(roomId, nguoiDung.actorKey)

  // Vùng 1 (Right Rail) Active Tab
  const [activeTab, setActiveTab] = useState<RightRailTab>('chat')
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Floating Video Frame Visibility
  const [showVideo, setShowVideo] = useState(Boolean(mediaState.videoId))
  const [prevVideoId, setPrevVideoId] = useState(mediaState.videoId)
  if (mediaState.videoId !== prevVideoId) {
    setPrevVideoId(mediaState.videoId)
    if (mediaState.videoId) {
      setShowVideo(true)
    }
  }

  const [volume, setVolume] = useState(80)
  const [chatInput, setChatInput] = useState('')
  const [queueInput, setQueueInput] = useState('')
  const [queueTitle, setQueueTitle] = useState('')
  const [directYtInput, setDirectYtInput] = useState('')

  // Shared Notes
  const [localNotes, setLocalNotes] = useState(sharedNotes.content)
  const [prevNotesTime, setPrevNotesTime] = useState(sharedNotes.updatedAt)
  if (sharedNotes.updatedAt !== prevNotesTime) {
    setPrevNotesTime(sharedNotes.updatedAt)
    setLocalNotes(sharedNotes.content)
  }

  // Pomodoro
  const [pomoRemaining, setPomoRemaining] = useState(pomodoroState.remaining)
  const [prevPomoState, setPrevPomoState] = useState(pomodoroState)
  if (
    pomodoroState.endsAt !== prevPomoState.endsAt ||
    pomodoroState.remaining !== prevPomoState.remaining ||
    pomodoroState.running !== prevPomoState.running
  ) {
    setPrevPomoState(pomodoroState)
    setPomoRemaining(pomodoroState.remaining)
  }

  // Refs
  const chatContainerRef = useRef<HTMLDivElement | null>(null)
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cuộn mượt chat nội bộ container cha
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatMessages.length])

  // Tìm tên chủ phòng
  const tenChuPhong = useMemo(() => {
    const chu = members.find((m) => m.key === hostKey)
    return chu?.ten || 'Chủ phòng'
  }, [members, hostKey])

  // Tính đếm ngược Pomodoro thời gian thực
  useEffect(() => {
    if (!pomodoroState.running || pomodoroState.endsAt <= 0) return

    const capNhat = () => {
      const now = Date.now()
      const conLai = Math.max(0, Math.round((pomodoroState.endsAt - now) / 1000))
      setPomoRemaining(conLai)
      if (conLai <= 0 && isHost) {
        const nextMode = pomodoroState.mode === 'focus' ? 'break' : 'focus'
        togglePomodoro({ action: 'switch_mode', mode: nextMode })
        toast.info(nextMode === 'focus' ? 'Bắt đầu phiên tập trung mới!' : 'Đến giờ nghỉ ngơi 5 phút rồi!')
      }
    }

    const timer = setInterval(capNhat, 500)
    return () => clearInterval(timer)
  }, [pomodoroState.running, pomodoroState.endsAt, pomodoroState.mode, isHost, togglePomodoro])

  // Xử lý gửi chat phòng
  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    sendRoomChat(text)
    setChatInput('')
  }

  // Xử lý cập nhật ghi chú có debounce
  const handleNotesChange = (text: string) => {
    setLocalNotes(text)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => {
      updateNotes(text)
    }, 600)
  }

  // Xử lý phát trực tiếp link YouTube
  const handlePlayDirectVideo = (e: React.FormEvent) => {
    e.preventDefault()
    const vid = trichXuatYoutubeId(directYtInput)
    if (!vid) {
      toast.error('Vui lòng nhập link YouTube hoặc mã video hợp lệ.')
      return
    }
    syncMedia({ action: 'play', time: 0 })
    addToQueue(vid, `Bài giảng (${vid})`)
    playFromQueue(`queue_${vid}`)
    setDirectYtInput('')
    setShowVideo(true)
    toast.success('Đã mở khung hình video YouTube lên bảng đen!')
  }

  // Xử lý thêm vào hàng đợi
  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault()
    const vid = trichXuatYoutubeId(queueInput)
    if (!vid) {
      toast.error('Vui lòng nhập đường dẫn hoặc mã video YouTube hợp lệ.')
      return
    }
    const tieuDe = queueTitle.trim() || `Bài giảng (${vid})`
    addToQueue(vid, tieuDe)
    setQueueInput('')
    setQueueTitle('')
    toast.success('Đã thêm bài giảng vào hàng đợi!')
  }

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-[#070a10] text-slate-100 select-none">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#090d16]/95 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={onLeaveRoom}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Rời phòng</span>
          </Button>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <h1 className="max-w-[180px] truncate text-sm font-bold text-white sm:max-w-xs">
              {slideState?.docName || mediaState.title || roomId}
            </h1>
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300"
            >
              <Crown className="h-3 w-3" />
              {isHost ? 'Bạn là Chủ phòng' : tenChuPhong}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Pomodoro Timer Badge */}
          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                pomodoroState.mode === 'focus' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="font-mono font-bold text-slate-200">
              {pomodoroState.mode === 'focus' ? '🍅' : '☕'} {dinhDangGiayPhut(pomoRemaining)}
            </span>
            <span className="hidden text-[10px] text-slate-400 md:inline">
              (Vòng #{pomodoroState.round})
            </span>

            {isHost ? (
              <div className="ml-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    togglePomodoro({
                      action: pomodoroState.running ? 'pause' : 'start',
                    })
                  }
                  className="rounded p-0.5 text-slate-300 hover:text-white"
                  title={pomodoroState.running ? 'Tạm dừng' : 'Bắt đầu'}
                >
                  {pomodoroState.running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => togglePomodoro({ action: 'reset' })}
                  className="rounded p-0.5 text-slate-400 hover:text-white"
                  title="Đặt lại"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Volume Control */}
          <div className="hidden items-center gap-1.5 md:flex">
            <Volume2 className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1.5 w-16 cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Mic Toggle Button */}
          <Button
            size="sm"
            variant={myMic ? 'default' : 'outline'}
            className={`h-8 gap-1 text-xs font-semibold ${
              myMic ? 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-500' : 'border-white/20'
            }`}
            onClick={toggleMic}
          >
            {myMic ? <Mic className="h-3.5 w-3.5 animate-pulse" /> : <MicOff className="h-3.5 w-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{myMic ? 'Mic bật' : 'Mic tắt'}</span>
          </Button>

          {/* Connection Indicator */}
          <button
            type="button"
            onClick={doDoTre}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            title="Độ trễ tới máy chủ"
          >
            {trangThai === 'da_ket_noi' ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden lg:inline">{latencyMs !== null ? `${latencyMs}ms` : 'Ping'}</span>
              </>
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-destructive" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Teaching Workspace: Vùng 2 (Center Canvas) & Vùng 1 (Right Tool Rail) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* VÙNG 2: Bảng đen kỹ thuật số trung tâm (Digital Blackboard) */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-[#162721]">
          {/* Canvas Bảng đen kết hợp trình chiếu Slide PowerPoint/PDF */}
          <ChalkboardCanvas
            strokes={whiteboardStrokes}
            slideState={slideState}
            isHost={isHost}
            onSendStroke={sendStroke}
            onClearWhiteboard={clearWhiteboard}
            onChangeSlidePage={changeSlidePage}
            onCloseSlide={closeSlideDoc}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />

          {/* Khung hình Video YouTube chèn nổi trên bảng (Floating, Resizable & Draggable) */}
          {showVideo && mediaState.videoId ? (
            <FloatingVideoPlayer
              mediaState={mediaState}
              isHost={isHost}
              volume={volume}
              onVolumeChange={setVolume}
              onSyncMedia={(action, time) => syncMedia({ action, time })}
              onOpenSearchQueue={() => setActiveTab('youtube')}
              onClose={() => setShowVideo(false)}
              calculateTargetTime={calculateTargetTime}
            />
          ) : null}
        </main>

        {/* VÙNG 1: Toàn bộ Thanh Công Cụ & Khay điều khiển bên phải (Right Tools Dock) */}
        <aside className="relative flex h-full shrink-0 border-l border-white/10 bg-[#0d121c]">
          {/* Sub-panel content for active tool */}
          <div className="flex w-72 flex-col border-r border-white/10 bg-[#0e1422] sm:w-80">
            {/* Header của Tab đang mở */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-3">
              <div className="flex items-center gap-2">
                {activeTab === 'chat' && <MessageSquare className="h-4 w-4 text-cyan-400" />}
                {activeTab === 'members' && <Users className="h-4 w-4 text-indigo-400" />}
                {activeTab === 'youtube' && <YoutubeIcon className="h-4 w-4 text-red-400" />}
                {activeTab === 'slides' && <FileSpreadsheet className="h-4 w-4 text-orange-400" />}
                {activeTab === 'notes' && <FileText className="h-4 w-4 text-amber-400" />}
                {activeTab === 'queue' && <ListVideo className="h-4 w-4 text-emerald-400" />}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {activeTab === 'chat' && 'Trò chuyện phòng'}
                  {activeTab === 'members' && `Thành viên (${members.length})`}
                  {activeTab === 'youtube' && 'Video YouTube'}
                  {activeTab === 'slides' && 'Trình chiếu Bài giảng'}
                  {activeTab === 'notes' && 'Ghi chú chung'}
                  {activeTab === 'queue' && `Hàng đợi (${queue.length})`}
                </span>
              </div>

              {activeTab === 'youtube' && mediaState.videoId ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] text-cyan-400 hover:text-cyan-300"
                  onClick={() => setShowVideo((v) => !v)}
                >
                  {showVideo ? 'Ẩn video' : 'Hiện video'}
                </Button>
              ) : null}
            </div>

            {/* TAB 1: TRÒ CHUYỆN PHÒNG */}
            {activeTab === 'chat' ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div ref={chatContainerRef} className="flex-1 space-y-2.5 overflow-y-auto p-3 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center text-slate-500">
                      Chưa có tin nhắn trong phòng.
                    </div>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="rounded-lg border border-white/5 bg-white/5 p-2 leading-relaxed">
                        <div className="mb-0.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold text-slate-200">{msg.ten}</span>
                          <span>{new Date(msg.taoLuc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-100 break-words">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendChat} className="flex items-center gap-1.5 border-t border-white/10 p-2.5">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Nhắn tin với cả phòng…"
                    className="h-8 border-white/10 bg-black/40 text-xs text-white placeholder-slate-500"
                  />
                  <Button type="submit" size="sm" className="h-8 w-8 shrink-0 p-0 bg-cyan-600 hover:bg-cyan-500">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            ) : null}

            {/* TAB 2: THÀNH VIÊN & GIỌNG NÓI */}
            {activeTab === 'members' ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <p className="text-[11px] font-medium text-slate-400 mb-2">Đang tham gia sảnh ({members.length}):</p>
                {members.map((m) => (
                  <div
                    key={m.key}
                    className={`flex items-center justify-between rounded-xl border p-2.5 text-xs ${
                      m.mic
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/5 bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white">{m.ten}</span>
                      {m.key === hostKey ? (
                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-[9px] text-amber-300 py-0">
                          Chủ phòng
                        </Badge>
                      ) : null}
                    </div>
                    {m.mic ? <Mic className="h-4 w-4 text-emerald-400 animate-pulse" /> : <MicOff className="h-3.5 w-3.5 text-slate-500" />}
                  </div>
                ))}
              </div>
            ) : null}

            {/* TAB 3: YOUTUBE & ĐIỀU KHIỂN VIDEO */}
            {activeTab === 'youtube' ? (
              <div className="flex flex-1 flex-col overflow-y-auto p-3 space-y-4">
                {/* Form chèn nhanh link YouTube */}
                <form onSubmit={handlePlayDirectVideo} className="space-y-2 rounded-xl border border-red-500/20 bg-red-950/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                    <YoutubeIcon className="h-4 w-4" />
                    Chèn Video YouTube lên bảng
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Dán đường dẫn hoặc ID video YouTube để mở khung hình điều chỉnh kích thước phóng to/thu nhỏ trên bảng đen.
                  </p>
                  <Input
                    value={directYtInput}
                    onChange={(e) => setDirectYtInput(e.target.value)}
                    placeholder="https://youtu.be/dQw4w9WgXcQ..."
                    className="h-8 border-white/10 bg-black/50 text-xs text-white"
                  />
                  <Button type="submit" size="sm" className="w-full h-8 bg-red-600 hover:bg-red-500 text-xs font-semibold">
                    Chèn Video Vào Bảng Đen
                  </Button>
                </form>

                {/* Trạng thái phát video hiện tại */}
                {mediaState.videoId ? (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[180px]">
                        {mediaState.title || 'Video đang phát'}
                      </span>
                      <Badge variant="outline" className="border-cyan-500/40 bg-cyan-500/10 text-[10px] text-cyan-300">
                        {mediaState.status === 'playing' ? 'Đang phát' : 'Tạm dừng'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500"
                        onClick={() => {
                          const targetTime = calculateTargetTime()
                          syncMedia({
                            action: mediaState.status === 'playing' ? 'pause' : 'play',
                            time: targetTime,
                          })
                        }}
                      >
                        {mediaState.status === 'playing' ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                        {mediaState.status === 'playing' ? 'Tạm dừng cả phòng' : 'Phát chung'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-white/15 text-xs text-slate-300 hover:text-white"
                        onClick={() => setShowVideo((v) => !v)}
                      >
                        {showVideo ? 'Thu nhỏ' : 'Mở video'}
                      </Button>
                    </div>

                    {/* Tốc độ phát */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                      <span>Tốc độ:</span>
                      <div className="flex items-center gap-1">
                        {[1, 1.25, 1.5].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => syncMedia({ action: 'rate', rate })}
                            className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold transition-colors ${
                              mediaState.playbackRate === rate
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                    Chưa có video bài giảng nào đang được chèn.
                  </div>
                )}
              </div>
            ) : null}

            {/* TAB 4: TRÌNH CHIẾU BÀI GIẢNG (POWERPOINT / PDF / FILE) */}
            {activeTab === 'slides' ? (
              <div className="flex flex-1 flex-col overflow-y-auto p-3 space-y-4">
                <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-300">
                    <FileSpreadsheet className="h-4 w-4" />
                    Tích hợp PowerPoint & PDF
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Mở file bài giảng thuyết trình trực tiếp trên nền bảng đen. Giáo viên và học sinh có thể vừa xem slide vừa dùng phấn vẽ, khoanh đáp án và giải bài tập trực tiếp.
                  </p>
                  <Button
                    size="sm"
                    className="w-full h-8 bg-orange-600 hover:bg-orange-500 text-xs font-semibold"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Tải Bài Giảng (.pptx, .pdf, ảnh)
                  </Button>
                </div>

                {slideState ? (
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase text-orange-400 font-bold tracking-wider">
                        Đang trình chiếu:
                      </span>
                      <p className="font-semibold text-xs text-white truncate mt-0.5">{slideState.docName}</p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs">
                      <span className="text-slate-400">Trang:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {slideState.currentPage} / {slideState.totalPages}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={slideState.currentPage <= 1}
                        className="flex-1 h-8 text-xs border-white/10"
                        onClick={() => changeSlidePage(slideState.currentPage - 1)}
                      >
                        Trang trước
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={slideState.currentPage >= slideState.totalPages}
                        className="flex-1 h-8 text-xs border-white/10"
                        onClick={() => changeSlidePage(slideState.currentPage + 1)}
                      >
                        Trang sau
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full h-7 text-xs text-destructive hover:bg-destructive/10"
                      onClick={closeSlideDoc}
                    >
                      Đóng trình chiếu slide
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-slate-500">
                    Chưa mở bài giảng nào. Nhấn &quot;Tải Bài Giảng&quot; để chọn file PowerPoint hoặc PDF.
                  </div>
                )}
              </div>
            ) : null}

            {/* TAB 5: GHI CHÚ CHUNG */}
            {activeTab === 'notes' ? (
              <div className="flex flex-1 flex-col overflow-hidden p-3">
                <textarea
                  value={localNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Ghi chú bài học tại đây (hỗ trợ định dạng Markdown)..."
                  className="flex-1 resize-none rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                <div className="pt-2 text-[10px] text-slate-500 truncate">
                  Sửa bởi {sharedNotes.lastEditedBy} lúc{' '}
                  {new Date(sharedNotes.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ) : null}

            {/* TAB 6: HÀNG ĐỢI BÀI GIẢNG */}
            {activeTab === 'queue' ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                <form onSubmit={handleAddToQueue} className="border-b border-white/10 p-3 space-y-2">
                  <Input
                    value={queueInput}
                    onChange={(e) => setQueueInput(e.target.value)}
                    placeholder="Link video YouTube..."
                    className="h-8 border-white/10 bg-black/40 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={queueTitle}
                      onChange={(e) => setQueueTitle(e.target.value)}
                      placeholder="Tiêu đề..."
                      className="h-8 border-white/10 bg-black/40 text-xs text-white"
                    />
                    <Button type="submit" size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500 text-xs">
                      + Thêm
                    </Button>
                  </div>
                </form>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {queue.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-center text-xs text-slate-500">
                      Hàng đợi trống.
                    </div>
                  ) : (
                    queue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="truncate font-semibold text-slate-200">
                            #{idx + 1} {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500">Bởi {item.addedBy}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300"
                            onClick={() => {
                              playFromQueue(item.id)
                              setShowVideo(true)
                            }}
                            title="Phát ngay"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-destructive"
                            onClick={() => removeFromQueue(item.id)}
                            title="Xoá"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Vertical Icon Dock (Cột nút chuyển công cụ nhanh bên phải) */}
          <div className="flex w-14 flex-col items-center justify-between border-l border-white/10 bg-[#090d16] py-3">
            <div className="flex flex-col items-center gap-3">
              {/* Nút YouTube */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('youtube')
                  if (!showVideo && mediaState.videoId) setShowVideo(true)
                }}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  activeTab === 'youtube'
                    ? 'bg-red-600/30 text-red-400 ring-2 ring-red-500/50'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Video YouTube (Chèn khung hình video lên bảng)"
              >
                <YoutubeIcon className="h-5 w-5" />
                {mediaState.videoId ? (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                ) : null}
              </button>

              {/* Nút Slide PowerPoint & PDF */}
              <button
                type="button"
                onClick={() => setActiveTab('slides')}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  activeTab === 'slides'
                    ? 'bg-orange-600/30 text-orange-400 ring-2 ring-orange-500/50'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Bài giảng PowerPoint / PDF / File"
              >
                <FileSpreadsheet className="h-5 w-5" />
                {slideState ? (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-orange-400" />
                ) : null}
              </button>

              {/* Nút Bảng phấn (quay về canvas) */}
              <button
                type="button"
                onClick={() => {
                  toast.info('Công cụ vẽ phấn đang sẵn sàng trên bảng đen!')
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-emerald-400 hover:bg-white/10 hover:text-emerald-300"
                title="Bảng đen kỹ thuật số"
              >
                <PenTool className="h-5 w-5" />
              </button>

              {/* Nút Máy tính FX */}
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-cyan-400 hover:bg-white/10 hover:text-cyan-300"
                title="Máy tính khoa học Casio FX"
              >
                <CalcIcon className="h-5 w-5" />
              </button>

              {/* Nút Trò chuyện */}
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  activeTab === 'chat'
                    ? 'bg-cyan-600/30 text-cyan-400 ring-2 ring-cyan-500/50'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Trò chuyện phòng học"
              >
                <MessageSquare className="h-5 w-5" />
                {chatMessages.length > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-black">
                    {chatMessages.length}
                  </span>
                ) : null}
              </button>

              {/* Nút Thành viên */}
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  activeTab === 'members'
                    ? 'bg-indigo-600/30 text-indigo-400 ring-2 ring-indigo-500/50'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Thành viên phòng học"
              >
                <Users className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white/20 px-1 text-[9px] font-bold text-white">
                  {members.length}
                </span>
              </button>

              {/* Nút Ghi chú chung */}
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  activeTab === 'notes'
                    ? 'bg-amber-600/30 text-amber-400 ring-2 ring-amber-500/50'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Ghi chú bài học chung"
              >
                <FileText className="h-5 w-5" />
              </button>

              {/* Nút Hàng đợi Video */}
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  activeTab === 'queue'
                    ? 'bg-emerald-600/30 text-emerald-400 ring-2 ring-emerald-500/50'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title="Hàng đợi video bài giảng"
              >
                <ListVideo className="h-5 w-5" />
                {queue.length > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-black">
                    {queue.length}
                  </span>
                ) : null}
              </button>
            </div>

            {/* Bottom info or quick toggle */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">v2.0</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <StudyCalculatorModal
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
      />

      <SlideUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onLoadSlide={(docUrl, docName, fileType, totalPages) => {
          loadSlideDoc(docUrl, docName, fileType, totalPages)
          toast.success(`Đã mở bài giảng: ${docName}`)
        }}
      />
    </div>
  )
}
