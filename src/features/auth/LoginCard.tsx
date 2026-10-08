import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { TEN_HIEN_THI_TOI_DA } from '@shared/protocol/common'
import { dangKy, dangNhap, quenMatKhau, yeuCauQuenMatKhau } from '@/lib/api'
import { AlertCircle, ArrowLeft, GraduationCap, Presentation } from 'lucide-react'
import { toast } from 'sonner'

type AuthMode = 'dang_nhap' | 'dang_ky' | 'quen_mat_khau'

const TIEU_DE: Record<AuthMode, { title: string; description: string }> = {
  dang_nhap: { title: 'Đăng nhập', description: 'Chào mừng bạn quay lại Digital Campus.' },
  dang_ky: { title: 'Tạo tài khoản', description: 'Tham gia phòng học và trò chơi cùng bạn bè, thầy cô.' },
  quen_mat_khau: {
    title: 'Khôi phục mật khẩu',
    description: 'Nhận mã 6 số (hoặc xin giáo viên cấp mã), rồi đặt mật khẩu mới.',
  },
}

export function LoginCard({ onDaDangNhap }: { onDaDangNhap: () => void }) {
  const [mode, setMode] = useState<AuthMode>('dang_nhap')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')

  // Form đăng nhập
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // Form đăng ký
  const [dkUsername, setDkUsername] = useState('')
  const [dkHoTen, setDkHoTen] = useState('')
  const [dkPassword, setDkPassword] = useState('')
  const [dkConfirmPassword, setDkConfirmPassword] = useState('')
  const [dkVaiTro, setDkVaiTro] = useState<'student' | 'teacher'>('student')
  const [dkTeacherCode, setDkTeacherCode] = useState('')

  // Form quên mật khẩu
  const [qmkUsername, setQmkUsername] = useState('')
  const [qmkCode, setQmkCode] = useState('')
  const [qmkNewPassword, setQmkNewPassword] = useState('')
  const [qmkConfirmPassword, setQmkConfirmPassword] = useState('')
  const [dangLayMa, setDangLayMa] = useState(false)
  const [thongBaoMa, setThongBaoMa] = useState('')

  const doiCheDo = (moi: AuthMode) => {
    setMode(moi)
    setLoi('')
  }

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
      setThongBaoMa(res.message || 'Mã xác nhận 6 số đã được tạo (có hiệu lực 15 phút).')
      toast.info(res.message || 'Đã tạo yêu cầu khôi phục mật khẩu.')
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Không gửi được yêu cầu tạo mã.')
    } finally {
      setDangLayMa(false)
    }
  }

  async function guiDangNhap(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (dangGui) return
    setDangGui(true)
    setLoi('')
    try {
      await dangNhap(username.trim(), password)
      onDaDangNhap()
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Không đăng nhập được.')
    } finally {
      setDangGui(false)
    }
  }

  async function guiDangKy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (dangGui) return

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
        vaiTro: dkVaiTro,
        teacherCode: dkVaiTro === 'teacher' ? dkTeacherCode.trim() : undefined,
      })

      toast.success(res.message || 'Đăng ký tài khoản thành công!')

      // Tự động đăng nhập luôn sau khi đăng ký
      await dangNhap(dkUsername.trim(), dkPassword)
      onDaDangNhap()
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Đăng ký không thành công. Vui lòng thử lại.')
    } finally {
      setDangGui(false)
    }
  }

  async function guiQuenMatKhau(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (dangGui) return

    if (!qmkCode.trim()) {
      setLoi('Vui lòng nhập mã khôi phục 6 chữ số.')
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

      toast.success(res.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.')
      setUsername(qmkUsername.trim())
      setPassword('')
      doiCheDo('dang_nhap')
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Không đặt lại được mật khẩu.')
    } finally {
      setDangGui(false)
    }
  }

  const { title, description } = TIEU_DE[mode]

  return (
    <div className="w-full rounded-2xl border border-border-default bg-surface/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
      {mode !== 'dang_nhap' && (
        <button
          type="button"
          onClick={() => doiCheDo('dang_nhap')}
          className="-ml-1 mb-4 inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="size-4" />
          Quay lại đăng nhập
        </button>
      )}

      <h2 className="text-xl leading-7 font-semibold tracking-[-0.015em] text-text-primary">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{description}</p>

      {/* ══ ĐĂNG NHẬP ══ */}
      {mode === 'dang_nhap' && (
        <form onSubmit={guiDangNhap} className="mt-6 flex flex-col gap-4">
          <TruongNhap label="Tên đăng nhập" htmlFor="ten-dang-nhap">
            <Input
              id="ten-dang-nhap"
              autoComplete="username"
              placeholder="Ví dụ: ledinhphat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </TruongNhap>

          <TruongNhap
            label="Mật khẩu"
            htmlFor="mat-khau"
            phu={
              <button
                type="button"
                onClick={() => {
                  setQmkUsername(username)
                  doiCheDo('quen_mat_khau')
                }}
                className="text-xs font-medium text-brand hover:underline"
              >
                Quên mật khẩu?
              </button>
            }
          >
            <PasswordInput id="mat-khau" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </TruongNhap>

          <ThongBaoLoi loi={loi} />

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={dangGui}>
            {dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Chưa có tài khoản?{' '}
            <button type="button" onClick={() => doiCheDo('dang_ky')} className="font-semibold text-brand hover:underline">
              Đăng ký
            </button>
          </p>
        </form>
      )}

      {/* ══ ĐĂNG KÝ ══ */}
      {mode === 'dang_ky' && (
        <form onSubmit={guiDangKy} className="mt-6 flex flex-col gap-4">
          <TruongNhap label="Tên đăng nhập" htmlFor="dk-username" batBuoc>
            <Input
              id="dk-username"
              autoComplete="username"
              maxLength={32}
              placeholder="3–32 ký tự viết liền (chữ, số, _, -)"
              value={dkUsername}
              onChange={(e) => setDkUsername(e.target.value)}
              required
            />
          </TruongNhap>

          <TruongNhap label="Họ và tên hiển thị" htmlFor="dk-hoten">
            <Input
              id="dk-hoten"
              autoComplete="name"
              maxLength={TEN_HIEN_THI_TOI_DA}
              placeholder="Ví dụ: Lê Đình Phát"
              value={dkHoTen}
              onChange={(e) => setDkHoTen(e.target.value)}
            />
          </TruongNhap>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-primary">Bạn là</span>
            <div className="day-loc-deu [--the-nho-nhat:8rem]" role="group" aria-label="Vai trò">
              {(
                [
                  { id: 'student', label: 'Học sinh', icon: GraduationCap },
                  { id: 'teacher', label: 'Giáo viên', icon: Presentation },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={dkVaiTro === id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setDkVaiTro(id)}
                  className={cn(
                    'flex h-11 min-h-11 max-h-11 items-center gap-2 rounded-xl border-2 text-sm font-medium transition-colors duration-150 cursor-pointer select-none',
                    dkVaiTro === id
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border-default text-text-secondary hover:bg-surface-overlay hover:text-text-primary',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {dkVaiTro === 'teacher' && (
            <div className="flex flex-col gap-2 rounded-xl border border-warning/25 bg-warning-muted/50 p-3">
              <Label htmlFor="dk-teachercode" className="text-sm font-medium text-warning">
                Mã xác minh giáo viên (nếu có)
              </Label>
              <Input
                id="dk-teachercode"
                type="password"
                placeholder="Nhập mã do trường cung cấp"
                value={dkTeacherCode}
                onChange={(e) => setDkTeacherCode(e.target.value)}
              />
              <p className="text-xs leading-relaxed text-text-secondary">
                Nếu chưa có mã, tài khoản giáo viên sẽ ở trạng thái chờ Ban giám hiệu duyệt.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TruongNhap label="Mật khẩu" htmlFor="dk-password" batBuoc>
              <PasswordInput id="dk-password" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" value={dkPassword} onChange={(e) => setDkPassword(e.target.value)} required />
            </TruongNhap>
            <TruongNhap label="Nhập lại mật khẩu" htmlFor="dk-confirm-password" batBuoc>
              <PasswordInput id="dk-confirm-password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={dkConfirmPassword} onChange={(e) => setDkConfirmPassword(e.target.value)} required />
            </TruongNhap>
          </div>

          <ThongBaoLoi loi={loi} />

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={dangGui}>
            {dangGui ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Đã có tài khoản?{' '}
            <button type="button" onClick={() => doiCheDo('dang_nhap')} className="font-semibold text-brand hover:underline">
              Đăng nhập
            </button>
          </p>
        </form>
      )}

      {/* ══ QUÊN MẬT KHẨU ══ */}
      {mode === 'quen_mat_khau' && (
        <form onSubmit={guiQuenMatKhau} className="mt-6 flex flex-col gap-4">
          <TruongNhap label="Tên đăng nhập cần khôi phục" htmlFor="qmk-username" batBuoc>
            <div className="flex gap-2">
              <Input
                id="qmk-username"
                autoComplete="username"
                className="flex-1"
                placeholder="Ví dụ: ledinhphat"
                value={qmkUsername}
                onChange={(e) => setQmkUsername(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                disabled={dangLayMa || !qmkUsername.trim()}
                onClick={handleLayMa}
              >
                {dangLayMa ? 'Đang gửi…' : 'Lấy mã'}
              </Button>
            </div>
            {thongBaoMa && <p className="text-xs leading-relaxed text-brand">{thongBaoMa}</p>}
          </TruongNhap>

          <TruongNhap
            label="Mã khôi phục (6 số)"
            htmlFor="qmk-code"
            batBuoc
            phu={<span className="text-xs text-text-tertiary">Hiệu lực 15 phút</span>}
          >
            <Input
              id="qmk-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="text-center font-mono text-base tracking-[0.4em]"
              maxLength={8}
              placeholder="••••••"
              value={qmkCode}
              onChange={(e) => setQmkCode(e.target.value)}
              required
            />
          </TruongNhap>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TruongNhap label="Mật khẩu mới" htmlFor="qmk-newpassword" batBuoc>
              <PasswordInput id="qmk-newpassword" autoComplete="new-password" placeholder="Tối thiểu 6 ký tự" value={qmkNewPassword} onChange={(e) => setQmkNewPassword(e.target.value)} required />
            </TruongNhap>
            <TruongNhap label="Nhập lại mật khẩu mới" htmlFor="qmk-confirm-newpassword" batBuoc>
              <PasswordInput id="qmk-confirm-newpassword" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={qmkConfirmPassword} onChange={(e) => setQmkConfirmPassword(e.target.value)} required />
            </TruongNhap>
          </div>

          <ThongBaoLoi loi={loi} />

          <Button type="submit" size="lg" className="mt-1 w-full" disabled={dangGui}>
            {dangGui ? 'Đang đặt lại mật khẩu…' : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      )}
    </div>
  )
}

function TruongNhap({
  label,
  htmlFor,
  batBuoc = false,
  phu,
  children,
}: {
  label: string
  htmlFor: string
  batBuoc?: boolean
  phu?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
          {label}
          {batBuoc && <span className="ml-0.5 text-text-tertiary">*</span>}
        </Label>
        {phu}
      </div>
      {children}
    </div>
  )
}

function ThongBaoLoi({ loi }: { loi: string }) {
  if (!loi) return null
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm leading-relaxed text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      {loi}
    </p>
  )
}
