// Mở link phòng / bàn được bạn bè chia sẻ khi chưa đăng nhập: giữ nguyên link, mời đăng nhập,
// đăng nhập xong là vào thẳng phòng (không bị đẩy về trang chủ làm mất link).

import { useEffect, useRef } from 'react'
import { DoorOpen, LogIn } from 'lucide-react'
import { usePhien } from '@/app/phien'
import { Button } from '@/components/ui/button'

export function CongLinkPhong({ loai }: { loai: 'phong' | 'ban' }) {
  const { moAuthModal } = usePhien()
  const daMoRef = useRef(false)

  // Mở hộp đăng nhập ngay một lần; đóng hộp rồi vẫn còn nút để mở lại.
  useEffect(() => {
    if (daMoRef.current) return
    daMoRef.current = true
    moAuthModal('dang_nhap')
  }, [moAuthModal])

  return (
    <div
      className="flex min-h-[70svh] flex-col items-center justify-center gap-5 bg-background px-6 text-center"
      data-testid="cong-link-phong"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10 text-brand shadow-lg shadow-brand/10">
        <DoorOpen className="size-7" />
      </span>
      <h1 className="tieu-de-cap-2 text-xl font-bold">{loai === 'ban' ? 'Đăng nhập để vào bàn' : 'Đăng nhập để vào phòng'}</h1>
      <Button onClick={() => moAuthModal('dang_nhap')} className="h-10 rounded-xl px-6 font-bold">
        <LogIn />
        Đăng nhập
      </Button>
    </div>
  )
}
