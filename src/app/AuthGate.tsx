import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router'
import { GraduationCap, Loader2, WifiOff } from 'lucide-react'
import { CampusProvider } from '@/app/CampusContext'
import { KHOA_PHIEN, PhienContext, type GiaTriPhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { AuthModal, type AuthMode } from '@/features/auth/AuthModal'
import { dangXuat, layPhienHienTai, LoiApi } from '@/lib/api'
import { toast } from 'sonner'

export function AuthGate() {
  const queryClient = useQueryClient()
  const phien = useQuery({ queryKey: KHOA_PHIEN, queryFn: layPhienHienTai, staleTime: Infinity })

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<AuthMode>('dang_nhap')

  const moAuthModal = useCallback((mode: AuthMode = 'dang_nhap') => {
    setModalMode(mode)
    setModalOpen(true)
  }, [])

  const xuLyDangXuat = useCallback(async () => {
    await dangXuat().catch(() => {})
    queryClient.setQueryData(KHOA_PHIEN, { nguoiDung: null })
  }, [queryClient])

  const lamMoiPhien = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: KHOA_PHIEN })
  }, [queryClient])

  const nguoiDung = phien.data?.nguoiDung ?? null

  // Khi có thông báo từ phiên (bị thay thế thiết bị hoặc hết hạn), cảnh báo và bật modal đăng nhập
  useEffect(() => {
    if (phien.data?.thongBao) {
      toast.warning(phien.data.thongBao)
      moAuthModal('dang_nhap')
    }
  }, [phien.data?.thongBao, moAuthModal])

  const giaTri: GiaTriPhien = useMemo(
    () => ({
      nguoiDung,
      dangXuat: xuLyDangXuat,
      lamMoiPhien,
      moAuthModal,
    }),
    [nguoiDung, xuLyDangXuat, lamMoiPhien, moAuthModal],
  )

  if (phien.isPending) {
    return (
      <KhungNen>
        <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4">
          <LogoCampus />
          <Loader2 className="size-5 animate-spin text-text-tertiary" aria-label="Đang tải" />
        </div>
      </KhungNen>
    )
  }

  if (phien.isError) {
    return (
      <KhungNen>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-warning-muted text-warning">
            <WifiOff className="size-5" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight text-text-primary">Chưa kết nối được máy chủ</h1>
            <p role="status" className="max-w-sm text-sm leading-relaxed text-text-secondary">
              {phien.error instanceof LoiApi
                ? phien.error.message
                : 'Kiểm tra kết nối mạng rồi thử lại.'}
            </p>
          </div>
          <Button size="lg" onClick={() => void phien.refetch()}>
            Thử lại
          </Button>
        </div>
      </KhungNen>
    )
  }

  return (
    <PhienContext value={giaTri}>
      <CampusProvider>
        <Outlet />
        <AuthModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initialMode={modalMode}
          onSuccess={() => void lamMoiPhien()}
        />
      </CampusProvider>
    </PhienContext>
  )
}

function KhungNen({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background text-text-primary">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_36rem_at_12%_-8%,rgba(34,211,238,0.13),transparent_62%),radial-gradient(48rem_36rem_at_108%_108%,rgba(167,139,250,0.10),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      {children}
    </div>
  )
}

function LogoCampus() {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="flex size-9 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
        <GraduationCap className="size-[18px]" />
      </span>
      <span className="text-[0.9375rem] font-semibold tracking-tight text-text-primary">Digital Campus</span>
    </span>
  )
}
