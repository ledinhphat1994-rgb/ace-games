import { useState } from 'react'
import { Target, Check, Trash2, Edit2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SessionGoal } from '@shared/protocol/room'

interface SessionGoalProps {
  goal: SessionGoal | null
  canControl: boolean
  onSetGoal: (text: string) => void
  onClearGoal: () => void
}

export function SessionGoalWidget({
  goal,
  canControl,
  onSetGoal,
  onClearGoal,
}: SessionGoalProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')

  const handleStartEdit = () => {
    setText(goal?.text || '')
    setEditing(true)
  }

  const handleSave = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSetGoal(trimmed)
    setEditing(false)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setEditing(false)
    }
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Target className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            Mục tiêu buổi học
          </h4>
        </div>
        {canControl && goal && !editing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleStartEdit}
              title="Sửa mục tiêu"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClearGoal}
              title="Xóa mục tiêu"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-1 space-y-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ví dụ: Ôn tập chương 3 Hình học & giải 5 bài tập..."
            maxLength={500}
            className="text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setEditing(false)}
            >
              Hủy
            </Button>
            <Button
              size="xs"
              onClick={handleSave}
              disabled={!text.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              Lưu
            </Button>
          </div>
        </div>
      ) : goal ? (
        <div className="mt-1">
          <p className="text-sm font-medium leading-relaxed text-foreground">
            {goal.text}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <span>Đặt bởi <strong className="text-foreground/80">{goal.setBy}</strong></span>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-center py-2">
          <p className="text-xs text-muted-foreground">
            Chưa có mục tiêu nào được đặt cho buổi học này.
          </p>
          {canControl && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleStartEdit}
              className="mt-2 text-xs border-dashed border-emerald-500/40 text-emerald-600 hover:text-emerald-500"
            >
              <Target className="mr-1 h-3.5 w-3.5" />
              Đặt mục tiêu ngay
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
