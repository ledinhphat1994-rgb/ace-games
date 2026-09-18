import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { Outlet } from 'react-router'
import { CampusProvider } from '@/app/CampusContext'
import { KHOA_PHIEN, PhienContext } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { LoginCard } from '@/features/auth/LoginCard'
import { dangXuat, layPhienHienTai, LoiApi } from '@/lib/api'

export function AuthGate() {
  const queryClient = useQueryClient()
  const phien = useQuery({ queryKey: KHOA_PHIEN, queryFn: layPhienHienTai, staleTime: Infinity })

  const xuLyDangXuat = useCallback(async () => {
    await dangXuat().catch(() => {})
    queryClient.setQueryData(KHOA_PHIEN, { nguoiDung: null })
  }, [queryClient])

  const lamMoiPhien = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: KHOA_PHIEN })
  }, [queryClient])

  const nguoiDung = phien.data?.nguoiDung ?? null
  const giaTri = useMemo(
    () => (nguoiDung ? { nguoiDung, dangXuat: xuLyDangXuat, lamMoiPhien } : null),
    [nguoiDung, xuLyDangXuat, lamMoiPhien],
  )

  if (phien.isPending) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Đang tải…</div>
  }

  if (phien.isError) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
        <p role="status" className="max-w-sm text-sm text-amber-400">
          {phien.error instanceof LoiApi
            ? phien.error.message
            : 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'}
        </p>
        <Button className="h-11 px-4" onClick={() => void phien.refetch()}>
          Thử lại
        </Button>
      </div>
    )
  }

  if (!giaTri) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        {phien.data.thongBao && (
          <p role="status" className="max-w-sm text-center text-sm text-amber-400">
            {phien.data.thongBao}
          </p>
        )}
        <LoginCard onDaDangNhap={() => void queryClient.invalidateQueries({ queryKey: KHOA_PHIEN })} />
      </div>
    )
  }

  return (
    <PhienContext value={giaTri}>
      <CampusProvider>
        <Outlet />
      </CampusProvider>
    </PhienContext>
  )
}
