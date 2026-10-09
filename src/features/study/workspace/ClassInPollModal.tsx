// src/features/study/workspace/ClassInPollModal.tsx
// Công cụ bình chọn tương tác nhanh:
// - Chủ phòng: 2 tab chính (Soạn câu hỏi & Thống kê lưu lịch sử từng câu, nút kết thúc ngay trong tab thống kê)
// - Người tham gia: chỉ nhập/chọn/submit, không kéo modal, không có nút X tắt bảng, không che mất chữ cái đáp án đúng, bỏ dòng ẩn/hiện đáp án và bỏ đếm ngược trùng lặp

import type { ActivePoll } from '@shared/protocol/room'
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileQuestion,
  FileText,
  GripHorizontal,
  History,
  Minus,
  Play,
  Plus,
  StopCircle,
  Trash2,
  Type,
  Users,
  Vote,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { BlueprintStudyPattern } from '@/components/ui/blueprint-patterns'

export interface ClassInPollModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  poll: ActivePoll | null
  voteCounts: Record<string, number> | null
  canControl: boolean
  currentAccountId?: number
  onCreatePoll: (
    question: string,
    options: string[],
    durationSeconds?: number,
    allowViewOtherAnswers?: boolean,
    correctOptionIndex?: number,
  ) => void
  onVote: (pollId: string, optionId: string) => void
  onClosePoll: () => void
  onMovePoll?: (x: number, y: number) => void
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TEXT'
export type CreatorTab = 'create' | 'stats'

export interface PollHistoryItem {
  id: string
  question: string
  options: Array<{
    id: string
    text: string
    count: number
    percent: number
    isCorrect?: boolean
  }>
  totalVotes: number
  durationSeconds?: number
  createdAt: number
  closedAt?: number
}

export const TEMPLATE_PRESETS = {
  MULTIPLE_CHOICE: { name: 'Trắc nghiệm' },
  TRUE_FALSE: { name: 'Đúng / Sai' },
  TEXT: { name: 'Điền text' },
} as const

export const TIMER_PRESETS: { label: string; seconds?: number }[] = [
  { label: 'Không giới hạn', seconds: undefined },
  { label: '30 giây', seconds: 30 },
  { label: '60 giây', seconds: 60 },
  { label: '90 giây', seconds: 90 },
  { label: '2 phút', seconds: 120 },
  { label: '5 phút', seconds: 300 },
]

export const OPTION_COLORS = [
  { bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30 ring-sky-500/30', bar: 'bg-sky-500', dot: 'bg-sky-400' },
  { bg: 'bg-violet-500/15 text-violet-400 border-violet-500/30 ring-violet-500/30', bar: 'bg-violet-500', dot: 'bg-violet-400' },
  { bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-emerald-500/30', bar: 'bg-emerald-500', dot: 'bg-emerald-400' },
  { bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 ring-amber-500/30', bar: 'bg-amber-500', dot: 'bg-amber-400' },
  { bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30 ring-rose-500/30', bar: 'bg-rose-500', dot: 'bg-rose-400' },
  { bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 ring-cyan-500/30', bar: 'bg-cyan-500', dot: 'bg-cyan-400' },
  { bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 ring-indigo-500/30', bar: 'bg-indigo-500', dot: 'bg-indigo-400' },
  { bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30 ring-teal-500/30', bar: 'bg-teal-500', dot: 'bg-teal-400' },
]

export function ClassInPollModal({
  open,
  onOpenChange,
  poll,
  voteCounts,
  canControl,
  onCreatePoll,
  onVote,
  onClosePoll,
  onMovePoll,
}: ClassInPollModalProps) {
  // Tabs for Host / Teacher: 'create' | 'stats'
  const [creatorTab, setCreatorTab] = useState<CreatorTab>('create')

  // Form creation state: giữ nguyên vùng 1 không nhập chữ mẫu vào ô câu hỏi
  const [questionType, setQuestionType] = useState<QuestionType>('MULTIPLE_CHOICE')
  const [question, setQuestion] = useState('')
  // Multiple choices default to 'A' only (user can click + to add B, C, D...)
  const [options, setOptions] = useState<string[]>(['A'])
  const [optionTexts, setOptionTexts] = useState<Record<string, string>>({})
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | undefined>(60)
  const [allowViewOtherAnswers, setAllowViewOtherAnswers] = useState<boolean>(true)

  // Poll history state (stores finished questions and results)
  const [pollHistory, setPollHistory] = useState<PollHistoryItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('c10a7_poll_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  // Dragging state (only for host) - GPU RAF 1:1 smooth drag
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const offsetRef = useRef(offset)
  offsetRef.current = offset

  const dragStartRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    initX: number
    initY: number
  } | null>(null)
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const rafIdRef = useRef<number | null>(null)
  const throttleMoveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Student voting state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null)
  const [studentTextAnswer, setStudentTextAnswer] = useState('')
  const [hasVotedForCurrentPoll, setHasVotedForCurrentPoll] = useState(false)

  // Close with Esc key (only for canControl)
  useEffect(() => {
    if (!open || !canControl) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, canControl, onOpenChange])

  // Track voted status in session storage
  useEffect(() => {
    if (!poll) {
      setHasVotedForCurrentPoll(false)
      setVotedOptionId(null)
      setSelectedOptionId(null)
      setStudentTextAnswer('')
      return
    }
    const key = `c10a7_voted_poll_${poll.id}`
    const saved = sessionStorage.getItem(key)
    if (saved) {
      setHasVotedForCurrentPoll(true)
      setVotedOptionId(saved)
      const savedText = sessionStorage.getItem(`c10a7_poll_text_${poll.id}`)
      if (savedText) setStudentTextAnswer(savedText)
    } else {
      setHasVotedForCurrentPoll(false)
      setVotedOptionId(null)
      setSelectedOptionId(null)
      setStudentTextAnswer('')
    }
  }, [poll?.id])

  // Switch to stats tab when a poll is already active upon opening
  useEffect(() => {
    if (canControl && poll && !poll.closed) {
      setCreatorTab('stats')
    }
  }, [poll?.id, poll?.closed, canControl])

  // Live countdown timer calculation
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!poll || poll.closed || !poll.endsAt) return
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 250)
    return () => clearInterval(interval)
  }, [poll?.id, poll?.closed, poll?.endsAt])

  const secondsRemaining = useMemo(() => {
    if (!poll?.endsAt) return null
    const diff = Math.max(0, Math.ceil((poll.endsAt - now) / 1000))
    return diff
  }, [poll?.endsAt, now])

  const isTimeUp = Boolean(poll?.endsAt && secondsRemaining !== null && secondsRemaining <= 0)
  const isPollActive = Boolean(poll && !poll.closed && !isTimeUp)

  // Automatically notify close if countdown hits 0 locally
  useEffect(() => {
    if (canControl && isTimeUp && poll && !poll.closed) {
      onClosePoll()
    }
  }, [canControl, isTimeUp, poll, onClosePoll])

  // Save finished poll into history
  useEffect(() => {
    if (!poll) return

    // If poll closed, make sure it is preserved in history
    if (poll.closed || isTimeUp) {
      const total = voteCounts ? Object.values(voteCounts).reduce((a, b) => a + b, 0) : 0
      const historyItem: PollHistoryItem = {
        id: poll.id,
        question: poll.question,
        options: poll.options.map((opt) => {
          const c = voteCounts?.[opt.id] ?? 0
          return {
            id: opt.id,
            text: opt.text,
            count: c,
            percent: total > 0 ? Math.round((c / total) * 100) : 0,
            isCorrect: poll.correctOptionId === opt.id || opt.isCorrect,
          }
        }),
        totalVotes: total,
        durationSeconds: poll.durationSeconds,
        createdAt: poll.createdAt,
        closedAt: Date.now(),
      }

      setPollHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== poll.id)
        const updated = [historyItem, ...filtered]
        try {
          sessionStorage.setItem('c10a7_poll_history', JSON.stringify(updated.slice(0, 30)))
        } catch {}
        return updated
      })
    }
  }, [poll?.id, poll?.closed, isTimeUp, voteCounts])

  // Synchronize modal position from server when received
  useEffect(() => {
    if (poll?.position && !isDragging) {
      setOffset(poll.position)
      offsetRef.current = poll.position
      currentPosRef.current = poll.position
      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${poll.position.x}px, ${poll.position.y}px, 0)`
      }
    }
  }, [poll?.position, isDragging])

  // Pointer drag handling for floating card (only enabled for host) - GPU RAF 1:1 Smooth Drag
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canControl) return
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initX: offsetRef.current.x,
      initY: offsetRef.current.y,
    }
    currentPosRef.current = { ...offsetRef.current }
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY
    let newX = dragStartRef.current.initX + dx
    let newY = dragStartRef.current.initY + dy

    const halfW = (cardRef.current?.offsetWidth ?? 440) / 2
    const halfH = (cardRef.current?.offsetHeight ?? 480) / 2
    const maxDx = Math.max(20, window.innerWidth / 2 - halfW)
    const maxDy = Math.max(20, window.innerHeight / 2 - halfH)
    newX = Math.max(-maxDx, Math.min(maxDx, newX))
    newY = Math.max(-maxDy, Math.min(maxDy, newY))

    currentPosRef.current = { x: newX, y: newY }

    // Direct GPU DOM transform for zero-latency 60/120fps glide
    if (cardRef.current) {
      cardRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`
    }

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        const pos = currentPosRef.current
        setOffset(pos)
        offsetRef.current = pos

        if (onMovePoll) {
          if (!throttleMoveRef.current) {
            throttleMoveRef.current = setTimeout(() => {
              throttleMoveRef.current = null
              onMovePoll(pos.x, pos.y)
            }, 50)
          }
        }
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (throttleMoveRef.current) {
      clearTimeout(throttleMoveRef.current)
      throttleMoveRef.current = null
    }
    const finalPos = currentPosRef.current
    dragStartRef.current = null
    setIsDragging(false)
    setOffset(finalPos)
    offsetRef.current = finalPos
    if (cardRef.current) {
      cardRef.current.style.transform = `translate3d(${finalPos.x}px, ${finalPos.y}px, 0)`
    }
    if (onMovePoll) {
      onMovePoll(finalPos.x, finalPos.y)
    }
  }

  // Select question type (giữ nguyên câu hỏi người dùng nhập, không chèn chữ mẫu)
  const handleSelectQuestionType = (t: QuestionType) => {
    setQuestionType(t)
    setCorrectOptionIndex(null)
    if (t === 'MULTIPLE_CHOICE') {
      setOptions(['A'])
      setOptionTexts({})
    } else if (t === 'TRUE_FALSE') {
      setOptions(['Đúng', 'Sai'])
      setOptionTexts({})
    } else if (t === 'TEXT') {
      setOptions(['Điền text'])
      setOptionTexts({})
    }
  }

  // Multiple choices: add next letter (A -> B -> C -> D...)
  const handleAddOption = () => {
    if (options.length < 8) {
      const nextLetter = String.fromCharCode(65 + options.length)
      setOptions([...options, nextLetter])
    }
  }

  // Multiple choices: remove the last added letter
  const handleRemoveOption = () => {
    if (options.length > 1) {
      const removedLetter = options[options.length - 1]
      setOptions(options.slice(0, -1))
      setOptionTexts((prev) => {
        const copy = { ...prev }
        delete copy[removedLetter]
        return copy
      })
      if (correctOptionIndex !== null && correctOptionIndex >= options.length - 1) {
        setCorrectOptionIndex(null)
      }
    }
  }

  // Submit poll creation
  const handleCreate = (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = question.trim() || 'Bình chọn nhanh'
    let validOpts: string[] = []

    if (questionType === 'MULTIPLE_CHOICE') {
      validOpts = options.map((letter) => {
        const text = optionTexts[letter]?.trim()
        return text ? `${letter}. ${text}` : letter
      })
    } else if (questionType === 'TRUE_FALSE') {
      validOpts = ['Đúng', 'Sai']
    } else if (questionType === 'TEXT') {
      validOpts = ['Điền text']
    }

    if (validOpts.length === 0) validOpts = ['A']

    onCreatePoll(
      q,
      validOpts,
      selectedDuration,
      allowViewOtherAnswers,
      typeof correctOptionIndex === 'number' ? correctOptionIndex : undefined,
    )

    // Switch to stats tab immediately
    setCreatorTab('stats')
  }

  // Handle student voting
  const handleVoteSubmit = (optionId: string) => {
    if (!poll || !isPollActive) return
    onVote(poll.id, optionId)
    setHasVotedForCurrentPoll(true)
    setVotedOptionId(optionId)
    try {
      sessionStorage.setItem(`c10a7_voted_poll_${poll.id}`, optionId)
    } catch {}
  }

  // Handle student text response submit
  const handleTextAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!poll || !isPollActive || !studentTextAnswer.trim()) return
    const textOptId = poll.options[0]?.id || 'text-option'
    handleVoteSubmit(textOptId)
    try {
      sessionStorage.setItem(`c10a7_poll_text_${poll.id}`, studentTextAnswer.trim())
    } catch {}
  }

  // Calculate vote totals
  const totalVotes = useMemo(() => {
    if (!voteCounts) return 0
    return Object.values(voteCounts).reduce((acc, count) => acc + count, 0)
  }, [voteCounts])

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const isTextPoll = useMemo(() => {
    if (!poll) return questionType === 'TEXT'
    return poll.options.length === 1 && poll.options[0].text === 'Điền text'
  }, [poll, questionType])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-14 sm:pt-20 p-3 sm:p-4"
      style={{ isolation: 'isolate' }}
    >
      <div
        ref={cardRef}
        data-testid="classin-poll-modal"
        className={cn(
          'pointer-events-auto relative w-full max-w-md rounded-2xl border border-border-default bg-surface/95 shadow-2xl backdrop-blur-xl text-text-primary overflow-hidden flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[calc(100vh-7rem)]',
          isDragging ? 'select-none will-change-transform shadow-2xl' : 'transition-transform duration-75 ease-out',
        )}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          boxShadow: isDragging ? '0 25px 50px -12px rgba(0,0,0,0.5)' : undefined,
        }}
      >
        {/* Họa tiết Blueprint Study Schematic mờ chìm */}
        <BlueprintStudyPattern className="opacity-40 pointer-events-none" />

        {/* ── HEADER ── */}
        <div
          onPointerDown={canControl ? handlePointerDown : undefined}
          onPointerMove={canControl && isDragging ? handlePointerMove : undefined}
          onPointerUp={canControl && isDragging ? handlePointerUp : undefined}
          onPointerCancel={canControl && isDragging ? handlePointerUp : undefined}
          className={cn(
            'flex items-center justify-between border-b border-border-subtle bg-surface-overlay/80 px-4 py-3 select-none touch-none',
            canControl ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default',
          )}
          title={canControl ? 'Nhấn giữ và kéo để di chuyển' : undefined}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/20 text-brand ring-1 ring-brand/35 shrink-0">
              <Vote className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-text-primary tracking-tight truncate">
              Bình chọn
            </span>
            {canControl && (
              <GripHorizontal className="h-4 w-4 text-text-tertiary shrink-0 opacity-60" />
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Countdown timer & Status badge */}
            {poll && (
              <>
                {isPollActive && secondsRemaining !== null && (
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-colors',
                      secondsRemaining <= 10
                        ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40 animate-pulse'
                        : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    <span>{formatTimer(secondsRemaining)}</span>
                  </div>
                )}
                <span
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                    isPollActive
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'bg-surface-overlay text-text-tertiary ring-1 ring-border-subtle',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isPollActive ? 'bg-emerald-400 animate-ping' : 'bg-text-tertiary',
                    )}
                  />
                  {isPollActive ? 'Đang mở' : 'Kết thúc'}
                </span>
              </>
            )}

            {/* Nút Ẩn bảng bình chọn (cho cả chủ phòng và người tham gia) */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-text-primary transition-colors cursor-pointer"
              title="Ẩn bảng bình chọn"
              aria-label="Ẩn"
              data-testid="poll-btn-hide"
            >
              <Minus className="h-4 w-4" />
            </button>

            {/* Nút X: Xóa / Đóng bảng bình chọn (CHỈ DÀNH CHO CHỦ PHÒNG / GIÁO VIÊN) */}
            {canControl && (
              <button
                type="button"
                onClick={() => {
                  if (poll && !poll.closed) {
                    onClosePoll()
                  }
                  onOpenChange(false)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-surface hover:text-red-400 transition-colors cursor-pointer"
                title="Đóng bảng bình chọn"
                aria-label="Đóng"
                data-testid="poll-btn-close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── VÙNG 2: 2 TAB CHÍNH DÀNH CHO CHỦ PHÒNG (SOẠN CÂU HỎI & THỐNG KÊ) ── */}
        {canControl && (
          <div className="flex border-b border-border-subtle bg-surface-overlay/50 px-3.5 py-2 gap-2">
            <button
              type="button"
              onClick={() => setCreatorTab('create')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer',
                creatorTab === 'create'
                  ? 'bg-brand text-brand-foreground shadow-sm shadow-brand/25 ring-1 ring-brand/50'
                  : 'bg-surface-raised text-text-secondary hover:bg-surface hover:text-text-primary',
              )}
            >
              <FileQuestion className="size-3.5" />
              <span>Soạn câu hỏi</span>
            </button>
            <button
              type="button"
              onClick={() => setCreatorTab('stats')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative',
                creatorTab === 'stats'
                  ? 'bg-brand text-brand-foreground shadow-sm shadow-brand/25 ring-1 ring-brand/50'
                  : 'bg-surface-raised text-text-secondary hover:bg-surface hover:text-text-primary',
              )}
            >
              <BarChart3 className="size-3.5" />
              <span>Thống kê</span>
              {isPollActive && (
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
              {pollHistory.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-surface-overlay/80 text-text-secondary font-mono">
                  {pollHistory.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── BODY NỘI DUNG ── */}
        <div className="p-3.5 space-y-3 flex-1 min-h-0 max-h-[72vh] overflow-y-auto overscroll-contain styled-scrollbar">
          {/* TAB 1 (CHỦ PHÒNG): SOẠN CÂU HỎI */}
          {canControl && creatorTab === 'create' && (
            <div className="space-y-2.5">
              {/* ── CARD 1: LOẠI CÂU HỎI ── */}
              <div data-testid="poll-type-card" className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <Vote className="size-3.5 text-brand" />
                  <span>Loại câu hỏi</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5" data-testid="poll-templates-grid">
                  <button
                    type="button"
                    onClick={() => handleSelectQuestionType('MULTIPLE_CHOICE')}
                    className={cn(
                      'h-8.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer',
                      questionType === 'MULTIPLE_CHOICE'
                        ? 'bg-brand text-brand-foreground shadow-sm shadow-brand/25 ring-1 ring-brand/50'
                        : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                    )}
                  >
                    Trắc nghiệm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectQuestionType('TRUE_FALSE')}
                    className={cn(
                      'h-8.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer',
                      questionType === 'TRUE_FALSE'
                        ? 'bg-brand text-brand-foreground shadow-sm shadow-brand/25 ring-1 ring-brand/50'
                        : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                    )}
                  >
                    Đúng / Sai
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectQuestionType('TEXT')}
                    className={cn(
                      'h-8.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer',
                      questionType === 'TEXT'
                        ? 'bg-brand text-brand-foreground shadow-sm shadow-brand/25 ring-1 ring-brand/50'
                        : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                    )}
                  >
                    Điền text
                  </button>
                </div>
              </div>

              {/* ── CARD 2: NỘI DUNG CÂU HỎI VÀ TRẢ LỜI ── */}
              <div data-testid="poll-content-card" className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-3 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <FileText className="size-3.5 text-brand" />
                  <span>Nội dung câu hỏi &amp; trả lời</span>
                </div>

                {/* Question title input - giữ nguyên vùng 1 không nhập chữ mẫu vào ô câu hỏi */}
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />

                {/* Multiple choices options grid: 2 đáp án 1 dòng có ô input và nút chọn đáp án đúng */}
                {questionType === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-medium text-text-tertiary">Danh sách đáp án:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {options.map((opt, idx) => {
                        const isCorrect = correctOptionIndex === idx
                        const color = OPTION_COLORS[idx % OPTION_COLORS.length]
                        return (
                          <div
                            key={opt}
                            className={cn(
                              'flex items-center gap-1.5 rounded-xl border p-1.5 bg-surface transition-all',
                              isCorrect
                                ? 'border-emerald-500/80 bg-emerald-500/10 ring-1 ring-emerald-500/50'
                                : 'border-border-default/80 hover:border-border-default',
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setCorrectOptionIndex(isCorrect ? null : idx)}
                              className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs ring-1 transition-all cursor-pointer',
                                isCorrect
                                  ? 'bg-emerald-500 text-white ring-emerald-400 shadow-sm'
                                  : color.bg,
                              )}
                              title={isCorrect ? 'Đáp án đúng (bấm để bỏ chọn)' : 'Bấm để chọn làm đáp án đúng'}
                              aria-label={`Chọn đáp án ${opt} là đáp án đúng`}
                            >
                              {opt}
                            </button>
                            <input
                              type="text"
                              value={optionTexts[opt] ?? ''}
                              onChange={(e) => setOptionTexts({ ...optionTexts, [opt]: e.target.value })}
                              placeholder={`Đáp án ${opt}...`}
                              className="w-full min-w-0 bg-transparent px-1 py-0.5 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
                            />
                            {isCorrect && (
                              <Check className="size-3.5 text-emerald-400 shrink-0 stroke-[3]" />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Hàng nút + (thêm đáp án) và - (xóa đáp án) */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {options.length < 8 && (
                          <button
                            type="button"
                            onClick={handleAddOption}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-lg border border-dashed border-brand/50 bg-brand/10 text-brand text-[11px] font-semibold hover:bg-brand/20 transition-all cursor-pointer"
                            title="Thêm đáp án tiếp theo"
                            aria-label="Thêm đáp án"
                          >
                            <Plus className="size-3.5" />
                            <span>Thêm đáp án</span>
                          </button>
                        )}
                        {options.length > 1 && (
                          <button
                            type="button"
                            onClick={handleRemoveOption}
                            className="flex items-center gap-1 h-7 px-2 rounded-lg border border-dashed border-destructive/50 bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition-all cursor-pointer"
                            title={`Xóa đáp án ${options[options.length - 1]}`}
                            aria-label="Xóa đáp án vừa tạo"
                          >
                            <Minus className="size-3.5" />
                            <span>Xóa {options[options.length - 1]}</span>
                          </button>
                        )}
                      </div>
                      <span className="text-[10.5px] text-text-tertiary">
                        Bấm chữ cái để đánh dấu đáp án đúng
                      </span>
                    </div>
                  </div>
                )}

                {/* True/False options preview & correct answer pick */}
                {questionType === 'TRUE_FALSE' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCorrectOptionIndex(correctOptionIndex === 0 ? null : 0)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border',
                        correctOptionIndex === 0
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm ring-1 ring-emerald-400'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25',
                      )}
                    >
                      {correctOptionIndex === 0 && <Check className="size-3.5 stroke-[3]" />}
                      <span>Đúng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCorrectOptionIndex(correctOptionIndex === 1 ? null : 1)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border',
                        correctOptionIndex === 1
                          ? 'bg-rose-500 text-white border-rose-400 shadow-sm ring-1 ring-rose-400'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25',
                      )}
                    >
                      {correctOptionIndex === 1 && <Check className="size-3.5 stroke-[3]" />}
                      <span>Sai</span>
                    </button>
                  </div>
                )}

                {/* Text question preview */}
                {questionType === 'TEXT' && (
                  <div className="rounded-xl border border-dashed border-border-default bg-surface/50 p-2.5 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
                    <Type className="size-4 text-brand" />
                    <span>Học sinh sẽ nhập câu trả lời dạng văn bản (tự luận ngắn).</span>
                  </div>
                )}
              </div>

              {/* ── CARD 3: BỘ ĐẾM THỜI GIAN (ĐỒNG NHẤT KÍCH THƯỚC) ── */}
              <div data-testid="poll-timer-card" className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                  <Clock className="size-3.5 text-amber-400" />
                  <span>Bộ đếm thời gian</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {TIMER_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDuration(p.seconds)}
                      className={cn(
                        'h-9 w-full rounded-xl text-[11px] font-semibold transition-all cursor-pointer flex flex-col items-center justify-center text-center px-1 leading-tight border',
                        selectedDuration === p.seconds
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/40 shadow-sm font-bold'
                          : 'bg-surface-raised text-text-secondary border-border-subtle hover:bg-surface hover:text-text-primary',
                      )}
                    >
                      <span className="line-clamp-2">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── CARD TÙY CHỌN: CHO PHÉP XEM ĐÁP ÁN CỦA NHAU ── */}
              <div className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 items-center justify-center rounded-lg shrink-0 bg-brand/20 text-brand">
                    <Vote className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary leading-tight">
                      Xem đáp án của người khác
                    </p>
                    <p className="text-[10.5px] text-text-tertiary truncate">
                      {allowViewOtherAnswers
                        ? 'Thí sinh thấy các đáp án khác khi đang làm bài'
                        : 'Ẩn đáp án khác cho đến khi hết giờ'}
                    </p>
                  </div>
                </div>

                {/* Switch toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={allowViewOtherAnswers}
                  onClick={() => setAllowViewOtherAnswers(!allowViewOtherAnswers)}
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    allowViewOtherAnswers ? 'bg-brand' : 'bg-surface-raised border-border-default',
                  )}
                  title={allowViewOtherAnswers ? 'Bấm để tắt' : 'Bấm để bật'}
                >
                  <span
                    className={cn(
                      'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                      allowViewOtherAnswers ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>

              {/* ── CARD 4: BẮT ĐẦU BÌNH CHỌN ── */}
              <div data-testid="poll-action-card" className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-3">
                <button
                  type="button"
                  onClick={() => handleCreate()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md shadow-brand/25 hover:from-brand/90 hover:to-cyan-400 active:scale-[0.99] transition-all cursor-pointer"
                  data-testid="poll-submit-create"
                >
                  <Play className="size-3.5 fill-white" />
                  <span>Bắt đầu bình chọn</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2 (CHỦ PHÒNG): THỐNG KÊ KẾT QUẢ & LỊCH SỬ TỪNG CÂU */}
          {canControl && creatorTab === 'stats' && (
            <div className="space-y-3">
              {/* CURRENT POLL STATS (NẾU ĐANG CÓ POLL) */}
              {poll ? (
                <div data-testid="poll-stats-card" className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
                          Câu hỏi hiện tại
                        </span>
                        {isPollActive && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                            Live
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-text-primary leading-snug">{poll.question}</p>
                      <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5 text-brand" />
                          <span>{totalVotes} lượt tham gia</span>
                        </span>
                        {poll.durationSeconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5 text-amber-400" />
                            <span>{poll.durationSeconds}s</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Options statistics */}
                  {isTextPoll ? (
                    <div className="rounded-xl border border-border-subtle bg-surface-raised/40 p-3 text-center space-y-1">
                      <p className="text-xs font-bold text-text-primary">Câu hỏi điền text</p>
                      <p className="text-xs text-text-secondary">
                        Đã ghi nhận <span className="font-bold text-brand">{totalVotes}</span> học sinh gửi câu trả lời.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {poll.options.map((opt, idx) => {
                        const count = voteCounts?.[opt.id] ?? 0
                        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                        const color = OPTION_COLORS[idx % OPTION_COLORS.length]
                        const isCorrect = poll.correctOptionId === opt.id || opt.isCorrect

                        const match = opt.text.match(/^([A-H])\.\s*(.+)$/)
                        const badgeLetter = match ? match[1] : (opt.text.length <= 2 ? opt.text : String.fromCharCode(65 + idx))
                        const displayText = match ? match[2] : opt.text

                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              'rounded-xl border p-2 space-y-1 transition-colors',
                              isCorrect
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-border-subtle bg-surface-raised/40',
                            )}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {/* KHÔNG ĐƯỢC CHE MẤT CHỮ CÁI ĐÁP ÁN ĐÚNG */}
                                <span
                                  className={cn(
                                    'flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                                    isCorrect ? 'bg-emerald-500 text-white ring-1 ring-emerald-400' : color.bg,
                                  )}
                                >
                                  {badgeLetter}
                                </span>
                                <span className="font-semibold text-text-primary truncate">{displayText}</span>
                                {isCorrect && (
                                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                    <CheckCircle2 className="size-3" />
                                    <span>Đáp án đúng</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-text-secondary shrink-0">
                                <span>{count}</span>
                                <span className="text-brand">({percent}%)</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 w-full rounded-full bg-surface-overlay overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  isCorrect ? 'bg-emerald-500' : color.bar,
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* NÚT KẾT THÚC BÌNH CHỌN TRONG TAB THỐNG KÊ (ĐỂ NGƯNG NGƯỜI THAM GIA TRẢ LỜI) */}
                  <div className="pt-2 border-t border-border-subtle flex flex-col gap-2">
                    {isPollActive && (
                      <button
                        type="button"
                        onClick={onClosePoll}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/15 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/25 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <StopCircle className="size-4" />
                        <span>Kết thúc bình chọn câu này</span>
                      </button>
                    )}

                    {/* NÚT TIẾP TỤC SOẠN CÂU TIẾP THEO */}
                    <button
                      type="button"
                      onClick={() => {
                        setQuestion('')
                        setOptions(['A'])
                        setOptionTexts({})
                        setCorrectOptionIndex(null)
                        setCreatorTab('create')
                      }}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-brand/40 bg-brand/10 py-2.5 text-xs font-bold text-brand hover:bg-brand/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Plus className="size-4" />
                      <span>Soạn câu tiếp theo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border-subtle bg-surface-overlay/30 p-6 text-center space-y-2">
                  <BarChart3 className="size-8 mx-auto text-text-tertiary opacity-50" />
                  <p className="text-xs font-bold text-text-primary">Chưa có bình chọn nào đang diễn ra</p>
                  <p className="text-[11px] text-text-secondary">
                    Chuyển sang tab &quot;Soạn câu hỏi&quot; để bắt đầu câu hỏi mới cho học sinh.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCreatorTab('create')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-brand-foreground text-xs font-bold shadow-sm hover:bg-brand/90 transition-all cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Tạo câu hỏi</span>
                  </button>
                </div>
              )}

              {/* LỊCH SỬ KẾT QUẢ TỪNG CÂU ĐÃ BÌNH CHỌN */}
              {pollHistory.length > 0 && (
                <div className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                    <div className="flex items-center gap-1.5">
                      <History className="size-3.5 text-brand" />
                      <span>Lịch sử các câu đã hỏi ({pollHistory.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPollHistory([])
                        try {
                          sessionStorage.removeItem('c10a7_poll_history')
                        } catch {}
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-text-tertiary hover:text-red-400 transition-colors cursor-pointer"
                      title="Xoá toàn bộ lịch sử bình chọn"
                      aria-label="Xoá lịch sử bình chọn"
                    >
                      <Trash2 className="size-3" />
                      <span>Xoá lịch sử</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto overscroll-contain pr-1.5 styled-scrollbar">
                    {pollHistory.map((item, hIdx) => {
                      const isExpanded = expandedHistoryId === item.id
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-border-subtle bg-surface-raised/40 p-2.5 space-y-2"
                        >
                          <div
                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                            className="flex items-start justify-between gap-2 cursor-pointer select-none"
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                                Câu {pollHistory.length - hIdx}
                              </span>
                              <p className="text-xs font-semibold text-text-primary line-clamp-1">{item.question}</p>
                              <p className="text-[10.5px] text-text-tertiary">
                                {item.totalVotes} lượt tham gia • {item.options.length} lựa chọn
                              </p>
                            </div>
                            <button
                              type="button"
                              className="text-text-tertiary hover:text-text-primary p-0.5 cursor-pointer shrink-0"
                            >
                              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                            </button>
                          </div>

                          {/* Expanded detailed stats for this past poll */}
                          {isExpanded && (
                            <div className="space-y-1.5 pt-2 border-t border-border-subtle/80">
                              {item.options.map((opt, oIdx) => {
                                const color = OPTION_COLORS[oIdx % OPTION_COLORS.length]
                                const match = opt.text.match(/^([A-H])\.\s*(.+)$/)
                                const badgeLetter = match ? match[1] : (opt.text.length <= 2 ? opt.text : String.fromCharCode(65 + oIdx))
                                const displayText = match ? match[2] : opt.text

                                return (
                                  <div key={opt.id} className="space-y-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span
                                          className={cn(
                                            'flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold',
                                            opt.isCorrect ? 'bg-emerald-500 text-white ring-1 ring-emerald-400' : color.bg,
                                          )}
                                        >
                                          {badgeLetter}
                                        </span>
                                        <span className="truncate text-text-primary">{displayText}</span>
                                        {opt.isCorrect && (
                                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1 py-0.2 rounded shrink-0">
                                            Đáp án đúng
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-mono font-bold text-text-secondary">
                                        {opt.count} ({opt.percent}%)
                                      </span>
                                    </div>
                                    <div className="h-1 w-full rounded-full bg-surface-overlay overflow-hidden">
                                      <div
                                        className={cn('h-full rounded-full', opt.isCorrect ? 'bg-emerald-500' : color.bar)}
                                        style={{ width: `${opt.percent}%` }}
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VÙNG 1: MÀN HÌNH DÀNH CHO THÍ SINH / HỌC SINH (!canControl) ── */}
          {!canControl && poll && (
            <div data-testid="poll-stats-card" className="rounded-xl border border-border-default/80 bg-surface-overlay/50 p-3.5 space-y-3">
              {/* Question title & metadata (ĐÃ XÓA DÒNG ẨN/CÔNG KHAI ĐÁP ÁN) */}
              <div className="border-b border-border-subtle pb-2.5 space-y-1">
                <p className="text-xs sm:text-sm font-bold text-text-primary leading-snug">{poll.question}</p>
                <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5 text-brand" />
                    <span>{totalVotes} lượt tham gia</span>
                  </span>
                  {poll.durationSeconds && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-amber-400" />
                      <span>{poll.durationSeconds}s</span>
                    </span>
                  )}
                </div>
              </div>

              {/* STUDENT VOTING (KHI CHƯA CHỌN ĐÁP ÁN & POLL ĐANG MỞ) */}
              {isPollActive && !hasVotedForCurrentPoll && (
                <div className="space-y-2.5 pt-1">
                  {isTextPoll ? (
                    <form onSubmit={handleTextAnswerSubmit} className="space-y-2">
                      <input
                        type="text"
                        value={studentTextAnswer}
                        onChange={(e) => setStudentTextAnswer(e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        required
                      />
                      <button
                        type="submit"
                        disabled={!studentTextAnswer.trim()}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-2 text-xs font-bold text-brand-foreground shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        Gửi câu trả lời
                      </button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {poll.options.map((opt, idx) => {
                        const color = OPTION_COLORS[idx % OPTION_COLORS.length]
                        const isSelected = selectedOptionId === opt.id
                        const match = opt.text.match(/^([A-H])\.\s*(.+)$/)
                        const badgeLetter = match ? match[1] : (opt.text.length <= 2 ? opt.text : String.fromCharCode(65 + idx))
                        const displayText = match ? match[2] : opt.text

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setSelectedOptionId(opt.id)
                              handleVoteSubmit(opt.id)
                            }}
                            className={cn(
                              'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer',
                              isSelected
                                ? 'border-brand bg-brand/15 text-text-primary shadow-sm ring-1 ring-brand/40'
                                : 'border-border-default bg-surface-raised hover:border-brand/40 hover:bg-surface',
                            )}
                          >
                            <span
                              className={cn(
                                'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1',
                                color.bg,
                              )}
                            >
                              {badgeLetter}
                            </span>
                            <span className="text-xs font-semibold text-text-primary flex-1 truncate">
                              {displayText}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STUDENT VOTED CONFIRMATION (ĐÃ XÓA ĐẾM NGƯỢC CÒN ...S) */}
              {isPollActive && hasVotedForCurrentPoll && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center space-y-1">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-emerald-400">Đã gửi câu trả lời</p>
                  {studentTextAnswer && (
                    <p className="text-xs text-text-primary font-medium">“{studentTextAnswer}”</p>
                  )}
                  {!poll.allowViewOtherAnswers && (
                    <p className="text-[10.5px] text-text-tertiary pt-1 italic">
                      Người soạn đã tắt xem trước đáp án. Kết quả bình chọn sẽ hiển thị sau khi hết giờ.
                    </p>
                  )}
                </div>
              )}

              {/* THỐNG KÊ KẾT QUẢ CHO THÍ SINH (KHI ĐƯỢC PHÉP HOẶC KHI POLL KẾT THÚC) */}
              {(poll.closed || (hasVotedForCurrentPoll && poll.allowViewOtherAnswers)) && (
                <div className="space-y-2 pt-1">
                  {isTextPoll ? (
                    <div className="rounded-xl border border-border-subtle bg-surface-raised/40 p-3 text-center space-y-1">
                      <p className="text-xs font-bold text-text-primary">Câu hỏi điền text</p>
                      <p className="text-xs text-text-secondary">
                        Đã ghi nhận <span className="font-bold text-brand">{totalVotes}</span> học sinh gửi câu trả lời.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {poll.options.map((opt, idx) => {
                        const count = voteCounts?.[opt.id] ?? 0
                        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
                        const color = OPTION_COLORS[idx % OPTION_COLORS.length]
                        const isMyPick = votedOptionId === opt.id
                        const isCorrect = (poll.correctOptionId === opt.id || opt.isCorrect) && poll.closed

                        const match = opt.text.match(/^([A-H])\.\s*(.+)$/)
                        const badgeLetter = match ? match[1] : (opt.text.length <= 2 ? opt.text : String.fromCharCode(65 + idx))
                        const displayText = match ? match[2] : opt.text

                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              'rounded-xl border p-2 space-y-1 transition-colors',
                              isCorrect
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-border-subtle bg-surface-raised/40',
                            )}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {/* KHÔNG ĐƯỢC CHE MẤT CHỮ CÁI ĐÁP ÁN ĐÚNG */}
                                <span
                                  className={cn(
                                    'flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                                    isCorrect ? 'bg-emerald-500 text-white ring-1 ring-emerald-400' : color.bg,
                                  )}
                                >
                                  {badgeLetter}
                                </span>
                                <span className="font-semibold text-text-primary truncate">{displayText}</span>
                                {isMyPick && (
                                  <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/15 px-1.5 py-0.5 rounded-full shrink-0">
                                    Bạn chọn
                                  </span>
                                )}
                                {isCorrect && (
                                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                                    <CheckCircle2 className="size-3" />
                                    <span>Đáp án đúng</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-text-secondary shrink-0">
                                <span>{count}</span>
                                <span className="text-brand">({percent}%)</span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 w-full rounded-full bg-surface-overlay overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  isCorrect ? 'bg-emerald-500' : color.bar,
                                )}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
