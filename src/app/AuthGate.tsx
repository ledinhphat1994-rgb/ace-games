import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router'
import { KhungChoTrang } from '@/components/layout/KhungChoTrang'
import { GraduationCap, Loader2, WifiOff } from 'lucide-react'
import { CampusProvider } from '@/app/CampusContext'
import { KHOA_PHIEN, PhienContext, type GiaTriPhien } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { AuthModal, type AuthMode } from '@/features/auth/AuthModal'
import { dangXuat, layPhienHienTai, layTrangThaiGoogle, LoiApi } from '@/lib/api'
import { LogoGoogle } from '@/features/auth/LogoGoogle'
import { toast } from 'sonner'
import type { KetQuaGoogle } from '@shared/protocol/google'

// Máy chủ quay về với ?google=<kết quả> sau đăng nhập / liên kết Google; huỷ giữa chừng thì không báo gì.
const THONG_BAO_GOOGLE: Partial<Record<KetQuaGoogle, { loai: 'success' | 'error'; noiDung: string }>> = {
  ok: { loai: 'success', noiDung: 'Đăng nhập thành công!' },
  khoi_phuc: { loai: 'success', noiDung: 'Đăng nhập thành công! Hãy đặt mật khẩu mới.' },
  da_lien_ket: { loai: 'success', noiDung: 'Đã liên kết Google.' },
  chua_lien_ket: {
    loai: 'error',
    noiDung: 'Gmail này chưa liên kết với tài khoản nào. Hãy đăng nhập bằng mật khẩu rồi liên kết Google trong Hồ sơ cá nhân.',
  },
  da_lien_ket_khac: { loai: 'error', noiDung: 'Gmail này đã liên kết với một tài khoản khác.' },
  bi_khoa: { loai: 'error', noiDung: 'Tài khoản này đã bị khoá.' },
  can_dang_nhap: { loai: 'error', noiDung: 'Vui lòng đăng nhập trước khi liên kết Google.' },
  chua_cau_hinh: { loai: 'error', noiDung: 'Đăng nhập bằng Google chưa được bật.' },
  loi: { loai: 'error', noiDung: 'Đăng nhập Google không thành công. Vui lòng thử lại.' },
}

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
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i)
        if (k && k.startsWith('dc_quick_game')) {
          sessionStorage.removeItem(k)
        }
      }
    } catch {}
    queryClient.setQueryData(KHOA_PHIEN, { nguoiDung: null })
  }, [queryClient])

  const lamMoiPhien = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: KHOA_PHIEN })
  }, [queryClient])

  const nguoiDung = phien.data?.nguoiDung ?? null

  const [searchParams, setSearchParams] = useSearchParams()
  const ketQuaGoogle = searchParams.get('google')
  useEffect(() => {
    if (!ketQuaGoogle) return
    const thongBao = THONG_BAO_GOOGLE[ketQuaGoogle as KetQuaGoogle]
    if (thongBao) toast[thongBao.loai](thongBao.noiDung, { id: 'ket-qua-google' })
    setSearchParams(
      (cu) => {
        const moi = new URLSearchParams(cu)
        moi.delete('google')
        return moi
      },
      { replace: true },
    )
  }, [ketQuaGoogle, setSearchParams])

  // Nhắc liên kết Gmail (để tự lấy lại mật khẩu khi quên): thông báo nổi, không đẩy bố cục; tối đa 1 lần/ngày/tài khoản,
  // không hiện trong phòng học.
  const { pathname } = useLocation()
  const trongPhong = pathname.startsWith('/room')
  const trangThaiGoogle = useQuery({
    queryKey: ['google', 'status'],
    queryFn: layTrangThaiGoogle,
    enabled: Boolean(nguoiDung) && !trongPhong,
    staleTime: 5 * 60_000,
  })
  const canNhacLienKet = Boolean(nguoiDung && trangThaiGoogle.data?.sanSang && !trangThaiGoogle.data.lienKet && !trongPhong)
  useEffect(() => {
    if (!canNhacLienKet || !nguoiDung) return
    const khoa = `nhac-lien-ket-google:${nguoiDung.accountId}`
    try {
      const lanTruoc = Number(localStorage.getItem(khoa)) || 0
      if (Date.now() - lanTruoc < 24 * 3_600_000) return
      localStorage.setItem(khoa, String(Date.now()))
    } catch {
      return
    }
    toast('Liên kết Gmail để tự lấy lại mật khẩu khi quên.', {
      id: 'nhac-lien-ket-google',
      duration: 12_000,
      icon: (
        <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 p-1.5 shadow-inner">
          <LogoGoogle className="size-full" />
        </div>
      ),
      action: { label: 'Liên kết', onClick: () => window.location.assign('/api/auth/google/start?che_do=lien_ket') },
    })
  }, [canNhacLienKet, nguoiDung])

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
        <Suspense fallback={<KhungChoTrang />}>
          <Outlet />
        </Suspense>
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_36rem_at_12%_-8%,rgba(198,161,90,0.13),transparent_62%),radial-gradient(48rem_36rem_at_108%_108%,rgba(167,139,250,0.10),transparent_60%)]"
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
