// Digital Campus v2: Canonical Study Room Creation Dialog
// src/features/hub/CreateStudyRoomDialog.tsx

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { usePhien } from '@/app/phien'
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
import {
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  School,
  Sparkles,
  Users,
} from 'lucide-react'

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
  const { nguoiDung } = usePhien()

  const [ten, setTen] = useState('')
  const [moTa, setMoTa] = useState('')
  const [phamVi, setPhamVi] = useState<'truong' | 'lop'>('truong')
  const [accessMode, setAccessMode] = useState<'public' | 'password'>('public')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [sucChua, setSucChua] = useState(20)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const userHasClass = Boolean(nguoiDung?.lopId)
  const classNameDisplay = nguoiDung?.lop?.ten || (nguoiDung?.lopId ? `Lớp ${nguoiDung.lopId}` : '')

  const resetForm = () => {
    setTen('')
    setMoTa('')
    setPhamVi('truong')
    setAccessMode('public')
    setPassword('')
    setShowPassword(false)
    setSucChua(20)
    setShowAdvanced(false)
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

    if (phamVi === 'lop' && !userHasClass && !nguoiDung?.isSchoolAdmin) {
      setError('Bạn chưa được gán vào lớp học nào để tạo phòng phạm vi lớp.')
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
          moTa: moTa.trim() || undefined,
          phamVi,
          lopId: phamVi === 'lop' ? (nguoiDung?.lopId ?? null) : null,
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
        className="sm:max-w-md bg-card/95 border-border/80 backdrop-blur-md"
        data-testid="create-room-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Tạo phòng học nhóm mới
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Khởi tạo không gian học tập trực tiếp với bảng viết, slide tài liệu và thảo luận âm thanh.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Tên phòng */}
          <div className="space-y-1.5">
            <Label htmlFor="room-ten" className="text-xs font-medium">
              Tên phòng học <span className="text-destructive">*</span>
            </Label>
            <Input
              id="room-ten"
              data-testid="create-room-name-input"
              value={ten}
              onChange={(e) => {
                setTen(e.target.value)
                setError(null)
              }}
              placeholder="vd: Ôn thi Toán học kỳ 2"
              disabled={isSubmitting}
              maxLength={100}
              className="h-9 text-xs"
            />
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <Label htmlFor="room-mota" className="text-xs font-medium">
              Mô tả mục tiêu (tùy chọn)
            </Label>
            <Input
              id="room-mota"
              data-testid="create-room-desc-input"
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              placeholder="vd: Thảo luận bài tập nhóm, giải đề cương..."
              disabled={isSubmitting}
              maxLength={500}
              className="h-9 text-xs"
            />
          </div>

          {/* Tùy chọn nâng cao (Progressive Disclosure) */}
          <div className="pt-0.5">
            <button
              type="button"
              data-testid="create-room-advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
              />
              <span>{showAdvanced ? 'Thu gọn tùy chọn' : 'Tùy chọn (phạm vi, mật khẩu, sức chứa)'}</span>
            </button>
          </div>

          {showAdvanced && (
            <div data-testid="create-room-advanced-section" className="space-y-3.5 pt-1 border-t border-white/10 animate-in fade-in-50 duration-150">
              {/* Phạm vi phòng */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Phạm vi chia sẻ</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="create-room-scope-truong"
                    onClick={() => setPhamVi('truong')}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors cursor-pointer ${
                      phamVi === 'truong'
                        ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">Toàn trường</div>
                      <div className="text-[10px] text-muted-foreground">Mọi người trong trường</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="create-room-scope-lop"
                    onClick={() => {
                      if (userHasClass || nguoiDung?.isSchoolAdmin) {
                        setPhamVi('lop')
                      }
                    }}
                    disabled={isSubmitting || (!userHasClass && !nguoiDung?.isSchoolAdmin)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                      !userHasClass && !nguoiDung?.isSchoolAdmin
                        ? 'opacity-50 cursor-not-allowed border-border/30 bg-muted/10'
                        : 'cursor-pointer ' +
                          (phamVi === 'lop'
                            ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                            : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40')
                    }`}
                  >
                    <School className="h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">
                        {classNameDisplay ? `Lớp ${classNameDisplay}` : 'Lớp học'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Chỉ thành viên lớp</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Chế độ vào phòng */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Chế độ truy cập</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="create-room-mode-public"
                    onClick={() => setAccessMode('public')}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors cursor-pointer ${
                      accessMode === 'public'
                        ? 'border-success/50 bg-success/10 text-success font-semibold'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-medium">Công khai</div>
                      <div className="text-[10px] text-muted-foreground">Ai cũng vào được</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid="create-room-mode-password"
                    onClick={() => setAccessMode('password')}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors cursor-pointer ${
                      accessMode === 'password'
                        ? 'border-warning/50 bg-warning/10 text-warning font-semibold'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <Lock className="h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-medium">Mật khẩu bảo vệ</div>
                      <div className="text-[10px] text-muted-foreground">Yêu cầu nhập mã PIN</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mật khẩu nếu chọn accessMode = password */}
              {accessMode === 'password' && (
                <div className="space-y-1.5 animate-in fade-in-50 duration-150">
                  <Label htmlFor="room-password" className="text-xs font-medium">
                    Mật khẩu phòng <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="room-password"
                      data-testid="create-room-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError(null)
                      }}
                      placeholder="Tối thiểu 4 ký tự..."
                      disabled={isSubmitting}
                      maxLength={50}
                      className="h-9 pr-9 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Sức chứa */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="room-capacity" className="text-xs font-medium flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Sức chứa tối đa
                  </Label>
                  <span className="text-xs font-bold text-primary">{sucChua} người</span>
                </div>
                <Input
                  id="room-capacity"
                  data-testid="create-room-capacity-input"
                  type="number"
                  min={2}
                  max={100}
                  value={sucChua}
                  onChange={(e) => setSucChua(Math.min(100, Math.max(2, parseInt(e.target.value, 10) || 2)))}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}


          {/* Error display */}
          {error && (
            <div
              data-testid="create-room-error"
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              data-testid="create-room-submit-button"
              disabled={isSubmitting || !ten.trim()}
              className="h-8 text-xs font-semibold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang khởi tạo…
                </>
              ) : (
                'Tạo phòng học'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
