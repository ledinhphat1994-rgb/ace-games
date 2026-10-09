import { useState, useEffect, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { dangKy, dangNhap, quenMatKhau, yeuCauQuenMatKhau } from '@/lib/api'
import { AlertCircle, ArrowLeft, UserPlus, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { LogoGoogle } from './LogoGoogle'
import { DigitalCampusLogo } from '@/components/brand/DigitalCampusLogo'

export type AuthMode = 'dang_nhap' | 'dang_ky' | 'quen_mat_khau'

/** Đang mở link phòng / bàn được chia sẻ: đăng nhập Google xong quay về đúng link (máy chủ chỉ nhận đường dẫn phòng / bàn). */
function thamSoQuayVe(): string {
  if (typeof window === 'undefined') return ''
  const duongDan = window.location.pathname
  return /^\/(room\/phong-\d+|game\/[a-z0-9-]+)$/.test(duongDan) ? `?toi=${encodeURIComponent(duongDan)}` : ''
}

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: AuthMode
  onSuccess?: () => void
}

export function AuthModal({
  open,
  onOpenChange,
  initialMode = 'dang_nhap',
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')

  // Form Đăng nhập
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Form Đăng ký
  const [dkUsername, setDkUsername] = useState('')
  const [dkHoTen, setDkHoTen] = useState('')
  const [dkPassword, setDkPassword] = useState('')
  const [dkConfirmPassword, setDkConfirmPassword] = useState('')

  // Form Quên mật khẩu
  const [qmkUsername, setQmkUsername] = useState('')
  const [qmkCode, setQmkCode] = useState('')
  const [qmkNewPassword, setQmkNewPassword] = useState('')
  const [qmkConfirmPassword, setQmkConfirmPassword] = useState('')
  const [dangLayMa, setDangLayMa] = useState(false)
  const [thongBaoMa, setThongBaoMa] = useState('')

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setLoi('')
    }
  }, [open, initialMode])

  const doiCheDo = (moi: AuthMode) => {
    setMode(moi)
    setLoi('')
  }

  // 1. Xử lý Đăng nhập
  async function handleDangNhap(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (dangGui) return
    if (!username.trim() || !password) {
      setLoi('Vui lòng nhập tên đăng nhập và mật khẩu.')
      return
    }

    setDangGui(true)
    setLoi('')
    try {
      await dangNhap(username.trim(), password)
      toast.success('Đăng nhập thành công!')
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Tài khoản hoặc mật khẩu không chính xác.')
    } finally {
      setDangGui(false)
    }
  }

  // 2. Xử lý Đăng ký
  async function handleDangKy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (dangGui) return

    if (!dkUsername.trim()) {
      setLoi('Vui lòng nhập tên đăng nhập.')
      return
    }
    if (dkPassword.length < 6) {
      setLoi('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    if (dkPassword !== dkConfirmPassword) {
      setLoi('Mật khẩu xác nhận không trùng khớp.')
      return
    }

    setDangGui(true)
    setLoi('')
    try {
      const res = await dangKy({
        username: dkUsername.trim(),
        password: dkPassword,
        tenHienThi: dkHoTen.trim() || dkUsername.trim(),
      })

      toast.success(res.message || 'Tạo tài khoản thành công!')
      // Tự động đăng nhập
      await dangNhap(dkUsername.trim(), dkPassword)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Đăng ký không thành công. Vui lòng thử lại.')
    } finally {
      setDangGui(false)
    }
  }

  // 3. Yêu cầu mã khôi phục
  async function handleLayMa() {
    if (!qmkUsername.trim()) {
      setLoi('Vui lòng nhập tên tài khoản trước.')
      return
    }
    setDangLayMa(true)
    setLoi('')
    setThongBaoMa('')
    try {
      const res = await yeuCauQuenMatKhau(qmkUsername.trim())
      setThongBaoMa(res.message || 'Mã xác nhận 6 số đã được tạo.')
      toast.info(res.message || 'Đã tạo yêu cầu khôi phục mật khẩu.')
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Không gửi được yêu cầu tạo mã.')
    } finally {
      setDangLayMa(false)
    }
  }

  // 4. Đặt lại mật khẩu
  async function handleDatLaiMatKhau(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (dangGui) return

    if (!qmkCode.trim()) {
      setLoi('Vui lòng nhập mã xác nhận 6 số.')
      return
    }
    if (qmkNewPassword.length < 6) {
      setLoi('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }
    if (qmkNewPassword !== qmkConfirmPassword) {
      setLoi('Mật khẩu mới xác nhận không khớp.')
      return
    }

    setDangGui(true)
    setLoi('')
    try {
      const res = await quenMatKhau({
        username: qmkUsername.trim(),
        maXacNhan: qmkCode.trim(),
        matKhauMoi: qmkNewPassword,
      })

      toast.success(res.message || 'Đặt lại mật khẩu thành công! Hãy đăng nhập.')
      setUsername(qmkUsername.trim())
      setPassword('')
      setMode('dang_nhap')
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã.')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[440px] h-[min(590px,calc(100dvh-2rem))] min-h-0 p-6 rounded-2xl border-border-default bg-surface shadow-2xl flex flex-col justify-start overflow-hidden">
        <DialogHeader className="space-y-1 pb-1 shrink-0 min-h-[76px]">
          <div className="flex items-center gap-2.5 select-none mb-1">
            <DigitalCampusLogo size="sm" />
            <span className="text-xs font-bold tracking-wider uppercase text-text-tertiary">
              Ace Games
            </span>
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-text-primary">
            {mode === 'dang_nhap' && 'Đăng nhập'}
            {mode === 'dang_ky' && 'Tạo tài khoản mới'}
            {mode === 'quen_mat_khau' && 'Khôi phục mật khẩu'}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-text-secondary">
            {mode === 'dang_nhap' && 'Vào phòng, thi đấu game và kết nối bạn bè trực tuyến.'}
            {mode === 'dang_ky' && 'Đăng ký nhanh chóng chỉ trong vài giây, hoàn toàn miễn phí.'}
            {mode === 'quen_mat_khau' && 'Nhận mã 6 số để thiết lập mật khẩu mới cho tài khoản của bạn.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher: Đăng nhập / Đăng ký */}
        {mode !== 'quen_mat_khau' && (
          <div className="grid grid-cols-2 rounded-xl border border-border-subtle bg-surface-overlay/50 p-1 mb-2 shrink-0">
            <button
              type="button"
              onClick={() => doiCheDo('dang_nhap')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                mode === 'dang_nhap'
                  ? 'bg-surface shadow-sm text-text-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              )}
            >
              <LogIn className="size-3.5" />
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => doiCheDo('dang_ky')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                mode === 'dang_ky'
                  ? 'bg-surface shadow-sm text-text-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              )}
            >
              <UserPlus className="size-3.5" />
              Đăng ký
            </button>
          </div>
        )}

        {/* Thông báo lỗi */}
        {loi && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive shrink-0 mb-1"
          >
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{loi}</span>
          </div>
        )}

        {/* ── 1. FORM ĐĂNG NHẬP ── */}
        {mode === 'dang_nhap' && (
          <form onSubmit={handleDangNhap} className="flex-1 flex flex-col gap-4 justify-between min-h-0 overflow-y-auto pt-1">
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="auth-username" className="text-xs font-medium text-text-secondary">
                  Tên đăng nhập
                </Label>
                <Input
                  id="auth-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên tài khoản"
                  required
                  autoComplete="username"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auth-password" className="text-xs font-medium text-text-secondary">
                    Mật khẩu
                  </Label>
                  <button
                    type="button"
                    onClick={() => doiCheDo('quen_mat_khau')}
                    className="text-xs text-brand hover:underline font-medium"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <PasswordInput
                  id="auth-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  autoComplete="current-password"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              <Button
                type="submit"
                disabled={dangGui}
                className="w-full h-10 font-semibold bg-brand text-brand-foreground hover:bg-brand/90 transition-all duration-150"
              >
                {dangGui ? 'Đang xác thực…' : 'Đăng nhập'}
              </Button>

              {/* Chuyển hẳn trang sang Google; chỉ tài khoản đã liên kết Gmail mới vào được. */}
              <a
                href={`/api/auth/google/start${thamSoQuayVe()}`}
                data-testid="google-login"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full h-10 gap-2 font-semibold')}
              >
                <LogoGoogle className="size-4" />
                Đăng nhập bằng Google
              </a>

              <p className="text-center text-xs text-text-tertiary">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => doiCheDo('dang_ky')}
                  className="text-brand hover:underline font-semibold"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ── 2. FORM ĐĂNG KÝ ── */}
        {mode === 'dang_ky' && (
          <form onSubmit={handleDangKy} className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto pr-0.5">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="dk-username" className="text-xs font-medium text-text-secondary">
                  Tên đăng nhập <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dk-username"
                  value={dkUsername}
                  onChange={(e) => setDkUsername(e.target.value)}
                  placeholder="Viết liền, không dấu (vd: hoangnam)"
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dk-hoten" className="text-xs font-medium text-text-secondary">
                  Họ và tên hiển thị
                </Label>
                <Input
                  id="dk-hoten"
                  value={dkHoTen}
                  onChange={(e) => setDkHoTen(e.target.value)}
                  placeholder="Vd: Nguyễn Hoàng Nam"
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="dk-pwd" className="text-xs font-medium text-text-secondary">
                    Mật khẩu <span className="text-destructive">*</span>
                  </Label>
                  <PasswordInput
                    id="dk-pwd"
                    value={dkPassword}
                    onChange={(e) => setDkPassword(e.target.value)}
                    placeholder="≥ 6 ký tự"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dk-pwd-cf" className="text-xs font-medium text-text-secondary">
                    Xác nhận <span className="text-destructive">*</span>
                  </Label>
                  <PasswordInput
                    id="dk-pwd-cf"
                    value={dkConfirmPassword}
                    onChange={(e) => setDkConfirmPassword(e.target.value)}
                    placeholder="Nhập lại"
                    required
                    className="h-9 text-sm"
                  />
                </div>
              </div>

            </div>

            <div className="space-y-2 pt-2">
              <Button
                type="submit"
                disabled={dangGui}
                className="w-full h-10 font-semibold bg-brand text-brand-foreground hover:bg-brand/90 transition-all duration-150"
              >
                {dangGui ? 'Đang khởi tạo…' : 'Đăng ký tài khoản'}
              </Button>

              <p className="text-center text-xs text-text-tertiary">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => doiCheDo('dang_nhap')}
                  className="text-brand hover:underline font-semibold"
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ── 3. FORM QUÊN MẬT KHẨU ── */}
        {mode === 'quen_mat_khau' && (
          <form onSubmit={handleDatLaiMatKhau} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-0.5">
            {/* Đã liên kết Gmail: vào bằng Google rồi đặt mật khẩu mới ngay, không cần mã. */}
            <a
              href="/api/auth/google/start?sau=khoi_phuc"
              data-testid="google-khoi-phuc"
              className={cn(buttonVariants({ variant: 'outline' }), 'w-full h-10 gap-2 font-semibold')}
            >
              <LogoGoogle className="size-4" />
              Đăng nhập bằng Google
            </a>
            <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
              <span className="h-px flex-1 bg-border-subtle" />
              hoặc nhận mã 6 số
              <span className="h-px flex-1 bg-border-subtle" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qmk-username" className="text-xs font-medium text-text-secondary">
                Tên tài khoản
              </Label>
              <div className="flex gap-2">
                <Input
                  id="qmk-username"
                  value={qmkUsername}
                  onChange={(e) => setQmkUsername(e.target.value)}
                  placeholder="Nhập tên tài khoản"
                  required
                  className="h-9 text-sm flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLayMa}
                  disabled={dangLayMa}
                  className="h-9 text-xs shrink-0"
                >
                  {dangLayMa ? 'Đang gửi…' : 'Nhận mã'}
                </Button>
              </div>
            </div>

            {thongBaoMa && (
              <p className="rounded-xl border border-brand/30 bg-brand/10 p-2.5 text-xs text-brand">
                {thongBaoMa}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="qmk-code" className="text-xs font-medium text-text-secondary">
                Mã xác nhận 6 số
              </Label>
              <Input
                id="qmk-code"
                value={qmkCode}
                onChange={(e) => setQmkCode(e.target.value)}
                placeholder="Vd: 123456"
                required
                className="h-9 text-sm tracking-widest font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="qmk-newpwd" className="text-xs font-medium text-text-secondary">
                  Mật khẩu mới
                </Label>
                <PasswordInput
                  id="qmk-newpwd"
                  value={qmkNewPassword}
                  onChange={(e) => setQmkNewPassword(e.target.value)}
                  placeholder="≥ 6 ký tự"
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qmk-cfnewpwd" className="text-xs font-medium text-text-secondary">
                  Xác nhận lại
                </Label>
                <PasswordInput
                  id="qmk-cfnewpwd"
                  value={qmkConfirmPassword}
                  onChange={(e) => setQmkConfirmPassword(e.target.value)}
                  placeholder="Nhập lại"
                  required
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={dangGui}
              className="w-full h-10 font-semibold bg-brand text-brand-foreground hover:bg-brand/90 transition-all duration-150 mt-1"
            >
              {dangGui ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}
            </Button>

            <button
              type="button"
              onClick={() => doiCheDo('dang_nhap')}
              className="flex items-center justify-center gap-1.5 w-full text-center text-xs text-text-tertiary hover:text-text-primary pt-1"
            >
              <ArrowLeft className="size-3.5" />
              Quay lại Đăng nhập
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
