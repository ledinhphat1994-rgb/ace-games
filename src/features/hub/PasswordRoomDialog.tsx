/**
 * Dialog nhập mật khẩu khi vào phòng học bảo vệ.
 *
 * Flow:
 *   user nhấn "Vào phòng" → dialog mở
 *   → nhập mật khẩu → POST /api/rooms/:id/admit
 *   → server set cookie HttpOnly → điều hướng vào phòng
 *   → WS kết nối tự động gửi cookie
 *
 * Bảo mật:
 *   - Mật khẩu không được lưu state giữa các lần mở
 *   - Không lưu password vào URL, localStorage, sessionStorage, toast, hay query cache
 *   - Cookie là HttpOnly, JS không đọc được
 */
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import type { PhongSanh } from '@shared/protocol/campus'
import { AlertCircle, Loader2, Lock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PasswordRoomDialogProps {
  room: PhongSanh | null
  onClose: () => void
  /** Nhận MÃ SỐ phòng đã được cấp quyền (trước đây truyền cả object → điều hướng tới "/room/phong-[object Object]"). */
  onSuccess: (roomId: number) => void
}

export function PasswordRoomDialog({ room, onClose, onSuccess }: PasswordRoomDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [prevRoomId, setPrevRoomId] = useState<number | null>(null)
  if (room && room.id !== prevRoomId) {
    setPrevRoomId(room.id)
    setPassword('')
    setError(null)
    setLoading(false)
  }

  // Focus sau khi dialog animate vào (không dùng autoFocus để tránh cuộn trang)
  useEffect(() => {
    if (room) {
      const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80)
      return () => clearTimeout(t)
    }
  }, [room])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room || loading) return

    const pw = password
    if (!pw.trim()) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/rooms/${room.id}/admit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',   // cookie session tự động gửi
        body: JSON.stringify({ password: pw }),
      })

      if (res.ok) {
        // Cookie đã được server set, JS không đọc được (HttpOnly)
        // Xóa password khỏi state trước khi navigate
        setPassword('')
        onSuccess(room.id)
      } else {
        const data = await res.json().catch(() => ({})) as { message?: string }
        if (res.status === 429) {
          setError('Thử sai quá nhiều lần. Vui lòng đợi 5 phút.')
        } else if (res.status === 403) {
          setError('Mật khẩu không đúng. Vui lòng thử lại.')
        } else {
          setError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
        }
        // Không navigate — ở lại dialog
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setPassword('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={!!room} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-sm" aria-describedby="pw-dialog-desc">
        <DialogHeader>
          <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-warning-muted text-warning">
            <Lock className="size-[18px]" />
          </span>
          <DialogTitle>Phòng có mật khẩu</DialogTitle>
          <DialogDescription id="pw-dialog-desc">
            Nhập mật khẩu để vào <span className="font-medium break-words text-text-primary">{room?.ten}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-password-input" className="text-sm font-medium">Mật khẩu phòng</Label>
            <PasswordInput
              id="room-password-input"
              ref={inputRef}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null) }}
              placeholder="Nhập mật khẩu phòng"
              disabled={loading}
              autoComplete="off"
            />
            {error && (
              <p className="flex items-start gap-1.5 text-sm text-destructive" role="alert">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={loading} onClick={handleClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={loading || !password.trim()}>
              {loading ? (
                <><Loader2 className="animate-spin" /> Đang kiểm tra…</>
              ) : (
                'Vào phòng'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
