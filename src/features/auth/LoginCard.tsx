import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dangKy, dangNhap, quenMatKhau } from '@/lib/api'
import { GraduationCap, KeyRound, LogIn, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

type AuthMode = 'dang_nhap' | 'dang_ky' | 'quen_mat_khau'

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
      setMode('dang_nhap')
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Không đặt lại được mật khẩu.')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-2xl border-white/15 bg-card/95 backdrop-blur-xl">
      <CardHeader className="pb-3">
        {/* Tab switch header */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 mb-2">
          <button
            type="button"
            onClick={() => { setMode('dang_nhap'); setLoi('') }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'dang_nhap'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Đăng nhập</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('dang_ky'); setLoi('') }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'dang_ky'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Đăng ký</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('quen_mat_khau'); setLoi('') }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'quen_mat_khau'
                ? 'bg-background text-foreground shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Quên MK</span>
          </button>
        </div>

        {mode === 'dang_nhap' && (
          <>
            <CardTitle className="text-xl font-bold">Đăng nhập Digital Campus</CardTitle>
            <CardDescription>Chào mừng bạn quay trở lại với không gian học tập trực tuyến.</CardDescription>
          </>
        )}

        {mode === 'dang_ky' && (
          <>
            <CardTitle className="text-xl font-bold">Tạo tài khoản Campus</CardTitle>
            <CardDescription>Tham gia lớp học và tương tác trực tiếp cùng bạn bè và thầy cô.</CardDescription>
          </>
        )}

        {mode === 'quen_mat_khau' && (
          <>
            <CardTitle className="text-xl font-bold">Khôi phục mật khẩu</CardTitle>
            <CardDescription>Nhập tài khoản và mã bảo mật trường/lớp để đặt mật khẩu mới.</CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent>
        {/* ══ TAB 1: ĐĂNG NHẬP ══ */}
        {mode === 'dang_nhap' && (
          <form onSubmit={guiDangNhap} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ten-dang-nhap">Tên đăng nhập</Label>
              <Input
                id="ten-dang-nhap"
                className="h-10"
                autoComplete="username"
                placeholder="Ví dụ: ledinhphat"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mat-khau">Mật khẩu</Label>
                <button
                  type="button"
                  onClick={() => { setMode('quen_mat_khau'); setQmkUsername(username); setLoi('') }}
                  className="text-xs text-primary hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <Input
                id="mat-khau"
                type="password"
                className="h-10"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {loi && (
              <p role="alert" className="text-xs font-semibold text-destructive">
                {loi}
              </p>
            )}

            <Button type="submit" className="h-11 font-bold text-sm" disabled={dangGui}>
              {dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-1">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setMode('dang_ky'); setLoi('') }}
                className="font-semibold text-primary hover:underline"
              >
                Đăng ký tài khoản mới
              </button>
            </div>
          </form>
        )}

        {/* ══ TAB 2: ĐĂNG KÝ ══ */}
        {mode === 'dang_ky' && (
          <form onSubmit={guiDangKy} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="dk-username">Tên đăng nhập *</Label>
              <Input
                id="dk-username"
                className="h-9"
                autoComplete="username"
                placeholder="Chữ cái, số, không dấu (ví dụ: nguyenan)"
                value={dkUsername}
                onChange={(e) => setDkUsername(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="dk-hoten">Họ và tên hiển thị *</Label>
              <Input
                id="dk-hoten"
                className="h-9"
                placeholder="Ví dụ: Nguyễn Văn An"
                value={dkHoTen}
                onChange={(e) => setDkHoTen(e.target.value)}
                required
              />
            </div>

            {/* Vai trò */}
            <div className="flex flex-col gap-1">
              <Label>Vai trò của bạn</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDkVaiTro('student')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    dkVaiTro === 'student'
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-white/10 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Học sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDkVaiTro('teacher')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    dkVaiTro === 'teacher'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                      : 'border-white/10 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <span>👨‍🏫 Giáo viên</span>
                </button>
              </div>
            </div>

            {dkVaiTro === 'teacher' && (
              <div className="flex flex-col gap-1">
                <Label htmlFor="dk-teachercode">Mã kích hoạt Giáo viên (tùy chọn)</Label>
                <Input
                  id="dk-teachercode"
                  className="h-9"
                  placeholder="Nhập nếu được BGH cấp, hoặc để trống duyệt sau"
                  value={dkTeacherCode}
                  onChange={(e) => setDkTeacherCode(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="dk-password">Mật khẩu *</Label>
                <Input
                  id="dk-password"
                  type="password"
                  className="h-9"
                  placeholder="Tối thiểu 6 ký tự"
                  value={dkPassword}
                  onChange={(e) => setDkPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="dk-confirm-password">Xác nhận MK *</Label>
                <Input
                  id="dk-confirm-password"
                  type="password"
                  className="h-9"
                  placeholder="Nhập lại mật khẩu"
                  value={dkConfirmPassword}
                  onChange={(e) => setDkConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {loi && (
              <p role="alert" className="text-xs font-semibold text-destructive">
                {loi}
              </p>
            )}

            <Button type="submit" className="h-10 font-bold text-sm mt-1" disabled={dangGui}>
              {dangGui ? 'Đang tạo tài khoản…' : 'Đăng ký tài khoản'}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => { setMode('dang_nhap'); setLoi('') }}
                className="font-semibold text-primary hover:underline"
              >
                Đăng nhập ngay
              </button>
            </div>
          </form>
        )}

        {/* ══ TAB 3: QUÊN MẬT KHẨU ══ */}
        {mode === 'quen_mat_khau' && (
          <form onSubmit={guiQuenMatKhau} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="qmk-username">Tên đăng nhập cần khôi phục *</Label>
              <Input
                id="qmk-username"
                className="h-9"
                placeholder="Ví dụ: ledinhphat"
                value={qmkUsername}
                onChange={(e) => setQmkUsername(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="qmk-code">Mã bảo mật lớp / trường *</Label>
                <span className="text-[11px] text-muted-foreground">Ví dụ: 10a7 hoặc gdtxdinhquan</span>
              </div>
              <Input
                id="qmk-code"
                className="h-9"
                placeholder="Nhập mã lớp (10A7) hoặc mã trường (gdtxdinhquan)"
                value={qmkCode}
                onChange={(e) => setQmkCode(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="qmk-newpassword">Mật khẩu mới *</Label>
                <Input
                  id="qmk-newpassword"
                  type="password"
                  className="h-9"
                  placeholder="Tối thiểu 6 ký tự"
                  value={qmkNewPassword}
                  onChange={(e) => setQmkNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="qmk-confirm-newpassword">Xác nhận MK mới *</Label>
                <Input
                  id="qmk-confirm-newpassword"
                  type="password"
                  className="h-9"
                  placeholder="Nhập lại mật khẩu"
                  value={qmkConfirmPassword}
                  onChange={(e) => setQmkConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {loi && (
              <p role="alert" className="text-xs font-semibold text-destructive">
                {loi}
              </p>
            )}

            <Button type="submit" className="h-10 font-bold text-sm mt-1" disabled={dangGui}>
              {dangGui ? 'Đang đặt lại mật khẩu…' : 'Đặt lại mật khẩu'}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              Nhớ lại mật khẩu rồi?{' '}
              <button
                type="button"
                onClick={() => { setMode('dang_nhap'); setLoi('') }}
                className="font-semibold text-primary hover:underline"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
