import { useCallback, useEffect, useState } from 'react'
import { LoginCard } from '@/features/auth/LoginCard'
import { CampusHub } from '@/features/hub/CampusHub'
import { dangXuat, layNguoiDung, LoiApi, type NguoiDung } from '@/lib/api'

type TrangThai =
  | { loai: 'dang_tai' }
  | { loai: 'khach'; thongBao?: string }
  | { loai: 'da_dang_nhap'; nguoiDung: NguoiDung }

function thongBaoKhiLoi(err: unknown): string | undefined {
  if (!(err instanceof LoiApi)) return 'Không kết nối được máy chủ. Thử tải lại trang.'
  if (err.status !== 401) return err.message
  return err.lyDo && err.lyDo !== 'chua_dang_nhap' ? err.message : undefined
}

export default function App() {
  const [trangThai, setTrangThai] = useState<TrangThai>({ loai: 'dang_tai' })

  const taiNguoiDung = useCallback(async () => {
    try {
      setTrangThai({ loai: 'da_dang_nhap', nguoiDung: await layNguoiDung() })
    } catch (err) {
      setTrangThai({ loai: 'khach', thongBao: thongBaoKhiLoi(err) })
    }
  }, [])

  useEffect(() => {
    let conHieuLuc = true
    layNguoiDung()
      .then((nguoiDung) => {
        if (conHieuLuc) setTrangThai({ loai: 'da_dang_nhap', nguoiDung })
      })
      .catch((err: unknown) => {
        if (conHieuLuc) setTrangThai({ loai: 'khach', thongBao: thongBaoKhiLoi(err) })
      })
    return () => {
      conHieuLuc = false
    }
  }, [])

  const xuLyDangXuat = useCallback(async () => {
    await dangXuat().catch(() => {})
    setTrangThai({ loai: 'khach' })
  }, [])

  if (trangThai.loai === 'dang_tai') {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Đang tải…</div>
  }

  if (trangThai.loai === 'khach') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        {trangThai.thongBao && (
          <p role="status" className="max-w-sm text-center text-sm text-amber-400">
            {trangThai.thongBao}
          </p>
        )}
        <LoginCard onDaDangNhap={taiNguoiDung} />
      </div>
    )
  }

  return <CampusHub nguoiDung={trangThai.nguoiDung} onDangXuat={xuLyDangXuat} />
}
