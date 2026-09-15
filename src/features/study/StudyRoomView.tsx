import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useRoom } from '@/hooks/use-room'
import type { NguoiDung } from '@/lib/api'
import type { WhiteboardStroke } from '@shared/protocol/room'
import {
  ArrowLeft,
  Calculator as CalcIcon,
  Crown,
  FileText,
  ListVideo,
  Mic,
  MicOff,
  Pause,
  PenTool,
  Play,
  RotateCcw,
  Send,
  Trash2,
  Users,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
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
  } = useRoom(roomId, nguoiDung.actorKey)

  // Sub-drawers & Tool Dock State
  const [activeTool, setActiveTool] = useState<'none' | 'calculator' | 'whiteboard' | 'notes' | 'queue'>('none')
  const [volume, setVolume] = useState(80)
  const [chatInput, setChatInput] = useState('')
  const [queueInput, setQueueInput] = useState('')
  const [queueTitle, setQueueTitle] = useState('')
  const [localNotes, setLocalNotes] = useState(sharedNotes.content)
  const [prevNotesTime, setPrevNotesTime] = useState(sharedNotes.updatedAt)
  if (sharedNotes.updatedAt !== prevNotesTime) {
    setPrevNotesTime(sharedNotes.updatedAt)
    setLocalNotes(sharedNotes.content)
  }

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

  const [isDrawing, setIsDrawing] = useState(false)
  const [brushColor, setBrushColor] = useState('#00F2FE')
  const [brushSize, setBrushSize] = useState(3)
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([])

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
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
        // Hết giờ Pomodoro -> tự động đổi mode
        const nextMode = pomodoroState.mode === 'focus' ? 'break' : 'focus'
        togglePomodoro({ action: 'switch_mode', mode: nextMode })
        toast.info(nextMode === 'focus' ? 'Bắt đầu phiên tập trung mới!' : 'Đến giờ nghỉ ngơi 5 phút rồi!')
      }
    }

    const timer = setInterval(capNhat, 500)
    return () => clearInterval(timer)
  }, [pomodoroState.running, pomodoroState.endsAt, pomodoroState.mode, isHost, togglePomodoro])

  // Render Whiteboard Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Vẽ toàn bộ strokes đã lưu
    for (const stroke of whiteboardStrokes) {
      if (stroke.points.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.moveTo(stroke.points[0][0], stroke.points[0][1])
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i][0], stroke.points[i][1])
      }
      ctx.stroke()
    }

    // Vẽ nét đang vẽ dở
    if (currentPoints.length >= 2) {
      ctx.beginPath()
      ctx.strokeStyle = brushColor
      ctx.lineWidth = brushSize
      ctx.moveTo(currentPoints[0][0], currentPoints[0][1])
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i][0], currentPoints[i][1])
      }
      ctx.stroke()
    }
  }, [whiteboardStrokes, currentPoints, brushColor, brushSize])

  // Xử lý gửi chat phòng
  const handleSendChat = (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    sendRoomChat(text)
    setChatInput('')
  }

  // Xử lý cập nhật ghi chú có throttle
  const handleNotesChange = (text: string) => {
    setLocalNotes(text)
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(() => {
      updateNotes(text)
    }, 600)
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

  // Xử lý vẽ bảng
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setIsDrawing(true)
    setCurrentPoints([[x, y]])
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentPoints((prev) => [...prev, [x, y]])
  }

  const handleMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentPoints.length >= 2) {
      const stroke: WhiteboardStroke = {
        id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        points: currentPoints,
        color: brushColor,
        size: brushSize,
      }
      sendStroke(stroke)
    }
    setCurrentPoints([])
  }

  return (
    <div className="flex min-h-svh flex-col bg-[#0b0e14] text-slate-100">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0b0e14]/90 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2.5 text-xs text-slate-400 hover:text-white"
            onClick={onLeaveRoom}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Rời phòng</span>
          </Button>

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <h1 className="max-w-[200px] truncate text-sm font-bold text-white sm:max-w-xs">
              {mediaState.title || roomId}
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
          {/* Pomodoro Pill Badge */}
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
          <div className="hidden items-center gap-1.5 sm:flex">
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

      {/* 2. Main Workspace Layout */}
      <div className="relative grid flex-1 grid-cols-1 items-start gap-4 p-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        {/* Left Column: Hero Focus Area & Video Player */}
        <div className="flex min-w-0 flex-col gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            {mediaState.videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${mediaState.videoId}?autoplay=1&enablejsapi=1&controls=1&rel=0`}
                title={mediaState.title}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-slate-500">
                <ListVideo className="h-12 w-12 stroke-[1.5] text-slate-600" />
                <p className="mt-2 text-sm font-medium">Chưa chọn video bài giảng nào.</p>
                <p className="text-xs text-slate-600">Thêm link YouTube vào Hàng đợi để phát cùng phòng.</p>
              </div>
            )}

            {/* Live Sync Status Overlay */}
            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-semibold text-cyan-300">
                {mediaState.status === 'playing' ? 'Đang phát đồng bộ' : 'Tạm dừng'}
              </span>
            </div>
          </div>

          {/* Video Host Playback Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#121824]/80 p-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500"
                onClick={() => {
                  const targetTime = calculateTargetTime()
                  syncMedia({
                    action: mediaState.status === 'playing' ? 'pause' : 'play',
                    time: targetTime,
                  })
                }}
              >
                {mediaState.status === 'playing' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {mediaState.status === 'playing' ? 'Tạm dừng cả phòng' : 'Phát chung'}
              </Button>

              <div className="text-xs font-mono text-slate-400">
                {dinhDangGiayPhut(calculateTargetTime())}
              </div>
            </div>

            {/* Playback speed presets */}
            <div className="flex items-center gap-1 text-xs">
              <span className="mr-1 text-[11px] text-slate-400">Tốc độ:</span>
              {[1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => syncMedia({ action: 'rate', rate })}
                  className={`rounded px-2 py-0.5 font-mono text-xs font-semibold transition-colors ${
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

        {/* Right Column: Voice Strip & Room Chat Feed */}
        <aside className="flex flex-col gap-4 self-start">
          {/* Member Voice Strip */}
          <Card className="border-white/10 bg-[#121824]/90 text-slate-100 shadow-md">
            <CardHeader className="border-b border-white/5 px-4 py-2.5">
              <CardTitle className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-cyan-400" />
                  Thành viên ({members.length})
                </span>
                <span className="text-[11px] text-slate-500">Giọng nói</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div
                    key={m.key}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                      m.mic
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/10 bg-white/5 text-slate-400'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-medium text-slate-200">{m.ten}</span>
                    {m.key === hostKey ? <Crown className="h-3 w-3 text-amber-400" /> : null}
                    {m.mic ? <Mic className="h-3 w-3 text-emerald-400 animate-pulse" /> : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* In-room Chat Feed */}
          <Card className="flex h-[420px] flex-col border-white/10 bg-[#121824]/90 text-slate-100 shadow-md">
            <CardHeader className="border-b border-white/5 px-4 py-2.5">
              <CardTitle className="text-xs font-bold text-slate-300">
                Trò chuyện phòng học 💬
              </CardTitle>
            </CardHeader>

            <CardContent ref={chatContainerRef} className="flex-1 space-y-2.5 overflow-y-auto p-3 text-xs">
              {chatMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-slate-500">
                  Chưa có tin nhắn trong phòng.
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="rounded-lg border border-white/5 bg-white/5 p-2 leading-relaxed">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-bold text-slate-200">{msg.ten}</span>
                      <span>{new Date(msg.taoLuc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-100 break-words">{msg.text}</p>
                  </div>
                ))
              )}
            </CardContent>

            <form onSubmit={handleSendChat} className="flex items-center gap-1.5 border-t border-white/5 p-2">
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
          </Card>
        </aside>
      </div>

      {/* 3. Floating Bottom Tool Dock (Pill Bar) */}
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#121824]/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          <Button
            variant="ghost"
            size="sm"
            className={`h-9 gap-1.5 rounded-full px-3 text-xs font-semibold ${
              activeTool === 'calculator' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTool((prev) => (prev === 'calculator' ? 'none' : 'calculator'))}
          >
            <CalcIcon className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">Máy tính FX</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-9 gap-1.5 rounded-full px-3 text-xs font-semibold ${
              activeTool === 'whiteboard' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTool((prev) => (prev === 'whiteboard' ? 'none' : 'whiteboard'))}
          >
            <PenTool className="h-4 w-4 text-purple-400" />
            <span className="hidden sm:inline">Bảng vẽ</span>
            {whiteboardStrokes.length > 0 ? (
              <span className="rounded-full bg-purple-500/30 px-1 text-[10px] text-purple-300">
                {whiteboardStrokes.length}
              </span>
            ) : null}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-9 gap-1.5 rounded-full px-3 text-xs font-semibold ${
              activeTool === 'notes' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTool((prev) => (prev === 'notes' ? 'none' : 'notes'))}
          >
            <FileText className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Ghi chú chung</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`h-9 gap-1.5 rounded-full px-3 text-xs font-semibold ${
              activeTool === 'queue' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => setActiveTool((prev) => (prev === 'queue' ? 'none' : 'queue'))}
          >
            <ListVideo className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Hàng đợi</span>
            {queue.length > 0 ? (
              <span className="rounded-full bg-emerald-500/30 px-1.5 text-[10px] text-emerald-300">
                {queue.length}
              </span>
            ) : null}
          </Button>
        </div>
      </div>

      {/* 4. Drawers & Modals */}
      <StudyCalculatorModal
        open={activeTool === 'calculator'}
        onOpenChange={(open) => setActiveTool(open ? 'calculator' : 'none')}
      />

      {/* Shared Whiteboard Drawer / Overlay */}
      {activeTool === 'whiteboard' ? (
        <div className="fixed inset-x-4 bottom-20 top-16 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0d121c]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <PenTool className="h-4 w-4" />
                Bảng vẽ nháp nhóm
              </span>
              <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                {['#00F2FE', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#FFFFFF'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                    className={`h-5 w-5 rounded-full border ${
                      brushColor === color ? 'ring-2 ring-white scale-110' : 'border-black/50'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 pl-2">
                {[2, 4, 8].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBrushSize(size)}
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                      brushSize === size ? 'bg-white/20 text-white' : 'text-slate-500'
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={clearWhiteboard}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Xoá bảng
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setActiveTool('none')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 cursor-crosshair bg-[#06090e] p-2">
            <canvas
              ref={canvasRef}
              width={1600}
              height={900}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="h-full w-full rounded-xl border border-white/5 touch-none"
            />
          </div>
        </div>
      ) : null}

      {/* Shared Notes Drawer */}
      {activeTool === 'notes' ? (
        <div className="fixed inset-y-16 right-4 z-50 flex w-96 flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0d121c]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <FileText className="h-4 w-4" />
              Ghi chú chung (Markdown)
            </span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setActiveTool('none')}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 p-3">
            <textarea
              value={localNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Ghi chú bài học tại đây (hỗ trợ định dạng Markdown)..."
              className="h-full w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs leading-relaxed text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
            Sửa lần cuối bởi {sharedNotes.lastEditedBy} lúc{' '}
            {new Date(sharedNotes.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ) : null}

      {/* Playlist Queue Drawer */}
      {activeTool === 'queue' ? (
        <div className="fixed inset-y-16 right-4 z-50 flex w-96 flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#0d121c]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <ListVideo className="h-4 w-4" />
              Hàng đợi video bài giảng ({queue.length})
            </span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setActiveTool('none')}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleAddToQueue} className="border-b border-white/10 p-3 space-y-2">
            <Input
              value={queueInput}
              onChange={(e) => setQueueInput(e.target.value)}
              placeholder="Dán link YouTube (URL hoặc ID)..."
              className="h-8 border-white/10 bg-black/40 text-xs text-white"
            />
            <div className="flex gap-2">
              <Input
                value={queueTitle}
                onChange={(e) => setQueueTitle(e.target.value)}
                placeholder="Tiêu đề video..."
                className="h-8 border-white/10 bg-black/40 text-xs text-white"
              />
              <Button type="submit" size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500 text-xs">
                + Thêm
              </Button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {queue.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-center text-xs text-slate-500">
                Hàng đợi đang trống. Thêm video để phát nối tiếp!
              </div>
            ) : (
              queue.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-2.5 text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate font-semibold text-slate-200">
                      #{idx + 1} {item.title}
                    </p>
                    <p className="text-[10px] text-slate-500">Thêm bởi {item.addedBy}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300"
                      onClick={() => playFromQueue(item.id)}
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
  )
}
