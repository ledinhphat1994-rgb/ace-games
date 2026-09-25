import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'
import { usePhien } from '@/app/phien'
import { useCampus } from '@/hooks/use-campus'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
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
  const { nguoiDung, dangXuat, lamMoiPhien } = usePhien()
  const {
    trangThai,
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
  const [idTinDaXem, setIdTinDaXem] = useState<number | null>(() => docTinDaXem(nguoiDung.accountId))

  // Chấm trên nút trò chuyện chỉ sáng khi có tin của người khác mới hơn lần xem gần nhất (trước đây sáng hễ có tin).
  const tinCuoi = messages.length > 0 ? messages[messages.length - 1] : null
  const coTinNhanMoi =
    !isChatOpen &&
    tinCuoi !== null &&
    tinCuoi.accountId !== nguoiDung.accountId &&
    (idTinDaXem === null || tinCuoi.id > idTinDaXem)

  const datMoChat = (mo: boolean) => {
    setIsChatOpen(mo)
    if (tinCuoi) {
      setIdTinDaXem(tinCuoi.id)
      ghiTinDaXem(nguoiDung.accountId, tinCuoi.id)
    }
  }

  useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true)
    window.addEventListener('campus:open-chat', handleOpenChat)
    return () => window.removeEventListener('campus:open-chat', handleOpenChat)
  }, [])

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
      />

      {/* 2. Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-[76px] sm:px-6 sm:pt-8 md:pb-10">
        {/* Single-device policy warning banner */}
        {trangThai === 'phien_bi_thay' ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/35 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Phiên kết nối này đã bị ngắt tự động (Mã 4001)</p>
                <p className="text-xs text-destructive/70 mt-0.5">
                  Tài khoản của bạn vừa đăng nhập ở một thiết bị hoặc trình duyệt khác. Hệ thống chỉ duy trì 01 phiên hoạt động.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => window.location.reload()}
            >
              Tải lại trang &amp; Kết nối lại
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
