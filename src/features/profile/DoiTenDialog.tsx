import { useState, useEffect, type FormEvent } from 'react'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { BlueprintCommunityPattern } from '@/components/ui/blueprint-patterns'
import { capNhatHoSo, doiTenKhach } from '@/lib/api'
import { TEN_HIEN_THI_TOI_DA } from '@shared/protocol/common'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

export interface DoiTenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DoiTenDialog({ open, onOpenChange, onSuccess }: DoiTenDialogProps) {
  const { nguoiDung, lamMoiPhien } = usePhien()
  const [tenMoi, setTenMoi] = useState('')
  const [dangLuu, setDangLuu] = useState(false)

  useEffect(() => {
    if (open) {
      setTenMoi(nguoiDung?.ten || nguoiDung?.username || 'Kỳ Thủ')
    }
  }, [open, nguoiDung])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const cleanTen = tenMoi.trim()
    if (!cleanTen) {
      toast.error('Vui lòng nhập tên người chơi.')
      return
    }

    setDangLuu(true)
    try {
      if (!nguoiDung || nguoiDung.accountId === 0) {
        doiTenKhach(cleanTen)
      } else {
        await capNhatHoSo({ tenHienThi: cleanTen })
      }
      toast.success('Đã cập nhật tên người chơi!')
      if (lamMoiPhien) await lamMoiPhien()
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không lưu được tên mới.')
    } finally {
      setDangLuu(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        initialFocus={false}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl text-text-primary z-50 duration-150 overflow-hidden"
      >
        <BlueprintCommunityPattern className="opacity-75 pointer-events-none" />

        <DialogHeader className="relative z-10 pb-3 border-b border-slate-800/80">
          <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
            <div className="size-7 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <Pencil className="size-3.5" />
            </div>
            <span>Đổi tên người chơi</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4 pt-3">
          <div className="space-y-1.5">
            <label htmlFor="player-name-input" className="text-xs font-semibold text-slate-300">
              Tên hiển thị
            </label>
            <Input
              id="player-name-input"
              value={tenMoi}
              onChange={(e) => setTenMoi(e.target.value)}
              maxLength={TEN_HIEN_THI_TOI_DA}
              placeholder="Nhập tên người chơi mới..."
              autoFocus
              className="h-10 text-xs font-semibold bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-sky-400"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={dangLuu}
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-xl text-xs font-semibold border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={dangLuu || !tenMoi.trim()}
              className="h-9 px-5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-xs"
            >
              {dangLuu ? 'Đang lưu...' : 'Lưu tên'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
