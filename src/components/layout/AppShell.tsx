import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { KhungChoTrang } from './KhungChoTrang'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { MobileNav } from './MobileNav'
import { CampusChatSheet } from './CampusChatSheet'

interface AppShellProps {
  children?: React.ReactNode
}

// Mã tin trò chuyện mới nhất đã xem, lưu theo tài khoản trên thiết bị này — chỉ để bật/tắt chấm "có tin mới".
const khoaTinDaXem = (accountId: number) => `c10a7:chat-da-xem:${accountId}`

function docTinDaXem(accountId: number): number | null {
  try {
    const giaTri = Number(localStorage.getItem(khoaTinDaXem(accountId)))
    return Number.isInteger(giaTri) && giaTri > 0 ? giaTri : null
  } catch {
    return null
  }
}

function ghiTinDaXem(accountId: number, id: number) {
  try {
    localStorage.setItem(khoaTinDaXem(accountId), String(id))
  } catch {
    // Trình duyệt chặn bộ nhớ: chấm "tin mới" chỉ đúng trong phiên này, không ảnh hưởng gì khác.
  }
}

export function AppShell({ children }: AppShellProps) {
  const { nguoiDung, dangXuat, lamMoiPhien, moAuthModal } = usePhien()
  const {
    trangThai,
    taiKhoanBiKhoa,
    onlineCount,
    latencyMs,
    doDoTre,
    ketNoiLai,
    messages,
    myPermissions,
    guiChat,
    xoaChat,
  } = useCampus()

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [idTinDaXem, setIdTinDaXem] = useState<number | null>(() => (nguoiDung ? docTinDaXem(nguoiDung.accountId) : null))

  // Chấm trên nút trò chuyện chỉ sáng khi có tin của người khác mới hơn lần xem gần nhất
  const tinCuoi = messages.length > 0 ? messages[messages.length - 1] : null
  const coTinNhanMoi =
    nguoiDung !== null &&
    !isChatOpen &&
    tinCuoi !== null &&
    tinCuoi.accountId !== nguoiDung.accountId &&
    (idTinDaXem === null || tinCuoi.id > idTinDaXem)

  const [activeDmTarget, setActiveDmTarget] = useState<import('./CampusChatSheet').DmTargetUser | null>(null)

  const datMoChat = (mo: boolean) => {
    if (!nguoiDung) {
      moAuthModal('dang_nhap')
      return
    }
    setIsChatOpen(mo)
    if (tinCuoi) {
      setIdTinDaXem(tinCuoi.id)
      ghiTinDaXem(nguoiDung.accountId, tinCuoi.id)
    }
  }

  useEffect(() => {
    const handleOpenChat = () => {
      if (!nguoiDung) {
        moAuthModal('dang_nhap')
        return
      }
      setActiveDmTarget(null)
      setIsChatOpen(true)
    }
    window.addEventListener('campus:open-chat', handleOpenChat)
    return () => window.removeEventListener('campus:open-chat', handleOpenChat)
  }, [nguoiDung, moAuthModal])

  useEffect(() => {
    const handleOpenDM = (e: Event) => {
      if (!nguoiDung) {
        moAuthModal('dang_nhap')
        return
      }
      const ce = e as CustomEvent<import('./CampusChatSheet').DmTargetUser>
      if (ce.detail) {
        setActiveDmTarget(ce.detail)
        setIsChatOpen(true)
      }
    }
    window.addEventListener('campus:open-dm', handleOpenDM)
    return () => window.removeEventListener('campus:open-dm', handleOpenDM)
  }, [nguoiDung, moAuthModal])

  const location = useLocation()
  const isGameRoom = location.pathname.startsWith('/game/')
  // Trang 3 cột (xếp hạng | nội dung | chat & bạn bè): Game và Học tập dùng khung rộng.
  const isWidePage =
    location.pathname.startsWith('/arena') || location.pathname.startsWith('/game') || location.pathname.startsWith('/learn')

  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenElement))
  useEffect(() => {
    const handleFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFs)
    return () => document.removeEventListener('fullscreenchange', handleFs)
  }, [])

  return (
    <div className="min-h-svh bg-canvas text-foreground">
      {/* Desktop Left Sidebar (Fixed) */}
      {!isFullscreen && <AppSidebar className="hidden lg:flex" />}

      {/* Main Content Column — shifts right by sidebar width on desktop */}
      <div className={cn('flex flex-col min-w-0', !isFullscreen && 'lg:ml-[240px] xl:ml-[256px]')}>
        {/* 1. Header (Sticky desktop & mobile) */}
        {!isFullscreen && (
          <AppHeader
            nguoiDung={nguoiDung}
            trangThai={trangThai}
            onlineCount={onlineCount}
            latencyMs={latencyMs}
            coTinNhanMoi={coTinNhanMoi}
            onDoDoTre={doDoTre}
            onKetNoiLai={ketNoiLai}
            onDangXuat={() => void dangXuat()}
            onToggleChat={() => datMoChat(!isChatOpen)}
            onLamMoiPhien={lamMoiPhien}
            onMoAuthModal={moAuthModal}
          />
        )}

        {/* 2. Main Content Container */}
        <main
          className={cn(
            'w-full flex-1 transition-all',
            isFullscreen
              ? 'p-0 m-0 max-w-none w-full h-screen'
              : isGameRoom
                ? 'w-full max-w-[1440px] px-2 sm:px-4 pt-2 sm:pt-4 pb-[calc(20px+env(safe-area-inset-bottom))] mx-auto flex flex-col justify-center'
                : isWidePage
                  ? 'max-w-[1600px] px-3 sm:px-6 pt-5 sm:pt-6 pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-8 mx-auto'
                  : 'max-w-[1440px] px-3 pt-5 pb-[calc(88px+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:pb-10 mx-auto'
          )}
        >
        {/* Single-device policy warning banner */}
        {trangThai === 'phien_bi_thay' ? (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                {taiKhoanBiKhoa ? (
                  <>
                    <p className="text-sm font-semibold text-text-primary">Tài khoản này đã bị quản trị viên khoá</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                      Bạn đã được đăng xuất khỏi Digital Campus. Liên hệ thầy cô hoặc Ban quản trị nhà trường nếu cần
                      mở lại tài khoản.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text-primary">Tài khoản này vừa đăng nhập trên thiết bị khác</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                      Mỗi tài khoản chỉ dùng trên một thiết bị cùng lúc, nên kết nối ở đây đã dừng. Muốn dùng tiếp trên
                      máy này, hãy tải lại trang.
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button variant="destructive" className="shrink-0" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          </div>
        ) : null}

        <Suspense fallback={<KhungChoTrang />}>{children || <Outlet />}</Suspense>
      </main>
      </div>

      {/* 3. Mobile Bottom Navigation */}
      {!isFullscreen && <MobileNav />}

      {/* 4. Global Campus Chat Drawer (On-demand Sheet) */}
      <CampusChatSheet
        open={isChatOpen}
        onOpenChange={datMoChat}
        messages={messages}
        myPermissions={myPermissions}
        onSendMessage={guiChat}
        onDeleteMessage={xoaChat}
        activeDmTarget={activeDmTarget}
        onSelectDmTarget={setActiveDmTarget}
        coTinNhanMoiCampus={coTinNhanMoi}
      />
    </div>
  )
}
