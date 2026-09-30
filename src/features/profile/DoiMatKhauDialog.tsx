import { useState, type FormEvent } from 'react'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { doiMatKhau } from '@/lib/api'
import { toast } from 'sonner'

export interface DoiMatKhauDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DoiMatKhauDialog({ open, onOpenChange }: DoiMatKhauDialogProps) {
  const { nguoiDung, lamMoiPhien } = usePhien()
  const [matKhauCu, setMatKhauCu] = useState('')
  const [matKhauMoi, setMatKhauMoi] = useState('')
  const [xacNhanMoi, setXacNhanMoi] = useState('')
  const [dangDoiMk, setDangDoiMk] = useState(false)

  const khongCanMatKhauCu = Boolean(nguoiDung?.datMatKhauKhongCanCu)

  const resetForm = () => {
    setMatKhauCu('')
    setMatKhauMoi('')
    setXacNhanMoi('')
  }

  const handleDong = (mo: boolean) => {
    if (!mo) resetForm()
    onOpenChange(mo)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (matKhauMoi !== xacNhanMoi) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.')
      return
    }
    if (matKhauMoi.length < 6) {
      toast.error('Mật khẩu mới phải từ 6 ký tự trở lên.')
      return
    }

    setDangDoiMk(true)
    try {
      await doiMatKhau({
        matKhauCu: khongCanMatKhauCu ? undefined : matKhauCu,
        matKhauMoi,
      })
      toast.success(khongCanMatKhauCu ? 'Đã đặt mật khẩu mới!' : 'Đổi mật khẩu thành công!')
      resetForm()
      if (khongCanMatKhauCu && lamMoiPhien) {
        await lamMoiPhien()
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không đổi được mật khẩu.')
    } finally {
      setDangDoiMk(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDong}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{khongCanMatKhauCu ? 'Đặt mật khẩu mới' : 'Đổi mật khẩu'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-mat-khau">
          {!khongCanMatKhauCu && (
            <div className="space-y-2">
              <Label htmlFor="dlg-mk-cu" className="text-sm font-medium">
                Mật khẩu hiện tại
              </Label>
              <PasswordInput
                id="dlg-mk-cu"
                autoComplete="current-password"
                value={matKhauCu}
                onChange={(e) => setMatKhauCu(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dlg-mk-moi" className="text-sm font-medium">
              Mật khẩu mới
            </Label>
            <PasswordInput
              id="dlg-mk-moi"
              autoComplete="new-password"
              value={matKhauMoi}
              onChange={(e) => setMatKhauMoi(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dlg-mk-xac-nhan" className="text-sm font-medium">
              Nhập lại mật khẩu mới
            </Label>
            <PasswordInput
              id="dlg-mk-xac-nhan"
              autoComplete="new-password"
              value={xacNhanMoi}
              onChange={(e) => setXacNhanMoi(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDong(false)}
              disabled={dangDoiMk}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={dangDoiMk}>
              {dangDoiMk ? 'Đang cập nhật…' : khongCanMatKhauCu ? 'Đặt mật khẩu mới' : 'Đổi mật khẩu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
