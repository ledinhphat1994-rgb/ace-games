import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppHeader } from './AppHeader'
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
      setIsChatOpen(true)
    }
    window.addEventListener('campus:open-chat', handleOpenChat)
    return () => window.removeEventListener('campus:open-chat', handleOpenChat)
  }, [nguoiDung, moAuthModal])

  const location = useLocation()
  const isWidePage = location.pathname.startsWith('/arena') || location.pathname.startsWith('/game')

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* 1. Header (Sticky desktop & mobile) */}
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

      {/* 2. Main Content Container */}
      <main
        className={cn(
          'mx-auto w-full flex-1 transition-all',
          isWidePage
            ? 'max-w-[1920px] px-2.5 sm:px-4 pt-4 pb-[76px] md:pb-8'
            : 'max-w-7xl px-4 pt-6 pb-[76px] sm:px-6 sm:pt-8 md:pb-10'
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

        {children || <Outlet />}
      </main>

      {/* 3. Mobile Bottom Navigation */}
      <MobileNav />

      {/* 4. Global Campus Chat Drawer (On-demand Sheet) */}
      <CampusChatSheet
        open={isChatOpen}
        onOpenChange={datMoChat}
        messages={messages}
        myPermissions={myPermissions}
        onSendMessage={guiChat}
        onDeleteMessage={xoaChat}
      />
    </div>
  )
}
