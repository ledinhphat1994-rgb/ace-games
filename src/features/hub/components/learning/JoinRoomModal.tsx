import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Vào phòng học</DialogTitle>
          <DialogDescription>Dán liên kết bạn bè gửi, hoặc nhập số ID của phòng.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-id-input" className="text-sm font-medium">
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
              placeholder="Ví dụ: 42 hoặc /room/phong-42"
              aria-invalid={error ? true : undefined}
            />
            {error && (
              <p className="flex items-start gap-1.5 text-sm text-destructive" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" data-testid="join-room-submit-btn" disabled={!targetInput.trim()}>
              Vào phòng
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
