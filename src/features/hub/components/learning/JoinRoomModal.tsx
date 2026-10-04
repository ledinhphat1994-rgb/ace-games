import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BlueprintStudyPattern } from '@/components/ui/blueprint-patterns'
import { AlertCircle, LogIn } from 'lucide-react'
import { parseRoomJoinTarget } from '@/features/hub/learning-semantics'

interface JoinRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoinRoomId: (roomId: number) => void
}

export function JoinRoomModal({ open, onOpenChange, onJoinRoomId }: JoinRoomModalProps) {
  const [targetInput, setTargetInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const currentOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : undefined
    const result = parseRoomJoinTarget(targetInput, currentOrigin)
    if (!result.ok || !result.roomId) {
      setError(result.error || 'Mục tiêu phòng học không hợp lệ.')
      return
    }
    setError(null)
    setTargetInput('')
    onJoinRoomId(result.roomId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          top: '72px',
          translate: '-50% 0',
          transform: 'none',
          maxHeight: 'min(420px, calc(100svh - 88px))',
        }}
        className="w-[min(420px,calc(100vw-2rem))] p-6 rounded-2xl skeuo-modal-surface flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        {/* Họa tiết Blueprint Study Schematic mờ chìm toàn diện */}
        <BlueprintStudyPattern className="opacity-80" />

        <DialogHeader className="relative z-10 shrink-0 pb-3 border-b border-sky-500/15">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <LogIn className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-white tracking-wide">
              Vào phòng học
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Vào phòng học
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col flex-1 min-h-0 justify-between mt-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="room-id-input" className="text-xs font-semibold text-slate-300">
                Mã ID hoặc liên kết phòng
              </label>
              <input
                id="room-id-input"
                data-testid="join-room-input"
                value={targetInput}
                onChange={(e) => {
                  setTargetInput(e.target.value)
                  setError(null)
                }}
                placeholder="Nhập ID (ví dụ: 42) hoặc link phòng..."
                aria-invalid={error ? true : undefined}
                className="skeuo-input-deep w-full h-10 px-3.5 text-sm"
              />
            </div>
            {error && (
              <p className="flex items-start gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/30 px-3 py-2 rounded-xl leading-relaxed" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <div className="shrink-0 pt-4 mt-4 border-t border-sky-500/15 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="skeuo-btn-cancel h-10 px-5 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="join-room-submit-btn"
              disabled={!targetInput.trim()}
              className="skeuo-btn-cta-amber h-10 px-6 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vào phòng ngay
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
