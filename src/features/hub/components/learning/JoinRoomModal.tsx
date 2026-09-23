import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn } from 'lucide-react'
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
    const result = parseRoomJoinTarget(targetInput)
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
      <DialogContent className="max-w-sm border border-white/10 bg-[#0d1424] p-5 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
            <LogIn className="h-4 w-4 text-cyan-400" />
            <span>Vào phòng học</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Nhập ID hoặc liên kết phòng để tham gia trực tiếp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="room-id-input" className="text-xs text-slate-300">
              ID hoặc liên kết phòng
            </Label>
            <Input
              id="room-id-input"
              data-testid="join-room-input"
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value)
                setError(null)
              }}
              placeholder="VD: 42, phong-42 hoặc /room/phong-42"
              className="mt-1.5 h-9 border-white/15 bg-white/5 text-sm text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/40"
            />
            {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              data-testid="join-room-submit-btn"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              Vào phòng
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
