import { useState } from 'react'
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, ListTodo } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SessionTask } from '@shared/protocol/room'

interface SessionTaskListProps {
  tasks: SessionTask[]
  completionMap: Record<string, number[]>
  currentAccountId: number
  canControl: boolean
  onAddTask: (text: string) => void
  onRemoveTask: (taskId: string) => void
  onTickTask: (taskId: string) => void
  onUntickTask: (taskId: string) => void
}

export function SessionTaskList({
  tasks,
  completionMap,
  currentAccountId,
  canControl,
  onAddTask,
  onRemoveTask,
  onTickTask,
  onUntickTask,
}: SessionTaskListProps) {
  const [newText, setNewText] = useState('')

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = newText.trim()
    if (!trimmed || tasks.length >= 30) return
    onAddTask(trimmed)
    setNewText('')
  }

  // Số task user hiện tại đã hoàn thành
  const myCompletedCount = tasks.filter((t) =>
    (completionMap[t.id] || []).includes(currentAccountId),
  ).length
  const progressPercent =
    tasks.length > 0 ? Math.round((myCompletedCount / tasks.length) * 100) : 0

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-md transition-all">
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <ListTodo className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              Nhiệm vụ buổi học
            </h4>
          </div>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs font-semibold text-muted-foreground">
            {myCompletedCount}/{tasks.length} ({progressPercent}%)
          </span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Task input for controllers */}
      {canControl && (
        <form onSubmit={handleAdd} className="mb-3 flex items-center gap-2">
          <Input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={
              tasks.length >= 30
                ? 'Đã đạt giới hạn 30 nhiệm vụ'
                : 'Thêm nhiệm vụ mới (nhấn Enter)...'
            }
            disabled={tasks.length >= 30}
            maxLength={300}
            className="h-8 text-xs"
          />
          <Button
            type="submit"
            size="xs"
            disabled={!newText.trim() || tasks.length >= 30}
            className="h-8 shrink-0 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Thêm
          </Button>
        </form>
      )}

      {/* Task list items */}
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
        {tasks.map((task) => {
          const completedBy = completionMap[task.id] || []
          const isDone = completedBy.includes(currentAccountId)
          const otherCount = completedBy.length

          return (
            <div
              key={task.id}
              className={`group flex items-center justify-between gap-2.5 rounded-lg border px-3 py-2 text-xs transition-all ${
                isDone
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-muted-foreground'
                  : 'border-border/30 bg-background/50 text-foreground hover:bg-accent/40'
              }`}
            >
              <button
                type="button"
                onClick={() => (isDone ? onUntickTask(task.id) : onTickTask(task.id))}
                className="flex items-center gap-2 text-left flex-1 min-w-0"
              >
                {isDone ? (
                  <CheckSquare className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <Square className="h-4 w-4 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                )}
                <span
                  className={`truncate leading-snug ${
                    isDone ? 'line-through text-muted-foreground/70' : 'font-medium'
                  }`}
                >
                  {task.text}
                </span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {otherCount > 0 && (
                  <span
                    className="flex items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    title={`${otherCount} bạn đã hoàn thành nhiệm vụ này`}
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{otherCount}</span>
                  </span>
                )}

                {canControl && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemoveTask(task.id)}
                    title="Xóa nhiệm vụ"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {tasks.length === 0 && (
          <div className="py-5 text-center text-xs text-muted-foreground">
            Chưa có nhiệm vụ nào trong danh sách.
          </div>
        )}
      </div>
    </div>
  )
}
