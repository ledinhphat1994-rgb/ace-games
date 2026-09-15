import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { dangNhap } from '@/lib/api'

export function LoginCard({ onDaDangNhap }: { onDaDangNhap: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loi, setLoi] = useState('')

  async function guiDangNhap(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (dangGui) return
    setDangGui(true)
    setLoi('')
    try {
      await dangNhap(username, password)
      onDaDangNhap()
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Không đăng nhập được.')
    } finally {
      setDangGui(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">Đăng nhập Digital Campus</CardTitle>
        <CardDescription>Dùng tài khoản Campus hiện có của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={guiDangNhap} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ten-dang-nhap">Tên đăng nhập</Label>
            <Input
              id="ten-dang-nhap"
              className="h-11"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="mat-khau">Mật khẩu</Label>
            <Input
              id="mat-khau"
              type="password"
              className="h-11"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <p role="alert" className="min-h-5 text-sm text-destructive">
            {loi}
          </p>
          <Button type="submit" className="h-11" disabled={dangGui}>
            {dangGui ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
