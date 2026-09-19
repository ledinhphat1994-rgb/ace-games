import { useState } from 'react'
import { Vote, Plus, Minus, CheckCircle, Lock, BarChart3, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ActivePoll } from '@shared/protocol/room'

interface SessionPollProps {
  poll: ActivePoll | null
  voteCounts: Record<string, number> | null
  currentAccountId: number
  canControl: boolean
  onCreatePoll: (question: string, options: string[]) => void
  onVote: (pollId: string, optionId: string) => void
  onClosePoll: () => void
}

export function SessionPoll({
  poll,
  voteCounts,
  canControl,
  onCreatePoll,
  onVote,
  onClosePoll,
}: SessionPollProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)

  // Form creation state
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx))
    }
  }

  const handleOptionChange = (idx: number, val: string) => {
    const next = [...options]
    next[idx] = val
    setOptions(next)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    const validOpts = options.map((o) => o.trim()).filter(Boolean)
    if (!q || validOpts.length < 2) return

    onCreatePoll(q, validOpts)
    setQuestion('')
    setOptions(['', ''])
    setHasVoted(false)
    setSelectedOption(null)
  }

  const handleVoteSubmit = () => {
    if (!poll || !selectedOption || poll.closed) return
    onVote(poll.id, selectedOption)
    setHasVoted(true)
  }

  // Calculate total votes for percentage
  const totalVotes = voteCounts
    ? Object.values(voteCounts).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
            <Vote className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Bình chọn nhanh
          </h4>
        </div>
        {poll && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              poll.closed
                ? 'bg-muted text-muted-foreground'
                : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
            }`}
          >
            {poll.closed ? 'Đã kết thúc' : 'Đang mở'}
          </span>
        )}
      </div>

      {poll ? (
        <div className="mt-2 space-y-3">
          <div>
            <p className="text-sm font-bold text-foreground leading-snug">
              {poll.question}
            </p>
            <span className="text-[11px] text-muted-foreground">
              Tạo bởi {poll.createdBy}
            </span>
          </div>

          {/* Options list */}
          <div className="space-y-2">
            {poll.options.map((opt) => {
              const count = voteCounts ? voteCounts[opt.id] || 0 : 0
              const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const showResults = Boolean(poll.closed || voteCounts)

              return (
                <div
                  key={opt.id}
                  className={`relative overflow-hidden rounded-lg border p-2.5 text-xs transition-all ${
                    selectedOption === opt.id
                      ? 'border-purple-500/60 bg-purple-500/10'
                      : 'border-border/30 bg-background/50 hover:bg-accent/30'
                  }`}
                >
                  {/* Progress bar background when results are visible */}
                  {showResults && (
                    <div
                      className="absolute inset-y-0 left-0 bg-purple-500/15 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  )}

                  <div className="relative flex items-center justify-between gap-2">
                    <button
                      type="button"
                      disabled={poll.closed || hasVoted}
                      onClick={() => setSelectedOption(opt.id)}
                      className="flex items-center gap-2 flex-1 text-left disabled:cursor-default"
                    >
                      <Radio
                        className={`h-3.5 w-3.5 shrink-0 ${
                          selectedOption === opt.id
                            ? 'text-purple-500 fill-purple-500'
                            : 'text-muted-foreground/60'
                        }`}
                      />
                      <span className="font-medium text-foreground">{opt.text}</span>
                    </button>

                    {showResults && (
                      <span className="font-semibold text-foreground/80 shrink-0">
                        {count} ({percent}%)
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 gap-2">
            {!poll.closed && !hasVoted && (
              <Button
                size="xs"
                onClick={handleVoteSubmit}
                disabled={!selectedOption}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Gửi bình chọn
              </Button>
            )}

            {hasVoted && !poll.closed && (
              <span className="text-xs text-emerald-500 font-medium">
                ✓ Bạn đã bình chọn thành công
              </span>
            )}

            {canControl && !poll.closed && (
              <Button
                variant="outline"
                size="xs"
                onClick={onClosePoll}
                className="border-border/40 text-muted-foreground hover:text-foreground ml-auto"
              >
                <Lock className="mr-1 h-3.5 w-3.5" />
                Đóng bình chọn
              </Button>
            )}
          </div>
        </div>
      ) : canControl ? (
        <form onSubmit={handleCreate} className="mt-2 space-y-2.5">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Câu hỏi bình chọn
            </label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nhập câu hỏi (ví dụ: Các bạn đã hiểu bài này chưa?)..."
              maxLength={500}
              className="mt-1 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Các lựa chọn (2 - 4)
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Lựa chọn ${idx + 1}`}
                  maxLength={200}
                  className="h-8 text-xs"
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleRemoveOption(idx)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            {options.length < 4 ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleAddOption}
                className="text-xs text-purple-600 hover:text-purple-500"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Thêm lựa chọn
              </Button>
            ) : <div />}

            <Button
              type="submit"
              size="xs"
              disabled={
                !question.trim() ||
                options.map((o) => o.trim()).filter(Boolean).length < 2
              }
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <BarChart3 className="mr-1 h-3.5 w-3.5" />
              Tạo bình chọn
            </Button>
          </div>
        </form>
      ) : (
        <div className="py-4 text-center text-xs text-muted-foreground">
          Hiện không có cuộc bình chọn nào đang diễn ra.
        </div>
      )}
    </div>
  )
}
