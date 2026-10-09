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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PasswordInput } from '@/components/ui/password-input'
import { BlueprintStudyPattern } from '@/components/ui/blueprint-patterns'
import type { PhongSanh } from '@shared/protocol/campus'
import { AlertCircle, Loader2, Lock } from 'lucide-react'
import { useRef, useState } from 'react'

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
      <DialogContent
        style={{
          top: '72px',
          translate: '-50% 0',
          transform: 'none',
          maxHeight: 'min(420px, calc(100svh - 88px))',
        }}
        className="w-[min(420px,calc(100vw-2rem))] p-6 rounded-2xl skeuo-modal-surface flex flex-col justify-between overflow-hidden shadow-2xl"
        aria-describedby={undefined}
      >
        {/* Họa tiết Blueprint Study Schematic mờ chìm toàn diện */}
        <BlueprintStudyPattern className="opacity-80" />

        <DialogHeader className="relative z-10 shrink-0 pb-3 border-b border-sky-500/15">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Lock className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-white tracking-wide">
              Mật khẩu phòng
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Mật khẩu phòng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col flex-1 min-h-0 justify-between mt-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="room-password-input" className="text-xs font-semibold text-slate-300">
                Nhập mật khẩu
              </label>
              <PasswordInput
                id="room-password-input"
                ref={inputRef}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder="Mật khẩu phòng..."
                disabled={loading}
                autoComplete="off"
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
              disabled={loading}
              onClick={handleClose}
              className="skeuo-btn-cancel h-10 px-5 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="skeuo-btn-cta-amber h-10 px-6 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang kiểm tra…
                </>
              ) : (
                'Vào phòng ngay'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
