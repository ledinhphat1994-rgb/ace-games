import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, type ReactNode } from 'react'
import { Outlet } from 'react-router'
import { GraduationCap, Loader2, MonitorPlay, Swords, Users, WifiOff } from 'lucide-react'
import { CampusProvider } from '@/app/CampusContext'
import { KHOA_PHIEN, PhienContext } from '@/app/phien'
import { Button } from '@/components/ui/button'
import { LoginCard } from '@/features/auth/LoginCard'
import { dangXuat, layPhienHienTai, LoiApi } from '@/lib/api'

// Ba điều người dùng thật sự làm được trong Digital Campus — không phải khẩu hiệu.
const DIEM_NOI_BAT = [
  { icon: MonitorPlay, ten: 'Phòng học nhóm', moTa: 'Cùng xem video, trình chiếu tài liệu và viết bảng theo thời gian thực.' },
  { icon: Swords, ten: 'Game đối kháng', moTa: 'Caro, Connect 4, Reversi 1v1 với bạn cùng trường.' },
  { icon: Users, ten: 'Cộng đồng bạn học', moTa: 'Kết bạn, xem ai đang trực tuyến và trò chuyện toàn trường.' },
] as const

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

  if (!giaTri) {
    return (
      <KhungNen>
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-5 pt-6 sm:px-8">
          <LogoCampus />
        </header>

        <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <section className="hidden lg:block" aria-label="Giới thiệu Digital Campus">
            <p className="text-sm font-medium text-brand">Trung tâm GDTX Định Quán</p>
            <h1 className="mt-4 text-[3.25rem] leading-[1.05] font-semibold tracking-[-0.035em] text-text-primary">
              Học cùng nhau,
              <br />
              <span className="text-text-secondary">ở bất cứ đâu.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-text-secondary">
              Không gian trực tuyến của trường — vào phòng học, chơi game và kết nối bạn học chỉ với một tài khoản.
            </p>
            <ul className="mt-10 space-y-5">
              {DIEM_NOI_BAT.map(({ icon: Icon, ten, moTa }) => (
                <li key={ten} className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface text-brand">
                    <Icon className="size-[18px]" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">{ten}</span>
                    <span className="mt-0.5 block max-w-sm text-sm leading-relaxed text-text-secondary">{moTa}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <h1 className="text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-text-primary">
                Học cùng nhau, ở bất cứ đâu.
              </h1>
              <p className="mt-2 text-sm text-text-secondary">Digital Campus · Trung tâm GDTX Định Quán</p>
            </div>
            {phien.data.thongBao && (
              <p
                role="status"
                className="mb-4 rounded-xl border border-warning/30 bg-warning-muted px-3.5 py-2.5 text-center text-sm font-medium text-warning"
              >
                {phien.data.thongBao}
              </p>
            )}
            <LoginCard onDaDangNhap={() => void queryClient.invalidateQueries({ queryKey: KHOA_PHIEN })} />
          </section>
        </main>

        <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-6 text-center text-xs text-text-tertiary sm:px-8 lg:text-left">
          © 2026–2027 Trung tâm GDTX Định Quán · Digital Campus
        </footer>
      </KhungNen>
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

/** Nền tối giản: hai quầng sáng mờ màu thương hiệu và lưới chấm rất nhạt — không dùng ảnh bitmap. */
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
