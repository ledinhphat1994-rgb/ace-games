import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PasswordInput } from '@/components/ui/password-input'
import { BlueprintStudyPattern } from '@/components/ui/blueprint-patterns'
import { AlertCircle, BookOpen, Globe, Loader2, Lock, Users } from 'lucide-react'

export interface CreateStudyRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (roomId: number) => void
}

export function CreateStudyRoomDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateStudyRoomDialogProps) {
  const navigate = useNavigate()

  const [ten, setTen] = useState('')
  const [accessMode, setAccessMode] = useState<'public' | 'password'>('public')
  const [password, setPassword] = useState('')
  const [sucChua, setSucChua] = useState(20)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setTen('')
    setAccessMode('public')
    setPassword('')
    setSucChua(20)
    setError(null)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const cleanTen = ten.trim()
    if (!cleanTen || cleanTen.length < 2) {
      setError('Tên phòng học phải từ 2 ký tự trở lên.')
      return
    }
    if (cleanTen.length > 100) {
      setError('Tên phòng tối đa 100 ký tự.')
      return
    }

    if (accessMode === 'password') {
      const cleanPw = password.trim()
      if (!cleanPw || cleanPw.length < 4) {
        setError('Mật khẩu phòng học phải có ít nhất 4 ký tự.')
        return
      }
    }

    const capNum = Number(sucChua)
    if (isNaN(capNum) || capNum < 2 || capNum > 100) {
      setError('Sức chứa phòng học từ 2 đến 100 người.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 1. Canonical room creation: POST /api/rooms
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          ten: cleanTen,
          phamVi: 'truong',
          accessMode,
          password: accessMode === 'password' ? password.trim() : undefined,
          sucChua: capNum,
        }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          loi?: string
          error?: string
          message?: string
        }
        const errMsg =
          data.loi ||
          data.error ||
          data.message ||
          (res.status === 503
            ? 'Không thể khởi tạo chu kỳ hoạt động của phòng học. Vui lòng thử lại.'
            : `Không thể tạo phòng (${res.status}). Vui lòng kiểm tra lại.`)
        setError(errMsg)
        setIsSubmitting(false)
        return
      }

      const resData = (await res.json()) as {
        ok: boolean
        room: { id: number; accessMode: string }
      }
      const createdId = resData.room.id

      // 2. If password-protected: perform canonical admission before navigating
      if (accessMode === 'password') {
        const admitRes = await fetch(`/api/rooms/${createdId}/admit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ password: password.trim() }),
        })

        if (!admitRes.ok) {
          const admitData = (await admitRes.json().catch(() => ({}))) as {
            loi?: string
            message?: string
          }
          setError(
            admitData.loi ||
              admitData.message ||
              'Đã tạo phòng nhưng không thể cấp quyền truy cập mật khẩu.',
          )
          setIsSubmitting(false)
          return
        }
      }

      // 3. Success: close dialog and navigate to real numeric room
      resetForm()
      onOpenChange(false)

      if (onSuccess) {
        onSuccess(createdId)
      } else {
        navigate(`/room/phong-${createdId}`)
      }
    } catch {
      setError('Lỗi kết nối máy chủ khi tạo phòng học. Vui lòng thử lại.')
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent
        data-testid="create-room-dialog"
        showCloseButton={!isSubmitting}
        style={{
          top: '72px',
          translate: '-50% 0',
          transform: 'none',
          maxHeight: 'min(620px, calc(100svh - 88px))',
        }}
        className="w-[min(480px,calc(100vw-2rem))] h-[min(600px,calc(100svh-88px))] p-6 rounded-2xl skeuo-modal-surface flex flex-col justify-between overflow-hidden shadow-2xl"
      >
        {/* Họa tiết Blueprint Study Schematic mờ chìm toàn diện */}
        <BlueprintStudyPattern className="opacity-80" />

        <DialogHeader className="relative z-10 shrink-0 pb-3 border-b border-sky-500/15">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <BookOpen className="size-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-white tracking-wide">
              Tạo phòng học
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            Tạo phòng học
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col flex-1 min-h-0 justify-between mt-4">
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Tên phòng */}
            <div className="space-y-1.5">
              <label htmlFor="room-ten" className="text-xs font-semibold text-slate-300">
                Tên phòng
              </label>
              <input
                id="room-ten"
                data-testid="create-room-name-input"
                value={ten}
                onChange={(e) => {
                  setTen(e.target.value)
                  setError(null)
                }}
                placeholder="Nhập tên phòng học..."
                disabled={isSubmitting}
                maxLength={100}
                className="skeuo-input-deep w-full h-10 px-3.5 text-sm"
              />
            </div>

            <div data-testid="create-room-advanced-section" className="space-y-4">
              {/* Loại phòng: Lưới 2 cột cân đối */}
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold text-slate-300">Chế độ phòng</legend>
                <div className="grid grid-cols-2 gap-2.5">
                  <TheLuaChon
                    testId="create-room-mode-public"
                    chon={accessMode === 'public'}
                    onChon={() => setAccessMode('public')}
                    disabled={isSubmitting}
                    icon={<Globe className="size-4" />}
                    tieuDe="Công khai"
                  />
                  <TheLuaChon
                    testId="create-room-mode-password"
                    chon={accessMode === 'password'}
                    onChon={() => setAccessMode('password')}
                    disabled={isSubmitting}
                    icon={<Lock className="size-4" />}
                    tieuDe="Riêng tư"
                  />
                </div>
              </fieldset>

              {/* Vùng Mật khẩu: KHÓA CHIỀU CAO CỐ ĐỊNH (Reserved slot h-[66px]) CHỐNG SỤT LÚN */}
              <div className="h-[66px] flex flex-col justify-end">
                {accessMode === 'password' ? (
                  <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                    <label htmlFor="room-password" className="text-xs font-semibold text-slate-300">
                      Mật khẩu phòng
                    </label>
                    <PasswordInput
                      id="room-password"
                      data-testid="create-room-password-input"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError(null)
                      }}
                      placeholder="Nhập mật khẩu..."
                      disabled={isSubmitting}
                      maxLength={50}
                      className="skeuo-input-deep h-10 px-3.5 text-sm"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-400">
                      Mật khẩu phòng
                    </span>
                    <div className="h-10 px-3.5 rounded-xl border border-sky-500/10 bg-slate-900/40 flex items-center text-xs text-slate-400">
                      Phòng mở tự do (Không cần mật khẩu)
                    </div>
                  </div>
                )}
              </div>

              {/* Sức chứa tối đa: Điều khiển tinh gọn 1 hàng */}
              <div className="space-y-1.5">
                <label htmlFor="room-capacity" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Users className="size-3.5 text-sky-400" />
                  Sức chứa tối đa
                </label>
                <div className="skeuo-inline-row h-10 px-3">
                  <span className="text-xs text-slate-300 font-medium">Số người tham gia</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting || sucChua <= 2}
                      onClick={() => setSucChua((prev) => Math.max(2, prev - 5))}
                      className="size-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      id="room-capacity"
                      data-testid="create-room-capacity-input"
                      type="number"
                      inputMode="numeric"
                      min={2}
                      max={100}
                      value={sucChua}
                      onChange={(e) => setSucChua(Math.min(100, Math.max(2, parseInt(e.target.value, 10) || 2)))}
                      disabled={isSubmitting}
                      className="w-12 text-center text-sm font-bold text-amber-300 bg-transparent tabular-nums border-none outline-none"
                    />
                    <button
                      type="button"
                      disabled={isSubmitting || sucChua >= 100}
                      onClick={() => setSucChua((prev) => Math.min(100, prev + 5))}
                      className="size-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p
                data-testid="create-room-error"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Footer CTA: Khoảng cách >= 14px, Nút vàng mật ong 3D Amber */}
          <div className="shrink-0 pt-4 mt-3 border-t border-sky-500/15 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="skeuo-btn-cancel h-10 px-5 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              data-testid="create-room-submit-button"
              disabled={isSubmitting || !ten.trim()}
              className="skeuo-btn-cta-amber h-10 px-6 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang tạo phòng…
                </>
              ) : (
                'Tạo phòng ngay'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TheLuaChon({
  testId,
  chon,
  onChon,
  disabled,
  icon,
  tieuDe,
}: {
  testId: string
  chon: boolean
  onChon: () => void
  disabled: boolean
  icon: ReactNode
  tieuDe: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={chon}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onChon}
      disabled={disabled}
      className={cn(
        'flex items-center justify-center gap-2 h-11 min-h-11 max-h-11 px-3 rounded-xl text-xs font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-150 select-none',
        chon
          ? 'skeuo-subcard-active-amber text-amber-200'
          : 'skeuo-subcard-base text-slate-300 hover:text-white',
      )}
    >
      <span className={cn('shrink-0', chon ? 'text-amber-400' : 'text-slate-400')}>{icon}</span>
      <span>{tieuDe}</span>
    </button>
  )
}
