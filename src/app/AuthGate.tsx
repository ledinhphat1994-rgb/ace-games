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
      <div className="relative min-h-svh flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-950">
        {/* Campus Background with cinematic gradient and blur */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/campus/campus_building.webp"
            alt="Digital Campus Building"
            className="h-full w-full object-cover object-center opacity-35 scale-105 filter blur-xs"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50" />
        </div>

        {/* Ambient colored glowing orbs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-social/15 blur-[120px]" />

        {/* Brand Header */}
        <div className="relative z-10 text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-brand animate-ping" />
            <span>Digital Campus v2 · Lớp 10A7</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Trung Tâm GDTX Định Quán
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Cổng thông tin & Không gian học tập tương tác trực tuyến
          </p>
        </div>

        <div className="relative z-10 w-full max-w-md">
          {phien.data.thongBao && (
            <p role="status" className="mb-4 text-center text-sm font-medium text-amber-400 bg-amber-950/60 border border-amber-500/30 rounded-xl p-2.5 backdrop-blur-md">
              {phien.data.thongBao}
            </p>
          )}
          <LoginCard onDaDangNhap={() => void queryClient.invalidateQueries({ queryKey: KHOA_PHIEN })} />
        </div>

        {/* Footer */}
        <div className="relative z-10 text-center mt-6 text-[11px] text-slate-500">
          © 2026-2027 Lớp 10A7 · Nền tảng học tập số hóa toàn diện
        </div>
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
