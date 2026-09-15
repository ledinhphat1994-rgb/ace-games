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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PhongSanh } from '@shared/protocol/campus'
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PasswordRoomDialogProps {
  room: PhongSanh | null
  onClose: () => void
  onSuccess: (room: PhongSanh) => void
}

export function PasswordRoomDialog({ room, onClose, onSuccess }: PasswordRoomDialogProps) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [prevRoomId, setPrevRoomId] = useState<number | null>(null)
  if (room && room.id !== prevRoomId) {
    setPrevRoomId(room.id)
    setPassword('')
    setError(null)
    setLoading(false)
    setShowPw(false)
  }

  // Focus sau khi dialog animate vào
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
        onSuccess(room)
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit(e)
    if (e.key === 'Escape') handleClose()
  }

  const handleClose = () => {
    if (loading) return
    setPassword('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={!!room} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent
        className="sm:max-w-sm"
        onKeyDown={handleKeyDown}
        aria-describedby="pw-dialog-desc"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400" />
            Phòng học bảo vệ
          </DialogTitle>
          <DialogDescription id="pw-dialog-desc">
            <span className="font-medium text-foreground">{room?.ten}</span>
            {' '}— yêu cầu mật khẩu để vào.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="room-password-input">Mật khẩu phòng</Label>
            <div className="relative">
              <Input
                id="room-password-input"
                ref={inputRef}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder="Nhập mật khẩu phòng học..."
                disabled={loading}
                className="pr-10"
                autoComplete="off"
                // Do NOT use autoFocus — use programmatic focus with preventScroll
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-destructive" role="alert">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={handleClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !password.trim()}
              className="gap-1.5"
            >
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang xác thực…</>
              ) : (
                'Vào phòng'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
