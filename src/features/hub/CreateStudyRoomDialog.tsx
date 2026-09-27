// Digital Campus v2: Canonical Study Room Creation Dialog
// src/features/hub/CreateStudyRoomDialog.tsx

import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
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
import { PasswordInput } from '@/components/ui/password-input'
import { AlertCircle, Globe, Loader2, Lock, Users } from 'lucide-react'

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
        className="w-full sm:max-w-[440px] sm:w-[440px] h-[520px] min-h-[520px] max-h-[calc(100svh-2rem)] p-6 rounded-2xl border-border-default bg-surface shadow-2xl flex flex-col justify-between overflow-hidden"
        data-testid="create-room-dialog"
      >
        <DialogHeader className="shrink-0 pb-1">
          <DialogTitle>Tạo phòng học</DialogTitle>
          <DialogDescription className="sr-only">
            Tạo phòng học
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 justify-between">
          <div className="space-y-4 overflow-y-auto flex-1 pr-0.5">
            <div className="space-y-2">
              <Label htmlFor="room-ten" className="text-sm font-medium">
                Tên phòng <span className="text-text-tertiary">*</span>
              </Label>
            <Input
              id="room-ten"
              data-testid="create-room-name-input"
              value={ten}
              onChange={(e) => {
                setTen(e.target.value)
                setError(null)
              }}
              placeholder="Tên phòng..."
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          <div data-testid="create-room-advanced-section" className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-text-primary">Loại phòng</legend>
              <div className="day-loc-deu [--the-nho-nhat:9rem]">
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

            {accessMode === 'password' && (
              <div className="space-y-2 animate-in fade-in-50 duration-150">
                <Label htmlFor="room-password" className="text-sm font-medium">
                  Mật khẩu phòng <span className="text-text-tertiary">*</span>
                </Label>
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
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="room-capacity" className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="size-4 text-text-tertiary" />
                Sức chứa tối đa
              </Label>
              <div className="relative">
                <Input
                  id="room-capacity"
                  data-testid="create-room-capacity-input"
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={100}
                  value={sucChua}
                  onChange={(e) => setSucChua(Math.min(100, Math.max(2, parseInt(e.target.value, 10) || 2)))}
                  disabled={isSubmitting}
                  className="w-full pr-16 tabular-nums"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-text-tertiary">
                  người
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p
              data-testid="create-room-error"
              className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm leading-relaxed text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          )}
          </div>

          <DialogFooter className="shrink-0 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Huỷ
            </Button>
            <Button
              type="submit"
              data-testid="create-room-submit-button"
              disabled={isSubmitting || !ten.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Đang tạo phòng…
                </>
              ) : (
                'Tạo phòng'
              )}
            </Button>
          </DialogFooter>
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
  moTa,
}: {
  testId: string
  chon: boolean
  onChon: () => void
  disabled: boolean
  icon: ReactNode
  tieuDe: string
  moTa?: string
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={chon}
      onClick={onChon}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        chon
          ? 'border-brand/50 bg-brand/10'
          : 'border-border-default hover:border-border-strong hover:bg-surface-overlay/60',
      )}
    >
      <span className={cn('shrink-0', chon ? 'text-brand' : 'text-text-tertiary')}>{icon}</span>
      <span className="min-w-0">
        <span className={cn('block text-sm font-medium break-words', chon ? 'text-brand' : 'text-text-primary')}>{tieuDe}</span>
        {moTa && <span className="mt-0.5 block text-xs leading-relaxed text-text-tertiary">{moTa}</span>}
      </span>
    </button>
  )
}
