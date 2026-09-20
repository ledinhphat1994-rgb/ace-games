import { useState } from 'react'
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

export function AppShell({ children }: AppShellProps) {
  const { nguoiDung, dangXuat } = usePhien()
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

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      {/* 1. Header (Sticky desktop & mobile) */}
      <AppHeader
        nguoiDung={nguoiDung}
        trangThai={trangThai}
        onlineCount={onlineCount}
        latencyMs={latencyMs}
        messageCount={messages.length}
        onDoDoTre={doDoTre}
        onKetNoiLai={ketNoiLai}
        onDangXuat={() => void dangXuat()}
        onToggleChat={() => setIsChatOpen((v) => !v)}
      />

      {/* 2. Main Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-5 pb-24 md:pb-8">
        {/* Single-device policy warning banner */}
        {trangThai === 'phien_bi_thay' ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold">Phiên kết nối này đã bị ngắt tự động (Mã 4001)</p>
                <p className="text-xs text-muted-foreground">
                  Tài khoản của bạn vừa đăng nhập ở một thiết bị hoặc trình duyệt khác. Để bảo vệ an toàn và bảo mật, hệ thống chỉ duy trì 01 phiên hoạt động duy nhất.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs font-semibold"
              onClick={() => window.location.reload()}
            >
              Tải lại trang & Kết nối lại
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
        onOpenChange={setIsChatOpen}
        messages={messages}
        myPermissions={myPermissions}
        onSendMessage={guiChat}
        onDeleteMessage={xoaChat}
      />
    </div>
  )
}
